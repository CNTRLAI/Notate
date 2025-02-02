import { test, expect, vi, Mock } from "vitest";
import { createTray } from "./tray.js";
import { app, BrowserWindow, Menu, MenuItemConstructorOptions, MenuItem } from "electron";

vi.mock("electron", () => ({
  Tray: vi.fn().mockReturnValue({
    setContextMenu: vi.fn(),
  }),
  app: {
    getAppPath: vi.fn().mockReturnValue("/"),
    dock: {
      show: vi.fn(),
    },
    quit: vi.fn(),
  },
  Menu: {
    buildFromTemplate: vi.fn(),
  },
  MenuItem: vi.fn().mockImplementation((options) => ({
    ...options,
    commandId: 1,
    menu: null,
    userAccelerator: null,
  })),
}));

// Create a mock BrowserWindow with just the methods we need
const mainWindow = {
  show: vi.fn(),
  webContents: {
    openDevTools: vi.fn(),
  },
  // Add required event emitter methods
  on: vi.fn(),
  once: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  listenerCount: vi.fn(),
  listeners: vi.fn(),
  rawListeners: vi.fn(),
  prependListener: vi.fn(),
  prependOnceListener: vi.fn(),
  eventNames: vi.fn(),
} as unknown as BrowserWindow;

test("createTray creates tray with correct menu items", () => {
  createTray(mainWindow);
  const calls = (Menu.buildFromTemplate as Mock).mock.calls;
  const args = calls[0] as [MenuItemConstructorOptions[]];
  const template = args[0];
  
  expect(template).toHaveLength(2);
  expect(template[0].label).toEqual("Show");
  expect(template[1].label).toEqual("Quit");

  // Create mock objects for click handlers
  const mockMenuItem = new MenuItem({}) as MenuItem;
  const mockBrowserWindow = {} as BrowserWindow;
  const mockEvent = {} as KeyboardEvent;

  // Test Show menu item click
  template[0].click?.(mockMenuItem, mockBrowserWindow, mockEvent);
  expect(mainWindow.show).toHaveBeenCalled();
  expect(app.dock.show).toHaveBeenCalled();

  // Test Quit menu item click
  template[1].click?.(mockMenuItem, mockBrowserWindow, mockEvent);
  expect(app.quit).toHaveBeenCalled();
});
