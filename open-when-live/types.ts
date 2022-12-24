// deno-lint-ignore-file camelcase
// Twitch API returns snake_case values.

export interface ConfigJson {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  tokenExpires: Date;
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
