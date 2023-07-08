import {
  TwitchEventSubMessage,
  TwitchEventSubMessageType,
  TwitchEventSubSubscriptionRequest,
  TwitchEventSubSubscriptionType,
} from "../../types.ts";
import TwitchAPI from "./TwitchAPI.ts";
import { open } from "../../deps.ts";

export default class TwitchEventSub {
  #api: TwitchAPI;
  #user: string;
  #subscriptionId: string;
  #keepaliveTimeout: number;
  #keepaliveTimerId: number;
  #ws: WebSocket;
  #wsUrl = "wss://eventsub.wss.twitch.tv/ws";
  #messageIds: Map<string, Date>;

  public constructor(api: TwitchAPI, user: string) {
    this.#api = api;
    this.#user = user;
    this.#subscriptionId = "";
    console.info("Connecting to Twitch EventSub...");
    this.#keepaliveTimeout = 0;
    this.#keepaliveTimerId = 0;
    this.#ws = new WebSocket(this.#wsUrl);
    this.#ws.addEventListener("open", this.#onOpen);
    this.#ws.addEventListener("message", this.#onMessage);
    this.#ws.addEventListener("close", this.#onClose);
    this.#messageIds = new Map<string, Date>();
    const everyHour = 60 * 60 * 1000;
    Deno.unrefTimer(setInterval(this.#sweepOldMessages, everyHour));
  }

  #reconnect(url?: string) {
    this.#ws.removeEventListener("close", this.#onClose);
    this.#ws.close();
    const newWs = new WebSocket(url ?? this.#wsUrl);
    newWs.addEventListener("open", this.#onOpen);
    newWs.addEventListener("message", this.#onMessage);
    newWs.addEventListener("close", this.#onClose);
    this.#ws = newWs;
    this.#messageIds.clear();
  }

  #onOpen = () => {
    console.info("Successfully connected to EventSub.");
  };

  #onMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data) as unknown;
    if (this.#isEventSubMessage(message, "session_welcome")) {
      this.#handleWelcomeMessage(message);
    } else if (this.#isEventSubMessage(message, "session_keepalive")) {
      this.#handleKeepaliveMessage(message);
    } else if (this.#isEventSubMessage(message, "session_reconnect")) {
      this.#handleReconnectMessage(message);
    } else if (
      this.#isEventSubMessage(message, "revocation", "stream.online")
    ) {
      this.#handleRevocationMessage(message);
    } else if (
      this.#isEventSubMessage(message, "notification", "stream.online")
    ) {
      this.#handleStreamOnline(message);
    } else {
      console.error("Unknown WebSocket Message.");
      console.error(message);
      Deno.exit(1);
    }
  };

  #onClose = (event: CloseEvent) => {
    console.error("Twitch unexpectedly closed the connection.");
    switch (event.code) {
      case 4000:
        console.error("Internal Server Error");
        break;
      case 4001:
        console.error("Client sent inbound traffic");
        break;
      case 4002:
        console.error("Client failed ping-pong");
        break;
      case 4003:
        console.error("Connection unused -- no subscription after 10 seconds");
        break;
      case 4004:
        console.error("Reconnect grace time expired");
        break;
      case 4005:
        console.error("Network Timeout");
        break;
      case 4006:
        console.error("Network Error");
        break;
      case 4007:
        console.error("Invalid Reconnect (URL)");
        break;
      default:
        console.error(`Unrecognized Close Code ${event.code ?? 0}`);
    }
    Deno.exit(1);
  };

  async #handleWelcomeMessage(
    message: TwitchEventSubMessage<"session_welcome">,
  ) {
    if (this.#isNewMessage(message.metadata.message_id)) {
      console.info("Received Welcome Message.");
      this.#keepaliveTimeout =
        (message.payload.session.keepalive_timeout_seconds * 1000) + 1000;
      this.#keepAlive();
      if (this.#subscriptionId === "") {
        console.info("Subscribing to stream.online Event...");
        const request: TwitchEventSubSubscriptionRequest<"stream.online"> = {
          type: "stream.online",
          version: "1",
          condition: {
            broadcaster_user_id: this.#user,
          },
          transport: {
            method: "websocket",
            session_id: message.payload.session.id,
          },
        };
        const newSubscription = await this.#api.createEventSubSubscription(
          request,
        );
        this.#subscriptionId = newSubscription.data[0].id;
        console.info(
          "Success! We'll open the stream on Twitch when they go online.",
        );
      } else {
        console.info("Still listening for the stream to come online...");
      }
    }
  }

  #handleKeepaliveMessage(message: TwitchEventSubMessage<"session_keepalive">) {
    if (this.#isNewMessage(message.metadata.message_id)) {
      this.#keepAlive();
    }
  }

  #handleReconnectMessage(message: TwitchEventSubMessage<"session_reconnect">) {
    if (this.#isNewMessage(message.metadata.message_id)) {
      this.#keepAlive();
      console.info("Twitch wants us to Reconnect...");
      this.#reconnect(message.payload.session.reconnect_url);
    }
  }

  #handleRevocationMessage(
    message: TwitchEventSubMessage<"revocation", "stream.online">,
  ) {
    if (this.#isNewMessage(message.metadata.message_id)) {
      this.#keepAlive();
      console.error("EventSub subscription was revoked.");
      switch (message.payload.subscription.status) {
        case "authorization_revoked":
          console.error("Authorization to the app was revoked.");
          break;
        case "user_removed":
          console.error(
            "The user we were waiting to go live no longer exists.",
          );
          break;
        case "version_removed":
          console.error(
            "The version of the subscription is no longer available; program will need updating.",
          );
      }
      this.#ws.close();
      Deno.exit(1);
    }
  }

  async #handleStreamOnline(
    message: TwitchEventSubMessage<"notification", "stream.online">,
  ) {
    console.info(`Stream is Live! Opening...`);
    const url =
      `https://twitch.tv/${message.payload.event.broadcaster_user_login}`;
    await open(url);
    console.info("Cleaning up EventSub and exiting app...");
    this.#ws.close();
    Deno.exit();
  }

  #keepAlive() {
    if (this.#keepaliveTimerId !== 0) {
      clearTimeout(this.#keepaliveTimerId);
      this.#keepaliveTimerId = setTimeout(
        () => {
          console.info("Twitch connection lost, reconnecting...");
          this.#reconnect();
        },
        this.#keepaliveTimeout,
      );
      Deno.unrefTimer(this.#keepaliveTimerId);
    }
  }

  #isNewMessage(id: string): boolean {
    if (this.#messageIds.has(id)) {
      return false;
    } else {
      this.#messageIds.set(id, new Date());
      return true;
    }
  }

  #sweepOldMessages() {
    const oneHour = 3600 * 60;
    const oneHourAgo = Date.now() - oneHour;
    for (const [id, date] of this.#messageIds) {
      if (date.getTime() < oneHourAgo) {
        this.#messageIds.delete(id);
      }
    }
  }

  #isEventSubMessage<
    M extends TwitchEventSubMessageType,
    S extends TwitchEventSubSubscriptionType | undefined = undefined,
  >(
    value: unknown,
    messageType: M,
    subscriptionType?: S,
  ): value is TwitchEventSubMessage<M, S> {
    if (typeof subscriptionType === "undefined") {
      if (messageType === "notification" || messageType === "revocation") {
        throw new TypeError(
          `EventSub messages of type "${messageType}" must have a subscription attached to them.`,
        );
      }
      return typeof value === "object" && value !== null &&
        "metadata" in value &&
        typeof value.metadata === "object" && value.metadata !== null &&
        "message_type" in value.metadata &&
        typeof value.metadata.message_type === "string" &&
        value.metadata.message_type === messageType;
    } else if (messageType !== "notification" && messageType !== "revocation") {
      throw new TypeError(
        `EventSub messages of type "${messageType} cannot have a subscription attached to them.`,
      );
    } else {
      return typeof value === "object" && value !== null &&
        "metadata" in value &&
        typeof value.metadata === "object" && value.metadata !== null &&
        "message_type" in value.metadata &&
        typeof value.metadata.message_type === "string" &&
        value.metadata.message_type === messageType &&
        "subscription_type" in value.metadata &&
        typeof value.metadata.subscription_type === "string" &&
        value.metadata.subscription_type === subscriptionType;
    }
  }
}
