import { ipcMain, app, BrowserWindow } from "electron";

export function setupMenuHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle("changeUser", async () => {
    mainWindow.webContents.send("resetUserState");
    await new Promise(resolve => setTimeout(resolve, 100));
    mainWindow.webContents.send("changeView", "SelectAccount");
  });

  ipcMain.handle("quit", async () => {
    app.quit();
  });

  ipcMain.handle("undo", async () => {
    mainWindow.webContents.undo();
  });

  ipcMain.handle("redo", async () => {
    mainWindow.webContents.redo();
  });

  ipcMain.handle("cut", async () => {
    mainWindow.webContents.cut();
  });

  ipcMain.handle("copy", async () => {
    mainWindow.webContents.copy();
  });

  ipcMain.handle("paste", async () => {
    mainWindow.webContents.paste();
  });

  ipcMain.handle("delete", async () => {
    mainWindow.webContents.delete();
  });

  ipcMain.handle("selectAll", async () => {
    mainWindow.webContents.selectAll();
  });

  ipcMain.handle("chat", async () => {
    mainWindow.webContents.send("changeView", "Chat");
  });

  ipcMain.handle("history", async () => {
    mainWindow.webContents.send("changeView", "History");
  });

  ipcMain.handle("toggleDevTools", async () => {
    mainWindow.webContents.toggleDevTools();
  });

  ipcMain.handle("openDevTools", async () => {
    mainWindow.webContents.openDevTools();
  });
}