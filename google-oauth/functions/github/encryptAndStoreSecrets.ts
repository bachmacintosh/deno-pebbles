import type { GitHubCredentialsJson, GoogleAccessTokenJson, GoogleCredentialsJson } from "../../types.ts";
import getRepoPublicKey from "./getRepoPublicKey.ts";
import { sodium } from "../../deps.ts";

export default async function encryptAndStoreRefreshToken(
  gitHubJson: GitHubCredentialsJson,
  googleJson: GoogleCredentialsJson,
  accessToken: GoogleAccessTokenJson,
): Promise<void> {
  await sodium.ready.then(async () => {
    const publicKey = await getRepoPublicKey(gitHubJson);
    const binKey = sodium.from_base64(publicKey.key, 1);

    const itemsToEncrypt = {
      GOOGLE_CLIENT_ID: JSON.stringify(googleJson.web.client_id),
      GOOGLE_CLIENT_SECRET: JSON.stringify(googleJson.web.client_secret),
      GOOGLE_REFRESH_TOKEN: JSON.stringify(accessToken.refresh_token),
    };

    for (const [key, value] of Object.entries(itemsToEncrypt)) {
      console.info(`Encrypting Secret ${key}...`);
      const binItem = sodium.from_string(value);
      const encryptedBytes = sodium.crypto_box_seal(binItem, binKey);
      const encryptedString = sodium.to_base64(encryptedBytes, 1);
      const url = `https://api.github.com/repos/${gitHubJson.owner}/${gitHubJson.repo}/actions/secrets/${key}`;

      const init: RequestInit = {
        method: "PUT",
        headers: new Headers({
          Authorization: `Bearer ${gitHubJson.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
        body: JSON.stringify(
          {
            "encrypted_value": encryptedString,
            "key_id": publicKey.key_id,
          },
        ),
      };
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(
          `Could not encrypt and put GitHub Action Secret ${response.status}`,
        );
      }
    }
  });
}
