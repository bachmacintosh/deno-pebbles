import { open } from "../../deps.ts";
import {
  TwitchAccessTokenGrantJson,
  TwitchApiError,
  TwitchConfigJson,
  TwitchEventSubSubscriptionRequest,
  TwitchEventSubSubscriptionResponse,
  TwitchEventSubSubscriptionType,
  TwitchStreamJson,
  TwitchUserJson,
} from "../../types.ts";
import reviveJson from "../functions/util/reviveJson.ts";

export default class TwitchAPI {
  #state: string;
  #configPath: string;
  #config: TwitchConfigJson;
  #oauthUrl = "https://id.twitch.tv/oauth2/authorize";
  #tokenUrl = "https://id.twitch.tv/oauth2/token";
  #validateUrl = "https://id.twitch.tv/oauth2/validate";

  public constructor(configPath: string) {
    this.#configPath = configPath;
    try {
      const file = Deno.statSync(this.#configPath);
      if (!file.isFile) {
        throw new Error("Item exists at config path, but is not a file.");
      }
      const configText = Deno.readTextFileSync(this.#configPath);
      this.#config = JSON.parse(configText, reviveJson) as TwitchConfigJson;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        const defaultJson: TwitchConfigJson = {
          clientId: "",
          clientSecret: "",
          accessToken: "",
          refreshToken: "",
        };
        Deno.writeTextFileSync(
          this.#configPath,
          JSON.stringify(defaultJson, null, 2),
          {
            createNew: true,
          },
        );
        console.info(
          "Created a .twitch.json file in the same directory as this program.",
        );
        console.info(
          "You'll need to populate the clientId and clientSecret with your Twitch App credentials to use this script.",
        );
        Deno.exit();
      } else {
        throw new Error(error);
      }
    }
    this.#state = crypto.randomUUID();
  }

  public resetState() {
    this.#state = crypto.randomUUID();
  }

  public async checkAccessToken(loginAgain = false) {
    const throwifNotLoggingIn = () => {
      if (!loginAgain) {
        throw new Error(
          "You've been logged out of Twitch. Please restart the app and log in again.",
        );
      }
    };
    if (this.#config.accessToken === "" || this.#config.refreshToken === "") {
      throwifNotLoggingIn();
      console.info("Access and/or Refresh Tokens are not set. Logging in...");
      await this.#redirectToTwitch();
      const code = await this.#listenForAuthorizationCode();
      const tokens = await this.#getAccessToken(code);
      this.#config.accessToken = tokens.access_token;
      this.#config.refreshToken = tokens.refresh_token;
      console.info("Successfully logged in.");
    } else {
      const isValidToken = await this.#isValidAccessToken();
      if (!isValidToken) {
        console.info("Access Token is invalid, attempting to refresh it...");
        const refreshedTokens = await this.#refreshAccessToken();
        if (refreshedTokens === false) {
          throwifNotLoggingIn();
          console.info("Refresh token is invalid, need to log in again...");
          await this.#redirectToTwitch();
          const code = await this.#listenForAuthorizationCode();
          const tokens = await this.#getAccessToken(code);
          this.#config.accessToken = tokens.access_token;
          this.#config.refreshToken = tokens.refresh_token;
          console.info("Successfully logged in.");
        } else {
          this.#config.accessToken = refreshedTokens.access_token;
          this.#config.refreshToken = refreshedTokens.refresh_token;
          console.info("Successfully refreshed the token. Continuing...");
        }
      }
    }
  }

  public async saveConfigFile() {
    console.info("Updating Config file...");
    await Deno.writeTextFile(
      this.#configPath,
      JSON.stringify(this.#config, null, 2),
    );
    console.info("Save succeeded.");
  }

  public async validateTwitchUser(
    user: string | number,
  ): Promise<string | false> {
    await this.checkAccessToken(true);
    let url = "https://api.twitch.tv/helix/users";
    if (typeof user === "string") {
      url += `?login=${user}`;
    } else {
      url += `?id=${user}`;
    }
    const userSet = await this.#makeApiRequest<TwitchUserJson>(url);
    if (userSet.data.length > 0) {
      return userSet.data[0].id;
    } else {
      return false;
    }
  }

  public async getExistingStream(user: string): Promise<string | false> {
    await this.checkAccessToken(true);
    console.info("Checking if they're already live...");
    const url = `https://api.twitch.tv/helix/streams?user_id=${user}`;
    const dataSet = await this.#makeApiRequest<TwitchStreamJson>(url);
    if (dataSet.data.length > 0) {
      return `https://twitch.tv/${dataSet.data[0].user_login}`;
    } else {
      return false;
    }
  }

  public async createEventSubSubscription<
    S extends TwitchEventSubSubscriptionType,
  >(
    request: TwitchEventSubSubscriptionRequest<S>,
  ): Promise<TwitchEventSubSubscriptionResponse<S>> {
    await this.checkAccessToken();
    const url = "https://api.twitch.tv/helix/eventsub/subscriptions";
    const subscriptions = await this.#makeApiRequest<
      TwitchEventSubSubscriptionResponse<S>
    >(
      url,
      "POST",
      request,
    );
    return subscriptions;
  }

  async #redirectToTwitch() {
    const url = [
      this.#oauthUrl,
      `?client_id=${this.#config.clientId}`,
      `&redirect_uri=${encodeURIComponent("http://localhost:8000")}`,
      `&response_type=code`,
      `&scope=`,
      `&state=${this.#state}`,
    ].join("");
    console.info(
      `We need to log into Twitch. Check your browser, or use this URL to retry: ${url}`,
    );
    await open(url);
  }

  #listenForAuthorizationCode(): Promise<string> {
    const ac = new AbortController();
    return new Promise<string>((resolve, reject) => {
      const securityTimeout = setTimeout(
        () => {
          ac.abort();
          reject(
            "For security purposes, we timed out the authorization flow. Restart the app and try again.",
          );
        },
        300_000,
      );
      Deno.unrefTimer(securityTimeout);
      let code = "";
      let error = "";
      let errorDescription = "";
      Deno.serve({ signal: ac.signal, onListen: () => {} }, (request) => {
        const params = new URL(request.url).searchParams;

        if (!params.toString()) {
          // URL: / (no query string)
          if (code !== "") {
            clearTimeout(securityTimeout);
            setTimeout(() => {
              ac.abort();
              resolve(code);
            }, 5000);
            return new Response(
              "You're all done authorizing the app, and you may close this tab.",
            );
          } else if (error !== "") {
            clearTimeout(securityTimeout);
            setTimeout(() => {
              ac.abort();
              reject(errorDescription);
            }, 5000);
            return new Response(
              "The app has not been authorized, and you may close this tab.",
            );
          } else {
            return new Response(
              "Still trying to authenticate with Twitch. Try using the URL in the Terminal again.",
            );
          }
        } else {
          const returnedState = params.get("state");
          if (returnedState !== this.#state) {
            return Response.redirect("http://localhost:8000");
          }
          error = params.get("error") ?? "";
          if (error !== "") {
            errorDescription = params.get("error_description") ??
              "Unknown error";
            return Response.redirect("http://localhost:8000");
          } else {
            code = params.get("code") ?? "";
            return Response.redirect("http://localhost:8000");
          }
        }
      });
    });
  }

  async #getAccessToken(
    code: string,
  ): Promise<TwitchAccessTokenGrantJson> {
    const init: RequestInit = {
      method: "POST",
      body: new URLSearchParams({
        client_id: this.#config.clientId,
        client_secret: this.#config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:8000",
      }),
    };
    const response = await fetch(this.#tokenUrl, init);
    if (response.ok) {
      const grant = await response.json() as TwitchAccessTokenGrantJson;
      return grant;
    } else {
      throw new Error(
        `Error getting new Twitch Access Token -- HTTP ${response.status}`,
      );
    }
  }

  async #isValidAccessToken(): Promise<boolean> {
    const init: RequestInit = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.#config.accessToken}`,
      },
    };
    const response = await fetch(this.#validateUrl, init);
    if (response.ok) {
      return true;
    } else if (response.status === 401) {
      return false;
    } else {
      throw new Error(
        `Error validating Twitch Access Token -- HTTP ${response.status}`,
      );
    }
  }

  async #refreshAccessToken(): Promise<
    TwitchAccessTokenGrantJson | false
  > {
    const init: RequestInit = {
      method: "POST",
      body: new URLSearchParams({
        client_id: this.#config.clientId,
        client_secret: this.#config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: encodeURIComponent(this.#config.refreshToken),
      }),
    };
    const response = await fetch(this.#tokenUrl, init);
    if (response.ok) {
      const grant = await response.json() as TwitchAccessTokenGrantJson;
      return grant;
    } else if (response.status === 401) {
      return false;
    } else {
      throw new Error(
        `Error refreshing Access Token -- HTTP ${response.status}`,
      );
    }
  }

  async #makeApiRequest<T>(
    url: string,
    method: "GET" | "POST" | "PUT" = "GET",
    body?: unknown,
  ): Promise<T> {
    const headers = new Headers({
      Authorization: `Bearer ${this.#config.accessToken}`,
      "Client-Id": this.#config.clientId,
    });
    const init: RequestInit = {};
    if (typeof body !== "undefined") {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }
    init.method = method;
    init.headers = headers;
    const response = await fetch(url, init);
    if (response.ok) {
      const json = await response.json() as T;
      return json;
    } else {
      const error = await response.json() as TwitchApiError;
      throw new Error(
        `Twitch API Error -- HTTP ${response.status} - ${error.message}`,
      );
    }
  }
}
