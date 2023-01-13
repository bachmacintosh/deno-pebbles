import type { TwitchApiError, TwitchConfigJson, TwitchUserJson } from "../../../types.ts";

export default async function validateTwitchUser(
  config: TwitchConfigJson,
  user: string | number,
): Promise<string> {
  let url = "https://api.twitch.tv/helix/users";
  if (typeof user === "string") {
    url += `?login=${user}`;
  } else {
    url += `?id=${user}`;
  }
  const headers = new Headers({
    Authorization: `Bearer ${config.accessToken}`,
    "Client-Id": config.clientId,
  });
  const init: RequestInit = {
    headers,
  };
  const response = await fetch(url, init);
  if (response.ok) {
    const json = (await response.json()) as TwitchUserJson;
    if (json.data.length > 0) {
      console.info(`Found User ${json.data[0].display_name}.`);
      return `https://www.twitch.tv/${json.data[0].login}`;
    } else {
      throw new Error(
        "Unexpected empty user data array when validating Twitch user.",
      );
    }
  } else {
    const json = (await response.json()) as TwitchApiError;
    throw new Error(
      `Error validating Twitch User ${user} - HTTP ${response.status} - ${json.message}`,
    );
  }
}
