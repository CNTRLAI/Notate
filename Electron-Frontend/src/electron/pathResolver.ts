import { isDev } from "./util.js";
import path from "path";
import { app } from "electron";

export function getPreloadPath() {
  if (isDev()) {
    return path.join(app.getAppPath(), "./dist-electron/preload.cjs");
  } else {
    return path.join(app.getAppPath(), "../dist-electron/preload.cjs");
  }
}

export function getUIPath() {
  return path.join(app.getAppPath(), "/dist-react/index.html");
}

export function getAssetsPath() {
  return path.join(app.getAppPath(), isDev() ? "./src/assets" : "../assets");
}
