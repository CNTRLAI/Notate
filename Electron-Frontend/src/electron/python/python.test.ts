import { test, expect, vi, beforeEach } from "vitest";
import { dialog, shell } from "electron";
import { spawn, execSync } from "child_process";
import fs from "fs";
import { startPythonServer } from "./startAndStopPython.js";
import type { Mock } from "vitest";

// Mock all external dependencies
vi.mock("electron", () => ({
  app: {
    getAppPath: vi.fn().mockReturnValue("/mock/app/path"),
    getPath: vi.fn().mockReturnValue("/mock/temp"),
  },
  dialog: {
    showMessageBox: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
  },
}));

vi.mock("child_process", () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    copyFileSync: vi.fn(),
  },
}));

vi.mock("../util.js", () => ({
  isDev: vi.fn(),
}));

vi.mock("../loadingWindow.js", () => ({
  updateLoadingStatus: vi.fn(),
}));

// Mock EventEmitter for spawn process
const mockEventEmitter = {
  on: vi.fn((event: string, callback: (arg: number) => void) => {
    if (event === "close") callback(0);
  }),
  stdout: {
    on: vi.fn((event: string, callback: (data: Buffer) => void) => {
      if (event === "data") {
        callback(Buffer.from("Application startup complete."));
      }
    }),
  },
  stderr: {
    on: vi.fn(),
  },
  pid: 12345,
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("successfully starts python server in dev mode", async () => {
  const isDev = await import("../util.js");
  (isDev.isDev as Mock).mockReturnValue(true);
  (spawn as unknown as Mock).mockReturnValue(mockEventEmitter);
  (fs.existsSync as Mock).mockReturnValue(true);
  (execSync as Mock).mockReturnValue(Buffer.from("Python 3.12.0"));

  await startPythonServer();

  expect(spawn).toHaveBeenCalledTimes(2); // Once for deps, once for server
  expect(execSync).toHaveBeenCalled(); // Python version check
});

test("handles missing Python 3.10 installation", async () => {
  (execSync as Mock).mockImplementation(() => {
    throw new Error("Python not found");
  });
  (dialog.showMessageBox as Mock).mockResolvedValue({ response: 0 });

  await expect(startPythonServer()).rejects.toThrow(
    "Please restart the application after installing Python 3.12"
  );
  expect(shell.openExternal).toHaveBeenCalledWith(
    "https://www.python.org/downloads/release/python-3128/"
  );
});

test("handles dependency installation failure", async () => {
  const isDev = await import("../util.js");
  (isDev.isDev as Mock).mockReturnValue(true);
  (execSync as Mock).mockReturnValue(Buffer.from("Python 3.12.0")); // Mock successful Python check
  const failingEventEmitter = {
    ...mockEventEmitter,
    on: vi.fn((event: string, callback: (code: number) => void) => {
      if (event === "close") callback(1);
    }),
  };
  (spawn as unknown as Mock).mockReturnValue(failingEventEmitter);

  await expect(startPythonServer()).rejects.toThrow();
});

test("extracts backend in production mode when needed", async () => {
  const isDev = await import("../util.js");
  (isDev.isDev as Mock).mockReturnValue(false);
  (execSync as Mock).mockReturnValue(Buffer.from("Python 3.12.0")); // Mock successful Python check

  // Mock file system checks
  (fs.existsSync as Mock)
    .mockReturnValueOnce(false) // unpacked backend doesn't exist
    .mockReturnValueOnce(true) // source path exists
    .mockReturnValueOnce(false) // destination directory doesn't exist
    .mockReturnValue(true); // subsequent checks return true

  (fs.readdirSync as Mock).mockReturnValue(["main.py", "requirements.txt"]);
  (fs.statSync as Mock).mockReturnValue({ isDirectory: () => false });
  (spawn as unknown as Mock).mockReturnValue(mockEventEmitter);

  await startPythonServer();

  // Verify file system operations
  expect(fs.mkdirSync).toHaveBeenCalledWith("/mock/temp/notate-backend", {
    recursive: true,
  });
  expect(fs.copyFileSync).toHaveBeenCalledWith(
    "/mock/app/path/Python-Backend/main.py",
    "/mock/temp/notate-backend/main.py"
  );
  expect(fs.copyFileSync).toHaveBeenCalledWith(
    "/mock/app/path/Python-Backend/requirements.txt",
    "/mock/temp/notate-backend/requirements.txt"
  );
});
