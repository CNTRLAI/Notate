import { app } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { pollResource } from "./resourceManager.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import db from "./db.js";
import { createLoadingWindow, updateLoadingStatus } from "./loadingWindow.js";
import fs from "fs";
import log from "electron-log";
import { setupCollectionHandlers } from "./handlers/collectionHandlers.js";
import { setupIpcHandlers } from "./handlers/ipcHandlers.js";
import { setupDbHandlers } from "./handlers/dbHandlers.js";
import { createMainWindow } from "./mainWindow.js";
import { handleCloseEvents } from "./handlers/closeEventHandler.js";
import { setupChatHandlers } from "./handlers/chatHandlers.js";
import {
  startPythonServer,
  stopPythonServer,
} from "./python/startAndStopPython.js";
import { setupMenuHandlers } from "./handlers/menuHandlers.js";
import { setupOllamaHandlers } from "./handlers/ollamaHandlers.js";
import { nativeImage } from "electron";
import { setupVttHandlers } from "./handlers/voiceHandlers.js";
import { setupFileHandlers } from "./handlers/fileHandlers.js";
import { getDevSecretPath } from "./authentication/devApi.js";
import { setupOpenRouterHandlers } from "./handlers/openRouterHandlers.js";
import { setupLocalModelHandlers } from "./handlers/localModelHandlers.js";
import crypto from "crypto";
import { setupAzureOpenAI } from "./handlers/azureHandlers.js";
import { setupCustomApiHandlers } from "./handlers/customApiHandlers.js";

// Configure logging first
log.transports.file.level = "debug";
log.transports.file.resolvePathFn = () => {
  const logPath = app.getPath("userData");
  // Ensure the log directory exists
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
  return path.join(logPath, "main.log");
};

log.errorHandler.startCatching();

// Ensure dev secret exists
const devSecretPath = getDevSecretPath();
if (!fs.existsSync(devSecretPath)) {
  const secret = crypto.randomBytes(32).toString("base64");
  fs.writeFileSync(devSecretPath, secret);
  log.info("Created dev secret file at:", devSecretPath);
}

// Add early startup logging
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  log.error("Uncaught Exception:", error);
  if (error.stack) {
    log.error("Stack trace:", error.stack);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  log.error("Unhandled Rejection:", error);
  if (error instanceof Error && error.stack) {
    log.error("Stack trace:", error.stack);
  }
});

// Log startup
log.info("Application starting...");
log.info("Process arguments:", process.argv);
log.info("Working directory:", process.cwd());
log.info("Is Dev:", isDev());
log.info("Executable path:", process.execPath);
log.info("Resource path:", process.resourcesPath);

// Set app metadata before anything else
app.setName("Notate");
if (isDev()) {
  app.setPath("userData", path.join(app.getPath("userData"), "development"));
}

// Log paths
log.info("User Data Path:", app.getPath("userData"));
log.info("App Path:", app.getAppPath());

// Set app metadata
const iconPath = isDev()
  ? path.resolve(process.cwd(), "linux.png")
  : path.join(process.resourcesPath, "build/icons/256x256.png");

log.info("Icon Path:", iconPath);

// Create native image if the icon exists
let icon: Electron.NativeImage | undefined;
try {
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
    log.info("Icon loaded successfully");
  } else {
    log.warn("Icon file not found at:", iconPath);
    // Try alternate paths
    const altPaths = [
      path.join(process.resourcesPath, "linux.png"),
      path.join(app.getAppPath(), "build/icons/256x256.png"),
      "/usr/share/icons/hicolor/256x256/apps/notate.png",
    ];

    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        icon = nativeImage.createFromPath(altPath);
        log.info("Icon loaded from alternate path:", altPath);
        break;
      }
    }
  }
} catch (error) {
  log.error("Error loading icon:", error);
}

// Set platform-specific icon
if (process.platform === "darwin" && icon) {
  app.dock.setIcon(icon);
}

const getResourceDirectory = () => {
  const resourceDir =
    process.env.NODE_ENV === "development"
      ? path.join(process.cwd())
      : path.join(process.resourcesPath, "app.asar.unpacked");
  return resourceDir;
};

app.on("ready", async () => {
  try {
    log.info("App ready event triggered");
    const loadingWin = createLoadingWindow(icon);
    log.info("Loading window created");

    // Make sure the window is ready before proceeding
    await new Promise<void>((resolve) => {
      if (!loadingWin) {
        log.warn("Loading window not created");
        resolve();
        return;
      }

      loadingWin.webContents.on("did-finish-load", () => {
        log.info("Loading window loaded");
        loadingWin.show();
        resolve();
      });

      loadingWin.webContents.on(
        "did-fail-load",
        (event, errorCode, errorDescription) => {
          log.error(
            "Loading window failed to load:",
            errorCode,
            errorDescription
          );
          resolve();
        }
      );
    });

    // Add a small delay to ensure the window is visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      updateLoadingStatus("Starting Python server...", 10);
      log.info("Attempting to start Python server");
      await startPythonServer();
      log.info("Python server started successfully");
    } catch (error) {
      log.error("Failed to start Python server:", error);
      if (loadingWin && !loadingWin.isDestroyed()) {
        updateLoadingStatus(`Failed to start Python server: ${error}`, 100);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw error;
    }

    const mainWindow = createMainWindow(icon);
    log.info("Main window created");
    db.init();
    log.info("Database initialized");

    pollResource(mainWindow);
    createTray(mainWindow);
    createMenu(mainWindow);
    setupIpcHandlers(mainWindow);
    setupVttHandlers();
    setupDbHandlers();
    setupChatHandlers(mainWindow);
    setupCollectionHandlers();
    setupMenuHandlers(mainWindow);
    setupOllamaHandlers();
    setupAzureOpenAI();
    setupFileHandlers();
    setupCustomApiHandlers();
    setupOpenRouterHandlers();
    handleCloseEvents(mainWindow);
    setupLocalModelHandlers();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    mainWindow.show();

    // Only close loading window if it still exists and isn't destroyed
    if (loadingWin && !loadingWin.isDestroyed()) {
      loadingWin.close();
    }

    app.setAboutPanelOptions({
      applicationName: app.name,
      applicationVersion: app.getVersion(),
      iconPath: path.resolve(getResourceDirectory(), "linux.png"),
    });
  } catch (error) {
    log.error(`Failed to start application: ${error}`);
    console.error("Failed to start application:", error);
    if (error instanceof Error) {
      log.error("Error stack:", error.stack);
    }
    updateLoadingStatus(`Failed to start: ${error}`, 100, true);
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Give user time to see error
    app.quit();
  }
});

app.on("will-quit", () => {
  if (!isDev()) {
    const tempPath = path.join(app.getPath("temp"), "notate-backend");
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

app.on("window-all-closed", () => {
  stopPythonServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopPythonServer();
});
