import db from "../../db.js";
import { vectorstoreQuery } from "../../embedding/vectorstoreQuery.js";
import log from "electron-log";
import os from "os";

export async function ifCollection(
  messages: Message[],
  activeUser: User,
  collectionId: bigint | number,
  platform: string
) {
  let data: {
    top_k: number;
    results: {
      content: string;
      metadata: string;
    }[];
  } | null = null;

  const collectionName = await db.getCollectionName(Number(collectionId));
  log.info(`Collection name: ${collectionName}`);
  try {
    const vectorstoreData = await vectorstoreQuery({
      query: messages[messages.length - 1].content,
      userId: activeUser.id,
      userName: activeUser.name,
      collectionId: Number(collectionId),
      collectionName: collectionName.name,
    });

    if (vectorstoreData.status === "error") {
      if (vectorstoreData.message === "Unauthorized") {
        const newMessage = {
          role: "assistant",
          content:
            `There is an issue with the SECRET_KEY not being in sync across the front/backend.\n\n` +
            `Please try the following steps:\n` +
            `1. Restart your PC\n` +
            `2. If the issue persists, check your logs at:\n` +
            `   ${
              platform === "darwin"
                ? os.homedir() + "/Library/Application Support/notate/main.log"
                : platform === "win32"
                ? os.homedir() + "/AppData/Roaming/notate/main.log"
                : os.homedir() + "~/.config/notate/main.log"
            }\n\n` +
            `3. Open a GitHub issue at https://github.com/CNTRLAI/notate and include your logs`,
          timestamp: new Date(),
          data_content: undefined,
        } as Message;
        return {
          id: -1,
          messages: [...messages, newMessage],
          title: "Need API Key",
        };
      }
    }
    if (vectorstoreData) {
      data = {
        top_k: vectorstoreData.results.length,
        results: vectorstoreData.results,
      };
    }
  } catch (error) {
    const newMessage = {
      role: "assistant",
      content: `Error in vectorstore query: ${error}`,
      timestamp: new Date(),
      data_content: undefined,
    } as Message;
    log.error(`Error in vectorstore query: ${error}`);
    return {
      id: -1,
      messages: [...messages, newMessage],
      title: "Error in vectorstore query",
    };
  }
  return { collectionData: data };
}
