import type { GoogleAccessTokenJson, GoogleCredentialsJson } from "../../types.ts";

export default async function getAccessToken(
  googleJson: GoogleCredentialsJson,
  code: string,
): Promise<GoogleAccessTokenJson> {
  const url = "https://oauth2.googleapis.com/token";
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "client_id": googleJson.web.client_id,
      "client_secret": googleJson.web.client_secret,
      "redirect_uri": googleJson.web.redirect_uris[0],
      code,
      "grant_type": "authorization_code",
    }),
  };
  const response = await fetch(url, init);
  if (response.ok) {
    const json = await response.json() as GoogleAccessTokenJson;
    return json;
  } else {
    const text = await response.text();
    throw new Error(
      `Error getting Access Token - ${response.status} - ${text}`,
    );
  }
}
