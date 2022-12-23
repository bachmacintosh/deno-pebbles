import { join, open } from "./deps.ts";
import type { GoogleCredentialsJson } from "./types.ts";

const VERSION = "1.0.0";

const args = Deno.args;

const CONFIG_FILE_PATH = join(Deno.cwd(), ".google.json");

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
		const file = await Deno.stat(CONFIG_FILE_PATH);
		if (!file.isFile) {
			return Promise.reject("Item was found, but is not a file.");
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

async function continueIfFileExists(): Promise<void> {
	const configText = await Deno.readTextFile(CONFIG_FILE_PATH);
	const googleJson = JSON.parse(configText) as GoogleCredentialsJson;
	console.info("Opening the browser to authorize the app...");
	presentAuthWindow(googleJson);
	console.info("Waiting for response from authorization screen...");
	await listenforAuthorization();
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
		"&response_type=code",
		`&scope=${encodeURIComponent(scopes.join(" "))}`,
		"&access_type=offline",
		"&include_granted_scopes=true",
		"&prompt=consent",
	].join("");
	open(url);
	console.info(`URL in case you need to open it again: ${url}`);
}

async function listenforAuthorization(): Promise<void> {
	let code = "";
	outer:
	for await (const conn of Deno.listen({ port: 3000 })) {
		for await (const e of Deno.serveHttp(conn)) {
			code = new URL(e.request.url).searchParams.get("code") ?? "";
			await e.respondWith(new Response("Hello!"));
			if (code) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				break outer;
			}
		}
	}
}
