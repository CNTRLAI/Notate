import { vectorstoreQuery } from "../embedding/vectorstoreQuery.js";
import { websiteFetch } from "../storage/websiteFetch.js";
import { youtubeIngest } from "../youtube/youtubeIngest.js";
import { ipcMainDatabaseHandle } from "../util.js";
import { webcrawl } from "../crawl/webcrawl.js";
import { cancelWebcrawl } from "../crawl/cancelWebcrawl.js";
import { cancelEmbed } from "../embedding/cancelEmbed.js";
import { addFileToCollection } from "../storage/newFile.js";
import { getFilesInCollection } from "../storage/getFiles.js";
import { openCollectionFolder } from "../storage/openCollectionFolder.js";
import { deleteCollection } from "../storage/deleteCollection.js";
import db from "../db.js";

export function setupCollectionHandlers() {
  ipcMainDatabaseHandle("openCollectionFolder", async (payload) => {
    try {
      openCollectionFolder(payload.filepath);
      return { filepath: payload.filepath };
    } catch (error) {
      console.error("Error opening collection folder:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle(
    "deleteCollection",
    async (payload: { userId: number; id: number; collectionName: string }) => {
      try {
        deleteCollection(payload.id, payload.collectionName, payload.userId);
        db.deleteCollection(payload.userId, payload.id);
        return {
          userId: payload.userId,
          id: payload.id,
          collectionName: payload.collectionName,
        };
      } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
      }
    }
  );

  ipcMainDatabaseHandle("getFilesInCollection", async (payload) => {
    try {
      return {
        userId: payload.userId,
        collectionId: payload.collectionId,
        files: await getFilesInCollection(payload.userId, payload.collectionId),
      };
    } catch (error) {
      console.error("Error getting files in collection:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("addFileToCollection", async (payload) => {
    try {
      return {
        userId: payload.userId,
        userName: payload.userName,
        collectionId: payload.collectionId,
        collectionName: payload.collectionName,
        fileName: payload.fileName,
        fileContent: payload.fileContent,
        result: await addFileToCollection(
          payload.userId,
          payload.userName,
          payload.collectionId,
          payload.collectionName,
          payload.fileName,
          payload.fileContent
        ),
      };
    } catch (error) {
      console.error("Error adding file to collection:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("cancelEmbed", async (payload) => {
    try {
      const response = await cancelEmbed(payload);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error canceling embed:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("vectorstoreQuery", async (payload) => {
    try {
      const result = await vectorstoreQuery(payload);
      return result;
    } catch (error) {
      console.error("Error querying vectorstore:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("webcrawl", async (payload) => {
    try {
      await webcrawl(payload);
      return payload;
    } catch (error) {
      console.error("[WEBCRAWL] Error:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("cancelWebcrawl", async (payload) => {
    try {
      await cancelWebcrawl(payload);
      return payload;
    } catch (error) {
      console.error("[CANCEL WEBCRAWL] Error:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("websiteFetch", async (payload) => {
    try {
      const result = await websiteFetch(payload);
      return {
        ...result,
        userId: payload.userId,
        userName: payload.userName,
        collectionId: payload.collectionId,
        collectionName: payload.collectionName,
      };
    } catch (error) {
      console.error("Error fetching website:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("youtubeIngest", async (payload) => {
    try {
      await youtubeIngest(payload);
      return payload;
    } catch (error) {
      console.error("Error ingesting youtube:", error);
      throw error;
    }
  });
}
