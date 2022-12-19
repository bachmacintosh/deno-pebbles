import type { ConfigJson, TwitchAccessTokenGrantJson, TwitchApiError } from "../../types.ts";

export default async function refreshAccessToken(config: ConfigJson): Promise<void> {
	const url = "https://id.twitch.tv/oauth2/token";
	const init: RequestInit = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			grant_type: "client_credentials",
		}),
	};
	const response = await fetch(url, init);
	if (response.ok) {
		const json = (await response.json()) as TwitchAccessTokenGrantJson;
		config.accessToken = json.access_token;
		config.tokenExpires = new Date(Date.now() + json.expires_in * 1000);
		console.info("INFO: New Access Token successfully acquired.");
	} else {
		const json = (await response.json()) as TwitchApiError;
		throw new Error(
			`Could not refresh Twitch Access Token - HTTP ${response.status} - ${json.message}`,
		);
	}
}
