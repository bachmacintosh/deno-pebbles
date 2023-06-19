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
  expires_in: number;
}

export interface TwitchConfigJson {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  tokenExpires: Date;
}

export interface TwitchStreamJson {
  data: TwitchStream[];
  pagination: {
    cursor?: string;
  };
}

interface TwitchStream {
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

type TwitchStreamType =
  | "live"
  | "playlist"
  | "watch_party"
  | "premiere"
  | "rerun";

export interface TwitchUserJson {
  data: TwitchUser[];
}

interface TwitchUser {
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

interface TwitchEventSubBaseMetadata<M extends TwitchEventSubMessageType> {
  message_id: string;
  message_type: M;
  message_timestamp: string;
}

export interface TwitchEventSubMessage<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType,
> {
  metadata: M extends (
    | "notification"
    | "revokation"
  ) ? TwitchEventSubSubsciptionMetadata<M, S>
    : TwitchEventSubBaseMetadata<M>;
  payload: TwitchEventSubPayload<M, S>[M];
}

type TwitchEventSubMessageType =
  | "session_welcome"
  | "session_keepalive"
  | "notification"
  | "session_reconnect"
  | "revocation";

interface TwitchEventSubPayload<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType,
> {
  session_welcome: {
    session: {
      id: string;
      status: "connected";
      keepalive_timeout_seconds: number;
      reconnect_url: null;
      connected_at: string;
    };
  };
  session_keepalive: Record<string, never>;
  notification: {
    subscription: TwitchEventSubSubsctiption<M, S>;
    event: TwitchEventSubSubscriptionEvent[S];
  };
  session_reconnect: {
    session: {
      id: string;
      status: "reconnecting";
      keepalive_timeout_seconds: null;
      reconnect_url: string;
      connected_at: string;
    };
  };
  revocation: {
    subscription: TwitchEventSubSubsctiption<M, S>;
  };
}

interface TwitchEventSubSubsctiption<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType,
> {
  "id": string;
  status: M extends "revokation"
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

interface TwitchEventSubSubscriptionCondition {
  "stream.online": {
    broadcaster_user_id: string;
  };
}

interface TwitchEventSubSubscriptionEvent {
  "stream.online": {
    id: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    type: TwitchStreamType;
    started_at: string;
  };
}

interface TwitchEventSubSubsciptionMetadata<
  M extends TwitchEventSubMessageType,
  S extends TwitchEventSubSubscriptionType,
> extends TwitchEventSubBaseMetadata<M> {
  subscription_type: S;
  subscription_version: string;
}

type TwitchEventSubSubscriptionType = "stream.online";
