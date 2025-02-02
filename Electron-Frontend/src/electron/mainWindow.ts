import { BrowserWindow, app } from "electron";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { isDev } from "./util.js";
import path from "path";
import { closeLoadingWindow } from "./loadingWindow.js";

export function createMainWindow(icon?: Electron.NativeImage) {
  // For Linux, ensure proper window class and icon handling
  const options: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    resizable: true,
    frame: false,
    show: false,
    center: true,
    roundedCorners: true,
    webPreferences: {
      spellcheck: true,
      preload: getPreloadPath(),
    },
    // These properties are important for Linux integration
    title: "Notate",
    icon: icon || path.join(__dirname, "../../src/assets/icon.png"),
  };

  if (process.platform === "linux") {
    // This helps with proper taskbar grouping and icon handling
    app.name = "Notate";
    // Ensure proper desktop integration
    options.autoHideMenuBar = true;
  }

  const mainWindow = new BrowserWindow(options);

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5131");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  mainWindow.once("ready-to-show", () => {
    closeLoadingWindow();
    mainWindow.show();
    mainWindow.center();
  });

  return mainWindow;
}
