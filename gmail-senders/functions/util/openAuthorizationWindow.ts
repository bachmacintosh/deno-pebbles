import type { GoogleCredentialsJson } from "../../types.ts";
import { open } from "../../deps.ts";

export default function openAuthorizationWindow(
  googleJson: GoogleCredentialsJson,
  scopes: string[],
  state: string,
): void {
  const url = [
    "https://accounts.google.com/o/oauth2/v2/auth",
    `?client_id=${encodeURIComponent(googleJson.web.client_id)}`,
    `&redirect_uri=${encodeURIComponent(googleJson.web.redirect_uris[0])}`,
    `&scope=${encodeURIComponent(scopes.join(" "))}`,
    `&state=${state}`,
    "&response_type=code",
    "&include_granted_scopes=true",
    "&prompt=consent",
  ].join("");
  try {
    open(url);
  } catch (_error) {
    console.info(
      `If your browser did not open, go to this URL to authorize with Google: ${url}`,
    );
  }
}
