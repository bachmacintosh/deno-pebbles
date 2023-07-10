import { join, open } from "../deps.ts";
import TwitchAPI from "./classes/TwitchAPI.ts";
import TwitchEventSub from "./classes/TwitchEventSub.ts";

const { os } = Deno.build;

if (os !== "darwin" && os !== "windows" && os !== "linux") {
  console.error("Sorry, your OS isn't supported.");
  Deno.exit(1);
}

const VERSION = "2.0.0";

const showHelp = () => {
  const permissions = {
    read: "./",
    write: "./.twitch.json",
    run: "open (Mac), cmd (Windows), xdg-open (Linux)",
    net: "0.0.0.0:8000, id.twitch.tv, api.twitch.tv, eventsub.wss.twitch.tv",
  };
  console.info(`open-when-live v${VERSION}`);
  console.info(
    "Usage: open-when-live <twitch-user-name-or-id>",
  );
  console.info("Permissions:");
  console.table(permissions);
  Deno.exit();
};

const args = Deno.args;
let canCaffeinate = false;

if (
  args.length === 0 || !args[0] ||
  args[0] === "--help" || args[0] === "-h" ||
  args[0] === "--h"
) {
  showHelp();
}

console.info("Checking Permissions...");

const readCwd = { name: "read", path: "./" } as const;
const readCwdPermission = await Deno.permissions.query(readCwd);
if (readCwdPermission.state === "prompt") {
  console.info(
    "We need to be able to read the current directory of this program (./), to get the path to the Twitch Config File",
  );
  const result = await Deno.permissions.request(readCwd);
  if (result.state === "denied") {
    console.error(
      "⛔ Denied permission to read program's current folder -- exiting.",
    );
    Deno.exit(1);
  }
}

const writeTwitchConfig = {
  name: "write",
  path: "./.twitch.json",
} as const;
const writeTwitchConfigPermission = await Deno.permissions.query(
  writeTwitchConfig,
);
if (writeTwitchConfigPermission.state === "prompt") {
  console.info(
    "We need to be able to read/write to a file called .twitch.json, to check a Client ID/Secret, and read/write Access Tokens for later use",
  );
  const result = await Deno.permissions.request(writeTwitchConfig);
  if (result.state === "denied") {
    console.error(
      "⛔ Denied permission to read/write .twitch.json -- exiting.",
    );
    Deno.exit(1);
  }
}

if (os === "darwin") {
  const openBrowserMac = {
    name: "run",
    command: "open",
  } as const;
  const openBrowserMacPermission = await Deno.permissions.query(openBrowserMac);
  if (openBrowserMacPermission.state === "prompt") {
    console.info(
      "We need to be able to open your browser to Twitch for authorization and opening the stream later on.",
    );
    const result = await Deno.permissions.request(openBrowserMac);
    if (result.state === "denied") {
      console.error(
        "⛔ Denied permission to open the browser -- exiting.",
      );
      Deno.exit(1);
    }
  }
  const caffeinateProcess = {
    name: "run",
    command: "caffeinate",
  } as const;
  const caffeinateProcessPermission = await Deno.permissions.query(
    caffeinateProcess,
  );
  if (caffeinateProcessPermission.state === "prompt") {
    console.info(
      "[optional] We can keep your Mac from sleeping if you allow us to use Apple's built in 'caffeinate' command.",
    );
    const result = await Deno.permissions.request(caffeinateProcess);
    if (result.state === "granted") {
      canCaffeinate = true;
    } else {
      console.info(
        "That's okay. Just bear in mind that your Mac may fall asleep after some time.",
      );
    }
  } else if (caffeinateProcessPermission.state === "granted") {
    canCaffeinate = true;
  }
} else if (os === "windows") {
  const openBrowserWindows = {
    name: "run",
    command: "cmd",
  } as const;
  const openBrowserWindowsPermission = await Deno.permissions.query(
    openBrowserWindows,
  );
  if (openBrowserWindowsPermission.state === "prompt") {
    console.info(
      "We need to be able to open your browser to Twitch for authorization and opening the stream later on.",
    );
    const result = await Deno.permissions.request(openBrowserWindows);
    if (result.state === "denied") {
      console.error(
        "⛔ Denied permission to open the browser -- exiting.",
      );
      Deno.exit(1);
    }
  }
} else if (os === "linux") {
  const openBrowserLinux = {
    name: "run",
    command: "xdg-open",
  } as const;
  const openBrowserLinuxPermission = await Deno.permissions.query(
    openBrowserLinux,
  );
  if (openBrowserLinuxPermission.state === "prompt") {
    console.info(
      "We need to be able to open your browser to Twitch for authorization and opening the stream later on.",
    );
    const result = await Deno.permissions.request(openBrowserLinux);
    if (result.state === "denied") {
      console.error(
        "⛔ Denied permission to open the browser -- exiting.",
      );
      Deno.exit(1);
    }
  }
}

const runLocalServer = {
  name: "net",
  host: "0.0.0.0:8000",
} as const;
const runLocalServerPermission = await Deno.permissions.query(runLocalServer);
if (runLocalServerPermission.state === "prompt") {
  console.info(
    "We need to be able to run a local web server to handle Twitch's authorization flow.",
  );
  const result = await Deno.permissions.request(runLocalServer);
  if (result.state === "denied") {
    console.error(
      "⛔ Denied permission to run a local web server -- exiting.",
    );
    Deno.exit(1);
  }
}

const connectToTwitchOAuth = {
  name: "net",
  host: "id.twitch.tv",
} as const;
const connectToTwitchOAuthPermission = await Deno.permissions.query(
  connectToTwitchOAuth,
);
if (connectToTwitchOAuthPermission.state === "prompt") {
  console.info(
    "We need to be able to connect to Twitch's OAuth server to log you in and keep you logged in.",
  );
  const result = await Deno.permissions.request(connectToTwitchOAuth);
  if (result.state === "denied") {
    console.error(
      "⛔ Denied permission to connect to Twitch's OAuth Server -- exiting.",
    );
    Deno.exit(1);
  }
}

const connectToTwitchAPI = {
  name: "net",
  host: "api.twitch.tv",
} as const;
const connectToTwitchAPIPermission = await Deno.permissions.query(
  connectToTwitchAPI,
);
if (connectToTwitchAPIPermission.state === "prompt") {
  console.info(
    "We need to be able to connect to Twitch's HTTP API to subscribe to events (e.g. stream going online).",
  );
  const result = await Deno.permissions.request(connectToTwitchAPI);
  if (result.state === "denied") {
    console.error(
      "⛔ Denied permission to connect to Twitch's HTTP API -- exiting.",
    );
    Deno.exit(1);
  }
}

const connectToTwitchEventSub = {
  name: "net",
  host: "eventsub.wss.twitch.tv",
} as const;
const connectToTwitchEventSubPermission = await Deno.permissions.query(
  connectToTwitchEventSub,
);
if (connectToTwitchEventSubPermission.state === "prompt") {
  console.info(
    "We need to be able to connect to Twitch's EventSub API to to listen to subscribed events (e.g. stream coming online).",
  );
  const result = await Deno.permissions.request(connectToTwitchEventSub);
  if (result.state === "denied") {
    console.error(
      "⛔ Denied permission to connect to Twitch's HTTP API -- exiting.",
    );
    Deno.exit(1);
  }
}

console.info("---");

console.info(
  "This program may open your browser to log into Twitch and/or open a Twitch\nstream.",
);
const weAreGo = confirm(
  "Is that OK?",
);

if (weAreGo) {
  const CONFIG_FILE_PATH = join(Deno.cwd(), ".twitch.json");

  const api = new TwitchAPI(CONFIG_FILE_PATH);

  let user: string | number = "";
  const userString = Deno.args[0];
  const userNumber = Number.parseInt(userString, 10);
  if (!Number.isNaN(userNumber)) {
    user = userNumber;
  } else {
    user = userString.toLowerCase();
  }

  const validUser = await api.validateTwitchUser(user);

  if (!validUser) {
    console.error(
      `Twitch says the user name/ID ${userString} is invalid. Check spelling and try again.`,
    );
    Deno.exit(1);
  }

  const existingStream = await api.getExistingStream(validUser);

  if (typeof existingStream === "string") {
    console.info("Stream is already live, opening...");
    await open(existingStream);
  } else {
    if (canCaffeinate) {
      console.info("Spawning Caffeinate Sub-Process...");
      const caffeinate = new Deno.Command("caffeinate", {
        args: ["-dims", `-w ${Deno.pid}`],
      });
      const caffeinateChildProcess = caffeinate.spawn();
      console.info(`Caffeinate Sub-Process ID: ${caffeinateChildProcess.pid}`);
      const _es = new TwitchEventSub(api, validUser);
      console.info("Terminating Caffeinate Sub-Process...");
      caffeinateChildProcess.kill("SIGTERM");
    } else {
      const _es = new TwitchEventSub(api, validUser);
    }
  }
}
