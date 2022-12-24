import type { GitHubCredentialsJson, GoogleCredentialsJson } from "./types.ts";
import { join } from "./deps.ts";
import encryptAndStoreRefreshToken from "./functions/github/encryptAndStoreRefreshToken.ts";
import getAccessToken from "./functions/google/getAccessToken.ts";
import listenForAuthorizationCode from "./functions/http/listenForAuthorizationCode.ts";
import openAuthorizationWindow from "./functions/util/openAuthorizationWindow.ts";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

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
  const googleText = await Deno.readTextFile(GOOGLE_CONFIG_FILE_PATH);
  const googleJson = JSON.parse(googleText) as GoogleCredentialsJson;
  const gitHubText = await Deno.readTextFile(GITHUB_CONFIG_FILE_PATH);
  const gitHubJson = JSON.parse(gitHubText) as GitHubCredentialsJson;
  console.info("Opening the browser to authorize the app...");
  openAuthorizationWindow(googleJson, SCOPES, STATE);
  console.info("Waiting for response from authorization screen...");
  const code = await listenForAuthorizationCode(STATE);
  console.info("Fetching Access and Refresh Token from Google...");
  const accessTokenJson = await getAccessToken(googleJson, code);
  console.info("Encrypting and Setting GitHub Actions Secret...");
  await encryptAndStoreRefreshToken(gitHubJson, accessTokenJson);
  console.info("Success!");
}
