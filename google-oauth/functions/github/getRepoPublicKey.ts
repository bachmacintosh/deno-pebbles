import type { GitHubCredentialsJson, GitHubPublicKeyJson } from "../../types.ts";

export default async function getRepoPublicKey(gitHubJson: GitHubCredentialsJson): Promise<GitHubPublicKeyJson> {
  const url = `https://api.github.com/repos/${gitHubJson.owner}/${gitHubJson.repo}/actions/secrets/public-key`;
  const init: RequestInit = {
    headers: new Headers({
      Authorization: `Bearer ${gitHubJson.accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    }),
  };
  const response = await fetch(url, init);
  if (response.ok) {
    const json = await response.json() as GitHubPublicKeyJson;
    return json;
  } else {
    throw new Error(`Error getting GitHub Repo Public Key, ${response.status}`);
  }
}
