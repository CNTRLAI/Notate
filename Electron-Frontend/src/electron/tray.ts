import { app, Menu, Tray, BrowserWindow } from "electron";
import { getAssetsPath } from "./pathResolver.js";

export function createTray(mainWindow: BrowserWindow) {
  const tray = new Tray(getAssetsPath() + "/trayIcon.png");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          mainWindow.show();
          if (app.dock) {
            app.dock.show();
          }
        },
      },
      { label: "Quit", click: () => app.quit() },
    ])
  );
}
