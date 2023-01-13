import type { TwitchAccessTokenValidateJson, TwitchApiError, TwitchConfigJson } from "../../../types.ts";
import refreshAccessToken from "./refreshAccessToken.ts";

export default async function validateAccessToken(
  config: TwitchConfigJson,
): Promise<void> {
  const tokenExpiry = config.tokenExpires.getTime() - new Date().getTime();
  if (config.accessToken === "") {
    console.info("INFO: Access Token is missing. Getting a new one...");
    await refreshAccessToken(config);
  } else if (tokenExpiry < 60 * 1000) {
    console.info("INFO: Access Token has expired. Getting a new one...");
    await refreshAccessToken(config);
  } else {
    const url = "https://id.twitch.tv/oauth2/validate";
    const headers = new Headers({
      Authorization: `Bearer ${config.accessToken}`,
    });
    const init: RequestInit = {
      headers,
    };
    const response = await fetch(url, init);
    if (response.status === 401) {
      const json = (await response.json()) as TwitchApiError;
      console.info(`INFO: Twitch API Access Token Error: ${json.message}`);
      console.info(`INFO: Attempting to Refresh the token...`);
      await refreshAccessToken(config);
    } else {
      const json = (await response.json()) as TwitchAccessTokenValidateJson;
      config.tokenExpires = new Date(Date.now() + json.expires_in * 1000);
      console.info("Token successfully validated.");
    }
  }
}
