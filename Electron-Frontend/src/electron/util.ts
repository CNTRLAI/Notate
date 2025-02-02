import {
  ipcMain,
  IpcMainInvokeEvent,
  WebContents,
  WebFrameMain,
} from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function ipcMainHandle<
  Channel extends string,
  Input extends Record<string, unknown> = Record<string, unknown>,
  Output = unknown
>(
  channel: Channel,
  handler: (event: IpcMainInvokeEvent, payload: Input) => Promise<Output>
) {
  ipcMain.handle(channel, handler);
}

export function ipcMainDatabaseHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (
    payload: EventPayloadMapping[Key]
  ) => Promise<EventPayloadMapping[Key]>
) {
  ipcMain.handle(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    return handler(payload as EventPayloadMapping[Key]);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload?: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain | null) {
  if (frame === null) {
    throw new Error("Sender frame is null");
  }
  if (isDev() && new URL(frame.url).host === "localhost:5131") {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error("Malicious event");
  }
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: EventPayloadMapping[Key]) => void
) {
  ipcMain.on(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    handler(payload);
  });
}
