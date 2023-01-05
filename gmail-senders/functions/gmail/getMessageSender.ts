import { GMailMessageMetadata } from "../../types.ts";

export async function getMessageSender(
  accessToken: string,
  messageId: string,
): Promise<string | null> {
  const url =
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From`;
  const init: RequestInit = {
    method: "GET",
    headers: new Headers({
      Authorization: `Bearer ${accessToken}`,
    }),
  };
  const response = await fetch(url, init);
  if (response.ok) {
    const message = await response.json() as GMailMessageMetadata;
    return message.payload.headers[0].value;
  } else {
    console.info(`Skipping ID ${messageId} due to an error.\n`);
    return null;
  }
}
