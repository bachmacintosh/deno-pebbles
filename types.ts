// deno-lint-ignore-file camelcase
// Twitch API returns snake_case values.

export interface GitHubCredentialsJson {
  owner: string;
  repo: string;
  accessToken: string;
}

export interface GitHubPublicKeyJson {
  "key_id": string;
  key: string;
}

export interface GMailMessageHeader {
  name: string;
  value: string;
}

export interface GMailMessageList {
  messages: GMailMessagePartial[];
  nextPageToken: string;
  resultSizeEstimate: number;
}

export interface GMailMessageMetadata extends GMailMessagePartial {
  labelIds: string[];
  snippet: string;
  payload: {
    mimeType: string;
    headers: GMailMessageHeader[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GMailMessagePartial {
  id: string;
  threadId: string;
}

export interface GoogleAccessTokenJson {
  "access_token": string;
  "expires_in": number;
  "refresh_token"?: string;
  scope: string;
  "token_type": "Bearer";
}

export interface GoogleCredentialsJson {
  web: {
    "client_id": string;
    "project_id": string;
    "auth_uri": string;
    "token_uri": string;
    "auth_provider_x509_cert_url": string;
    "client_secret": string;
    "redirect_uris": string[];
  };
}

export interface TwitchApiError {
  status: number;
  message: string;
}

export interface TwitchAccessTokenValidateJson {
  client_id: string;
  scopes: string[];
  login?: string;
  user_id?: string;
  expires_in: number;
}

export interface TwitchAccessTokenGrantJson {
  access_token: string;
  refresh_token: string;
  scope: string[];
  token_type: "bearer";
}

export interface TwitchConfigJson {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
}

export interface TwitchStreamJson {
  data: TwitchStream[];
  pagination: {
    cursor?: string;
  };
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: TwitchStreamType;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

export type TwitchStreamType =
  | "live"
  | "playlist"
  | "watch_party"
  | "premiere"
  | "rerun";

export interface TwitchUserJson {
  data: TwitchUser[];
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  created_at: string;
}

export interface TwitchEventSubBaseMetadata<
  M extends TwitchEventSubMessageType,
> {
  message_id: string;
  message_type: M;
  message_timestamp: string;
}

export interface TwitchEventSubMessage<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType | undefined = undefined,
> {
  metadata: M extends (
    | "notification"
    | "revocation"
  ) ? TwitchEventSubSubsciptionMetadata<M, S>
    : TwitchEventSubBaseMetadata<M>;
  payload: TwitchEventSubPayload<M, S>[M];
}

export type TwitchEventSubMessageType =
  | "session_welcome"
  | "session_keepalive"
  | "notification"
  | "session_reconnect"
  | "revocation";

export interface TwitchEventSubPayload<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType | undefined = undefined,
> {
  session_welcome: S extends undefined ? {
      session: {
        id: string;
        status: "connected";
        keepalive_timeout_seconds: number;
        reconnect_url: null;
        connected_at: string;
      };
    }
    : never;
  session_keepalive: S extends undefined ? Record<string, never> : never;
  notification: S extends TwitchEventSubSubscriptionType ? {
      subscription: TwitchEventSubSubsctiption<M, S>;
      event: TwitchEventSubSubscriptionEvent[S];
    }
    : never;
  session_reconnect: S extends undefined ? {
      session: {
        id: string;
        status: "reconnecting";
        keepalive_timeout_seconds: null;
        reconnect_url: string;
        connected_at: string;
      };
    }
    : never;
  revocation: S extends TwitchEventSubSubscriptionType ? {
      subscription: TwitchEventSubSubsctiption<M, S>;
    }
    : never;
}

export interface TwitchEventSubSubsctiption<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType,
> {
  id: string;
  status: M extends "revocation"
    ? "authorization_revoked" | "user_removed" | "version_removed"
    : "enabled";
  type: S;
  version: string;
  cost: string;
  condition: TwitchEventSubSubscriptionCondition[S];
  transport: {
    method: "websocket";
    session_id: string;
  };
  created_at: string;
}

export interface TwitchEventSubSubscriptionCondition {
  "stream.online": {
    broadcaster_user_id: string;
  };
}

export interface TwitchEventSubSubscriptionEvent {
  "stream.online": {
    id: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    type: TwitchStreamType;
    started_at: string;
  };
}

export type TwitchEventSubSubsciptionMetadata<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType | undefined = undefined,
> = S extends TwitchEventSubSubscriptionType ? TwitchEventSubBaseMetadata<M> & {
    subscription_type: S;
    subscription_version: string;
  }
  : never;

export type TwitchEventSubSubscriptionRequest<
  S extends TwitchEventSubSubscriptionType,
> = Omit<
  TwitchEventSubSubsctiption<"notification", S>,
  "id" | "status" | "cost" | "created_at"
>;

export type TwitchEventSubSubscriptionListRequest<
  S extends TwitchEventSubSubscriptionType | undefined,
> =
  | {
    status: TwitchEventSubSubscriptionFullStatus;
    type?: never;
    user_id?: never;
    after?: never;
  }
  | {
    status?: never;
    type: S extends TwitchEventSubSubscriptionType ? S : never;
    user_id?: never;
    after?: never;
  }
  | { status?: never; type?: never; user_id: string; after?: never }
  | { status?: never; type?: never; user_id?: never; after: string };

export type TwitchEventSubCreatedSubscription<
  S extends TwitchEventSubSubscriptionType,
> = {
  data: (TwitchEventSubSubsctiption<"notification", S> & {
    transport: {
      connected_at: string;
    };
  })[];
  total: number;
  total_cost: number;
  max_total_cost: number;
};

export type TwitchEventSubSubscriptionFullStatus =
  | "enabled"
  | "webhook_callback_verification_pending"
  | "webhook_callback_verification_failed"
  | "notification_failures_exceeded"
  | "authorization_revoked"
  | "moderator_removed"
  | "user_removed"
  | "version_removed"
  | "websocket_disconnected"
  | "websocket_failed_ping_pong"
  | "websocket_received_inbound_traffic"
  | "websocket_connection_unused"
  | "websocket_internal_error"
  | "websocket_network_timeout"
  | "websocket_network_error";

export type TwitchEventSubSubscriptionList<
  S extends TwitchEventSubSubscriptionType | undefined = undefined,
> = {
  data: S extends TwitchEventSubSubscriptionType
    ? (TwitchEventSubSubsctiption<"notification", S> & {
      status: TwitchEventSubSubscriptionFullStatus;
    } & { transport: TwitchEventSubSubscriptionTransport })[]
    : TwitchEventSubUnknownSubscription[];
  total: number;
  total_cost: number;
  max_total_cost: number;
  pagination: {
    cursor?: string;
  };
};

export type TwitchEventSubSubscriptionTransport<
  T extends "webhook" | "websocket" = "websocket",
> =
  & {
    method: T;
  }
  & (T extends "webhook" ? {
      callback: string;
    }
    : {
      session_id: string;
      connected_at: string;
      disconnected_at: string;
    });

export type TwitchEventSubUnknownSubscription = {
  id: string;
  status: TwitchEventSubSubscriptionFullStatus;
  type: string;
  version: string;
  cost: string;
  condition: Record<string, unknown>;
  transport: TwitchEventSubSubscriptionTransport;
  created_at: string;
};

export type TwitchEventSubSubscriptionType = "stream.online";
