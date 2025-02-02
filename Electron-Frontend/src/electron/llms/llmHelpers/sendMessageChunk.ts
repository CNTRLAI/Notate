import { BrowserWindow } from "electron";

export function sendMessageChunk(
  content: string,
  mainWindow: BrowserWindow | null
) {
  if (mainWindow) {
    mainWindow.webContents.send("messageChunk", content);
  } else {
    console.log("This no work cause Chunk not chunky");
  }
}
