# gmail-senders

This program will go through all emails in a GMail account (except Trash and
Spam), and export a unique list of senders' email addresses. Useful for those
who want to start moving accounts to new email addresses.

## Prerequisites

You will need:

- [A Google OAuth2 Client](https://developers.google.com/identity/protocols/oauth2/web-server)
  with `http://localhost:3000` as one of the allowed redirect URIs, and have the
  [gmail.readonly scope](https://developers.google.com/identity/protocols/oauth2/scopes)
  specified in the OAuth Consent Screen settings.

## Usage

Store your Google OAuth2 client credentials as `.gmail.json` in the project
root. It should look similar to this:

```json
{
  "web": {
    "client_id": "your-client-id.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your-client-secret",
    "redirect_uris": ["http://localhost:3000"]
  }
}
```

From the root of this project, run:

```shell
deno task gmail-senders go
```

When the program runs, your default browser will open a new tab. Sign into
Google if not already, otherwise select your account and authorize the app.

## Permissions

This program uses the following Deno permissions:

| Permission | Value                                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| `read`     | `./`                                                                          |
| Reason     | Get Current Working Directory, read `.google.json` config file                |
| `write`    | `./senders.txt`                                                               |
| Reason     | Write to a list of senders' emails                                            |
| `run`      | `open,cmd,xdg-open`                                                           |
| Reason     | Run built-in command to open default browser based on OS                      |
| `net`      | `0.0.0.0:3000,accounts.google.com,gmail.googleapis.com,oauth2.googleapis.com` |
| Reason     | Run an HTTP server to handle OAuth Flow, Call Google APIs                     |
