import type {
	GitHubCredentialsJson,
	GitHubPublicKeyJson,
	GoogleAccessTokenJson,
	GoogleCredentialsJson,
} from "./types.ts";
import { join, open, sodium } from "./deps.ts";

const VERSION = "1.0.0";

const args = Deno.args;

const GITHUB_CONFIG_FILE_PATH = join(Deno.cwd(), ".github.json");
const GOOGLE_CONFIG_FILE_PATH = join(Deno.cwd(), ".google.json");

const STATE = encodeURIComponent(crypto.randomUUID());

if (args.length > 0 && args[0] === "go") {
	checkConfigFileExists().then(continueIfFileExists).catch((error) => {
		console.error(error);
		Deno.exit(1);
	});
} else {
	showHelp();
}

function showHelp(): void {
	console.info(`google-oauth v${VERSION}`);
}

async function checkConfigFileExists(): Promise<void> {
	try {
		let file = await Deno.stat(GOOGLE_CONFIG_FILE_PATH);
		if (!file.isFile) {
			return Promise.reject("Item was found, but is not a file.");
		}
		file = await Deno.stat(GITHUB_CONFIG_FILE_PATH);
		if (!file.isFile) {
			return Promise.reject("Item was found, but is not a file.");
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

async function continueIfFileExists(): Promise<void> {
	const configText = await Deno.readTextFile(GOOGLE_CONFIG_FILE_PATH);
	const googleJson = JSON.parse(configText) as GoogleCredentialsJson;
	console.info("Opening the browser to authorize the app...");
	presentAuthWindow(googleJson);
	console.info("Waiting for response from authorization screen...");
	const code = await listenForAuthorizationCode();
	console.info("Fetching Access and Refresh Token from Google...");
	const accessTokenJson = await getAccessToken(googleJson, code);
	console.info("Encrypting and Setting GitHub Actions Secret...");
	await encryptAndStoreAccessToken(accessTokenJson);
	console.info("Success!");
}

function presentAuthWindow(googleJson: GoogleCredentialsJson): void {
	const scopes = [
		"https://www.googleapis.com/auth/spreadsheets.readonly",
		"https://www.googleapis.com/auth/youtube.readonly",
	];
	const url = [
		"https://accounts.google.com/o/oauth2/v2/auth",
		`?client_id=${encodeURIComponent(googleJson.web.client_id)}`,
		`&redirect_uri=${encodeURIComponent(googleJson.web.redirect_uris[0])}`,
		`&scope=${encodeURIComponent(scopes.join(" "))}`,
		`&state=${STATE}`,
		"&response_type=code",
		"&access_type=offline",
		"&include_granted_scopes=true",
		"&prompt=consent",
	].join("");
	try {
		open(url);
	} catch (_error) {
		console.info(`If your browser did not open, go to this URL to authorize with Google: ${url}`);
	}
}

async function listenForAuthorizationCode(): Promise<string> {
	let code = "";
	outer:
	for await (const conn of Deno.listen({ port: 3000 })) {
		for await (const e of Deno.serveHttp(conn)) {
			const params = new URL(e.request.url).searchParams;
			const error = params.get("error");
			const returnedState = params.get("state");
			if (!params.toString()) {
				await e.respondWith(new Response("You're all done authorizing the app, and may close this tab."));
				await new Promise((resolve) => setTimeout(resolve, 1000));
				break outer;
			} else if (returnedState !== STATE) {
				await e.respondWith(
					new Response(`OAuth State Mismatch, Expected ${STATE}, got ${returnedState}`, { status: 400 }),
				);
			} else {
				code = params.get("code") ?? "";
				if (code) {
					await e.respondWith(Response.redirect("http://localhost:3000"));
				} else if (error) {
					await e.respondWith(new Response(`There was an error during authorization -- ${error}`, { status: 400 }));
				} else {
					await e.respondWith(new Response("Not Found", { status: 404 }));
				}
			}
		}
	}
	return code;
}

async function getAccessToken(googleJson: GoogleCredentialsJson, code: string): Promise<GoogleAccessTokenJson> {
	const url = "https://oauth2.googleapis.com/token";
	const init: RequestInit = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			"client_id": googleJson.web.client_id,
			"client_secret": googleJson.web.client_secret,
			"redirect_uri": googleJson.web.redirect_uris[0],
			code,
			"grant_type": "authorization_code",
		}),
	};
	const response = await fetch(url, init);
	if (response.ok) {
		const json = await response.json() as GoogleAccessTokenJson;
		if (typeof json.refresh_token === "undefined") {
			throw new Error("Unexpected missing Refresh Token");
		}
		return json;
	} else {
		throw new Error(`Error getting Access Token - ${response.status}`);
	}
}

async function encryptAndStoreAccessToken(accessToken: GoogleAccessTokenJson): Promise<void> {
	await sodium.ready.then(async () => {
		const gitHubConfigText = await Deno.readTextFile(GITHUB_CONFIG_FILE_PATH);
		const gitHubJson = JSON.parse(gitHubConfigText) as GitHubCredentialsJson;
		const publicKey = await getRepoPublicKey(gitHubJson);
		const binKey = sodium.from_base64(publicKey.key, 1);
		const binSecret = sodium.from_string(JSON.stringify(accessToken.refresh_token));
		const encryptedBytes = sodium.crypto_box_seal(binSecret, binKey);
		const encryptedString = sodium.to_base64(encryptedBytes, 1);

		const url =
			`https://api.github.com/repos/${gitHubJson.owner}/${gitHubJson.repo}/actions/secrets/GOOGLE_REFRESH_TOKEN`;
		const init: RequestInit = {
			method: "PUT",
			headers: new Headers({
				Authorization: `Bearer ${gitHubJson.accessToken}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			}),
			body: JSON.stringify(
				{
					"encrypted_value": encryptedString,
					"key_id": publicKey.key_id,
				},
			),
		};
		const response = await fetch(url, init);
		if (!response.ok) {
			throw new Error(`Could not encrypt and put GitHub Action Secret ${response.status}`);
		}
	});
}

async function getRepoPublicKey(gitHubJson: GitHubCredentialsJson): Promise<GitHubPublicKeyJson> {
	const url = `https://api.github.com/repos/${gitHubJson.owner}/${gitHubJson.repo}/actions/secrets/public-key`;
	const init: RequestInit = {
		headers: new Headers({
			Authorization: `Bearer ${gitHubJson.accessToken}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
		}),
	};
	const response = await fetch(url, init);
	if (response.ok) {
		const json = await response.json() as GitHubPublicKeyJson;
		return json;
	} else {
		throw new Error(`Error getting GitHub Repo Public Key, ${response.status}`);
	}
}
