# google-oauth

This program will store a Google API Refresh Token in a GitHub Repository Secret.

## Prerequisites

You will need:

- [A Fine-grained Personal Access Token from GitHub](https://github.com/settings/tokens?type=beta)
- A GitHub Repository to store the secret in
- [A Google OAuth2 Client](https://developers.google.com/identity/protocols/oauth2/web-server) with
  `http://localhost:3000` as one of the allowed redirect URIs, and have the
  [desired scopes](https://developers.google.com/identity/protocols/oauth2/scopes) specified in the OAuth Consent Screen
  settings.

## Usage

Store your Google OAuth2 client credentials as `.google.json` in the project root. It should look similar to this:

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

Store your GitHub Fine-grained Personal Access Token, as well as the owner and repo name, in `.github.json` in the
project root; it should look similar to this:

```json
{
  "accessToken": "github_pat_abc123...",
  "owner": "bachmacintosh",
  "repo": "deno-pebbles"
}
```

For my purposes, this program tries to access the Google Sheets and YouTube Data APIs. If you want to access different
APIs, update the `SCOPES` variable in `main.ts` with your desired scopes
[from this list](https://developers.google.com/identity/protocols/oauth2/scopes).

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];
```

From the root of this project, run:

```shell
deno task google-oauth go
```

When the program runs, your default browser will open a new tab. Sign into Google if not already, otherwise select your
account and authorize the app.

## Permissions

This program uses the following Deno permissions:

| Permission | Value                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| `read`     | `./`                                                                               |
| Reason     | Get Current Working Directory, read `.github.json` and `.google.json` config files |
| `run`      | `open,cmd,xdg-open`                                                                |
| Reason     | Run built-in command to open default browser based on OS                           |
| `net`      | `0.0.0.0:3000,accounts.google.com,api.github.com,oauth2.googleapis.com`            |
| Reason     | Run an HTTP server to handle OAuth Flow, Call GitHub and Google APIs               |
