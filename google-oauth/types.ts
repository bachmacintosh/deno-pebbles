export interface GitHubCredentialsJson {
	owner: string;
	repo: string;
	accessToken: string;
}

export interface GitHubPublicKeyJson {
	"key_id": string;
	key: string;
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

export interface GoogleAccessTokenJson {
	"access_token": string;
	"expires_in": number;
	"refresh_token"?: string;
	scope: string;
	"token_type": "Bearer";
}
