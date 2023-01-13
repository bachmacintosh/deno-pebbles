import type { GMailMessageList } from "../../../types.ts";

export async function getMessageIds(accessToken: string): Promise<string[]> {
  let moreMessages = true;
  const messageIds: string[] = [];
  const baseUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&includeSpamTrash=false";
  const init: RequestInit = {
    method: "GET",
    headers: new Headers({
      Authorization: `Bearer ${accessToken}`,
    }),
  };
  let response = await fetch(baseUrl, init);
  while (moreMessages) {
    if (response.ok) {
      const json = await response.json() as GMailMessageList;
      json.messages.forEach((message) => {
        messageIds.push(message.id);
      });
      if (json.nextPageToken) {
        response = await fetch(
          `${baseUrl}&pageToken=${json.nextPageToken}`,
          init,
        );
      } else {
        moreMessages = false;
      }
    } else {
      const text = await response.text();
      throw new Error(
        `Error fetching Message IDs - Status ${response.status} - ${text}`,
      );
    }
  }
  return messageIds;
}
