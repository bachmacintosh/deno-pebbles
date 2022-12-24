import { join, open } from "./deps.ts";
import type { ConfigJson } from "./types.ts";
import reviveJson from "./functions/util/reviveJson.ts";
import streamIsLive from "./functions/twitch/streamIsLive.ts";
import validateAccessToken from "./functions/twitch/validateAccessToken.ts";
import validateTwitchUser from "./functions/twitch/validateTwitchUser.ts";

const VERSION = "1.0.0";
const CONFIG_FILE_PATH = join(Deno.cwd(), ".twitch.json");

const args = Deno.args;

if (args.length === 0 || args[0] === "--help" || args[0] === "-h" || args[0] === "--h") {
  showHelp();
}

const twitchUser = args[0];

let intervalMinutes = 5;
if (typeof args[1] !== "undefined") {
  intervalMinutes = parseInt(args[1], 10);
  if (Number.isNaN(intervalMinutes)) {
    throw new Error("Interval Minutes must be a valid number.");
  }
  if (intervalMinutes <= 0) {
    throw new Error("Interval Minutes must be > 0 minutes.");
  }
  if (intervalMinutes >= 100) {
    console.warn(
      "WARN: Interval Minutes are >= 100. Just a heads up in case you fat-fingered a number.",
    );
  }
}

checkConfigFileExists()
  .then(continueIfFileExists, createFileAndExit)
  .catch((error) => {
    console.error(error);
    Deno.exit(1);
  });

function showHelp(): void {
  const permissions = {
    read: "./",
    write: "./.twitch.json",
    run: "open,cmd,xdg-open",
    net: "id.twitch.tv,api.twitch.tv",
  };
  console.info(`open-when-live v${VERSION}`);
  console.info(
    "Usage: open-when-live <twitch-user-name-or-id> <interval-minues = 5>",
  );
  console.info("Permissions:");
  console.table(permissions);
  Deno.exit();
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
  const configJson = JSON.parse(configText, reviveJson) as ConfigJson;
  if (configJson.clientId === "" || configJson.clientSecret === "") {
    throw new Error(
      "You must provide the cliendId and clientSecret of your Twitch App for this program to work.",
    );
  }
  console.info("Validating Access Token...");
  await validateAccessToken(configJson);

  console.info("Updating Config file...");
  await Deno.writeTextFile(
    CONFIG_FILE_PATH,
    JSON.stringify(configJson, null, 2),
  );

  const twitchNumber = parseInt(twitchUser, 10);

  console.info("Validating Twitch User...");
  const twitchUrl = await validateTwitchUser(
    configJson,
    Number.isNaN(twitchNumber) ? twitchUser : twitchNumber,
  );

  console.info(
    `Their Twitch stream will open as soon as they go live, checking every ${intervalMinutes} minutes.`,
  );
  await streamIsLive(
    configJson,
    Number.isNaN(twitchNumber) ? twitchUser : twitchNumber,
    intervalMinutes,
  );
  console.info("Stream is live. Opening now...");
  await open(twitchUrl, {});
}

async function createFileAndExit(): Promise<void> {
  const defaultJson: ConfigJson = {
    clientId: "",
    clientSecret: "",
    accessToken: "",
    tokenExpires: new Date(0),
  };
  await Deno.writeTextFile(
    CONFIG_FILE_PATH,
    JSON.stringify(defaultJson, null, 2),
    {
      createNew: true,
    },
  );
  console.info(
    "INFO: Created a twitch.json file in the same directory as this program.",
  );
  console.info(
    "INFO: You'll need to populate the clientId and clientSecret with your Twitch App credentials to use this script.",
  );
}
