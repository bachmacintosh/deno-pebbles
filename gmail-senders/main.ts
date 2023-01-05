import type { GoogleCredentialsJson } from "./types.ts";
import { join } from "./deps.ts";
import getAccessToken from "./functions/google/getAccessToken.ts";
import listenForAuthorizationCode from "./functions/http/listenForAuthorizationCode.ts";
import openAuthorizationWindow from "./functions/util/openAuthorizationWindow.ts";
import { getMessageIds } from "./functions/gmail/getMessageIds.ts";
import { getMessageSender } from "./functions/gmail/getMessageSender.ts";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const VERSION = "1.0.0";

const args = Deno.args;

const GOOGLE_CONFIG_FILE_PATH = join(Deno.cwd(), ".gmail.json");
const SENDER_FILE_PATH = join(Deno.cwd(), "senders.txt");

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
  console.info(`gmail-senders v${VERSION}`);
}

async function checkConfigFileExists(): Promise<void> {
  try {
    const file = await Deno.stat(GOOGLE_CONFIG_FILE_PATH);
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
  console.info("Opening the browser to authorize the app...");
  openAuthorizationWindow(googleJson, SCOPES, STATE);
  console.info("Waiting for response from authorization screen...");
  const code = await listenForAuthorizationCode(STATE);
  console.info("Fetching Access Token from Google...");
  const accessTokenJson = await getAccessToken(googleJson, code);
  console.info("Fetching Message IDs...");
  const messageIds = await getMessageIds(accessTokenJson.access_token);
  console.info("Fetching all unique message senders");
  const enc = (s: string) => new TextEncoder().encode(s);
  const totalMessages = messageIds.length;
  let messageCount = 1;
  const senders: string[] = [];
  for (const id of messageIds) {
    const sender = await getMessageSender(accessTokenJson.access_token, id);
    if (sender) {
      await Deno.stdout.write(
        enc(`Adding Sender ${messageCount}/${totalMessages}\r`),
      );
      if (!senders.includes(sender)) {
        senders.push(sender);
      }
    }
    messageCount++;
  }
  console.info("\n");
  console.info("Opening Sender File...");
  const senderFile = await Deno.open(SENDER_FILE_PATH, {
    read: true,
    append: true,
    create: true,
  });
  messageCount = 1;
  for (const sender of senders) {
    await Deno.stdout.write(
      enc(`Writing Sender ${messageCount}/${totalMessages}...\r`),
    );
    const encodedSender = enc(`${sender}\n`);
    await senderFile.write(encodedSender);
    messageCount++;
  }
  console.info("\n");
  console.info("Closing Sender File...");
  senderFile.close();
  console.info("Success!");
}
