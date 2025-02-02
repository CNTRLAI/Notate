import { BrowserWindow, Menu, MenuItem } from "electron";
import { app } from "electron";
import { ipcWebContentsSend, isDev } from "./util.js";

export function createMenu(mainWindow: BrowserWindow) {
  const template: (Electron.MenuItemConstructorOptions | MenuItem)[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Change User",
          click: () => {
            mainWindow.webContents.send("resetUserState");
            setTimeout(() => {
              mainWindow.webContents.send("changeView", "SelectAccount");
            }, 100);
          },
        },
        {
          label: "Restart",
          click: () => {
            app.relaunch();
            app.exit(0);
          },
        },
        {
          label: "DevTools",
          click: () => mainWindow.webContents.openDevTools(),
        },
        {
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Delete", role: "delete" },
        { type: "separator" },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectAll",
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Chat",
          click: () =>
            ipcWebContentsSend("changeView", mainWindow.webContents, "Chat"),
        },
        {
          label: "History",
          click: () =>
            ipcWebContentsSend("changeView", mainWindow.webContents, "History"),
        },
        {
          label: "File Explorer",
          click: () =>
            ipcWebContentsSend(
              "changeView",
              mainWindow.webContents,
              "FileExplorer"
            ),
        },
        { type: "separator" },
      ],
    },
  ];

  if (isDev()) {
    (template[2].submenu as Electron.MenuItemConstructorOptions[]).push(
      { type: "separator" },
      {
        label: "Temp DevTools",
        click: () => mainWindow.webContents.openDevTools(),
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // For Windows, we also set the menu on the window itself
  if (process.platform === "win32") {
    mainWindow.setMenu(menu);
  }
}
