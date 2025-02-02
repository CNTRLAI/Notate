import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { isDev } from "./util.js";
import fs from "fs";
import log from "electron-log";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("userData"), "logs/main.log");

let loadingWindow: BrowserWindow | null = null;

export function createLoadingWindow(icon?: Electron.NativeImage) {
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 600,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    roundedCorners: true,
    center: true,
    title: app.getName(),
    icon: icon || path.join(__dirname, "../../src/assets/icon.png"),
  };

  loadingWindow = new BrowserWindow(windowOptions);

  const appPath = app.getAppPath();
  log.info("App Path:", appPath);

  // In production, loading.html should be in dist-react
  const loadingPath = isDev()
    ? `file://${path.join(path.dirname(__dirname), "src", "loading.html")}`
    : `file://${path.join(appPath, "dist-react", "src", "loading.html")}`;

  log.info("Loading Path:", loadingPath);
  log.info("Current directory:", __dirname);
  const dirPath = path.dirname(loadingPath.replace("file://", ""));
  try {
    log.info("Files in s directory:", fs.readdirSync(dirPath));
    log.info("Files in directory:", fs.readdirSync(__dirname));
  } catch (error) {
    log.error("Error reading directory:", error);
  }

  // Use loadingPath directly instead of constructing a new path
  loadingWindow.loadURL(loadingPath);

  loadingWindow.once("ready-to-show", () => {
    if (loadingWindow) {
      loadingWindow.show();
    }
  });

  // Add IPC handlers for the loading window
  ipcMain.on("open-logs", () => {
    const logPath = log.transports.file.getFile().path;
    shell.showItemInFolder(logPath);
  });

  ipcMain.on("open-github-issue", () => {
    shell.openExternal(
      "https://github.com/CNTRLAI/Notate/issues/new?template=bug_report.md"
    );
  });

  // Add test failure handler
  ipcMain.on("test-failure", () => {
    updateLoadingStatus("Test failure message", 100, true);
  });

  return loadingWindow;
}

export function updateLoadingText(text: string) {
  if (loadingWindow) {
    loadingWindow.webContents.send("update-status", { text, progress: 0 });
  }
}

export function updateLoadingStatus(
  text: string,
  progress: number,
  failed: boolean = false
) {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send("update-status", { text, progress, failed });
  }
}

export function closeLoadingWindow() {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.close();
    loadingWindow = null;
  }
}
