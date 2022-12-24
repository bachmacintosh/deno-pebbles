import type { ConfigJson, TwitchApiError, TwitchStreamJson } from "../../types.ts";

export default async function streamIsLive(
  config: ConfigJson,
  user: string | number,
  intervalMinutes: number,
): Promise<void> {
  let streamIsNotLive = true;
  let url = "https://api.twitch.tv/helix/streams";
  if (typeof user === "string") {
    url += `?user_login=${user}`;
  } else {
    url += `?user_id=${user}`;
  }
  const headers = new Headers({
    Authorization: `Bearer ${config.accessToken}`,
    "Client-Id": config.clientId,
  });
  const init: RequestInit = {
    headers,
  };
  let response = await fetch(url, init);
  if (response.ok) {
    let json = (await response.json()) as TwitchStreamJson;
    while (streamIsNotLive) {
      if (json.data.length > 0) {
        if (json.data[0].type === "") {
          console.info(
            "INFO: Stream showed up live, but 'live' property was invalid. Likely a Twitch error.",
          );
          console.info(`INFO: Trying again in ${intervalMinutes} minutes...`);
          await new Promise((resolve) => {
            setTimeout(resolve, intervalMinutes * 60 * 1000);
          });
          response = await fetch(url, init);
          json = (await response.json()) as TwitchStreamJson;
        } else {
          streamIsNotLive = false;
        }
      } else {
        console.info(
          `Still not live, trying again in ${intervalMinutes} minutes...`,
        );
        await new Promise((resolve) => {
          setTimeout(resolve, intervalMinutes * 60 * 1000);
        });
        response = await fetch(url, init);
        json = (await response.json()) as TwitchStreamJson;
      }
    }
  } else {
    const json = (await response.json()) as TwitchApiError;
    throw new Error(
      `Could not retrieve latest stream status. HTTP Error ${response.status} - ${json.message}`,
    );
  }
}
