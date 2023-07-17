# open-when-live

This program will open a Twitch Stream in your default browser if and when they go live.

## Usage

If you haven't done so already, [create an app in the Twitch Developers Console](https://dev.twitch.tv/console/apps).
Save the Client ID and Client Secret (which will not be shown again).

From the root of this project, run:

```shell
deno task open-when-live <twitch-streamer-login-or-id>
```

After the first run, a `.twitch.json` file will be created in the project root. Update it with your Twitch App's client
ID and secret. The `accessToken`will be updated automatically the next time the program runs.

You will need to authorize your Twitch App against your account. Once that's done, we'll be able to connect to Twitch's
EventSub API, and open the stream in your browser as soon as it goes live.

## Permissions

This program uses the following Deno permissions:

| Permission | Value                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `read`     | `./`                                                                      |
| Reason     | Get Current Working Directory, read `.twitch.json` config file            |
| `write`    | `./.twitch.json`                                                          |
| Reason     | Write to config file                                                      |
| `run`      | Mac: `open, caffeinate`                                                   |
|            | Windows: `cmd`                                                            |
|            | Linux: `xdg-open`                                                         |
| Reason     | Run built-in command to open default browser based on OS, and             |
|            | keep the computer from sleeping on macOS                                  |
| `net`      | `id.twitch.tv,api.twitch.tv,eventsub.wss.twitch.tv`                       |
| Reason     | Validate Twitch Access Tokens, Call Twitch API to get user/stream info,   |
|            | and connect to Twitch's EventSub API to be notified when a stream is live |
