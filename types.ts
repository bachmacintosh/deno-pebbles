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
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

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
