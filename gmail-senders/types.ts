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

export interface GoogleAccessTokenJson {
  "access_token": string;
  "expires_in": number;
  "refresh_token"?: string;
  scope: string;
  "token_type": "Bearer";
}

export interface GMailMessagePartial {
  id: string;
  threadId: string;
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

export interface GMailMessageHeader {
  name: string;
  value: string;
}

export interface GMailMessageList {
  messages: GMailMessagePartial[];
  nextPageToken: string;
  resultSizeEstimate: number;
}
