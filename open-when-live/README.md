# open-when-live

This program will open a Twitch Stream in your default browser if and when they go live.

## Usage

If you haven't done so already, [create an app in the Twitch Developers Console](https://dev.twitch.tv/console/apps).
Save the Client ID and Client Secret (which will not be shown again).

From the root of this project, run:

```shell
deno task open-when-live <twitch-streamer-login-or-id> <interval-minutes = 5>
```

After the first run, a `.twitch.json` file will be created in the project root. Update it with your Twitch App's client
ID and secret. Run the program again, and it will open the stream once they go live, checking every 5 minutes by
default.

## Permissions

This program uses the following Deno permissions:

| Permission | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| `read`     | `./`                                                                   |
| Reason     | Get Current Working Directory, read `.twitch.json` config file         |
| `write`    | `./.twitch.json`                                                       |
| Reason     | Write to config file                                                   |
| `run`      | `open,cmd,xdg-open`                                                    |
| Reason     | Run built-in command to open default browser based on OS               |
| `net`      | `id.twitch.tv,api.twitch.tv`                                           |
| Reason     | Validate Twitch Access Tokens, Call Twitch API to get user/stream info |
