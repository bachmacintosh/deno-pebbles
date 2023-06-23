import {
  TwitchEventSubMessage,
  TwitchEventSubMessageType,
  TwitchEventSubSubscriptionType,
} from "../../types.ts";

export default class EventSub {
  #ws: WebSocket;
  #wsUrl = "wss://eventsub.wss.twitch.tv/ws";
  #messageIds: Map<string, Date>;

  public constructor() {
    this.#ws = new WebSocket(this.#wsUrl);
    this.#messageIds = new Map<string, Date>();
    const everyHour = 3600 * 1000;
    Deno.unrefTimer(setInterval(this.#sweepOldMessages, everyHour));
  }

  #isNewMessage(id: string): boolean {
    if (this.#messageIds.has(id)) {
      return false;
    } else {
      this.#messageIds.set(id, new Date());
      return true;
    }
  }

  #sweepOldMessages(): void {
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
