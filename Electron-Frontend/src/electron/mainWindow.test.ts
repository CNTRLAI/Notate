import { test, expect, vi, Mock } from "vitest";
import { createMainWindow } from "./mainWindow.js";
import { BrowserWindow } from "electron";
import { closeLoadingWindow } from "./loadingWindow.js";

// Mock process.env for development mode test
vi.stubEnv("NODE_ENV", "development");

// Mock closeLoadingWindow
vi.mock("./loadingWindow.js", () => ({
  closeLoadingWindow: vi.fn(),
}));

// Mock electron
vi.mock("electron", () => ({
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    center: vi.fn(),
    webContents: {
      on: vi.fn(),
      session: {
        setSpellCheckerLanguages: vi.fn(),
      },
    },
    show: vi.fn(),
    maximize: vi.fn(),
  })),
  app: {
    getPath: vi.fn().mockReturnValue("/mock/path"),
    getAppPath: vi.fn().mockReturnValue("/mock/app/path"),
  },
}));

test("createMainWindow creates window with correct configuration in dev mode", () => {
  const window = createMainWindow();
  
  // Verify BrowserWindow was called with correct config
  expect(BrowserWindow).toHaveBeenCalledWith(
    expect.objectContaining({
      width: 800,
      height: 600,
      resizable: true,
      frame: false,
      show: false,
      center: true,
      webPreferences: expect.objectContaining({
        spellcheck: true,
        preload: expect.stringContaining("/dist-electron/preload.cjs"),
      }),
    })
  );
  
  // Verify window methods were called
  expect(window.loadURL).toHaveBeenCalledWith("http://localhost:5131");
  
  // Verify ready-to-show handler
  const readyToShowHandler = (window.once as Mock).mock.calls.find(
    call => call[0] === "ready-to-show"
  )?.[1];
  expect(readyToShowHandler).toBeDefined();
  
  // Execute ready-to-show handler
  if (readyToShowHandler) {
    readyToShowHandler();
    expect(closeLoadingWindow).toHaveBeenCalled();
    expect(window.show).toHaveBeenCalled();
    expect(window.center).toHaveBeenCalled();
  }
});

test("createMainWindow creates window with correct configuration in production mode", () => {
  // Set NODE_ENV to production
  vi.stubEnv("NODE_ENV", "production");
  
  const window = createMainWindow();
  
  // Verify window methods for production mode
  expect(window.loadFile).toHaveBeenCalled();
  expect(window.loadURL).not.toHaveBeenCalled();
  
  // Reset NODE_ENV
  vi.stubEnv("NODE_ENV", "development");
}); 