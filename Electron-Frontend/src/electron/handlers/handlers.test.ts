import { test, expect, vi, Mock } from "vitest";
import { ipcMain } from "electron";

// Mock electron IPC
vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

// Example handler function to test
const exampleHandler = async (event: Electron.Event, ...args: unknown[]) => {
  return { success: true, data: args[0] };
};

test("IPC handler registration", () => {
  // Register handler
  ipcMain.handle("example-channel", exampleHandler);

  // Verify handler was registered
  expect(ipcMain.handle).toHaveBeenCalledWith(
    "example-channel",
    expect.any(Function)
  );

  // Get the registered handler
  const registeredHandler = (ipcMain.handle as Mock).mock.calls.find(
    (
      call: unknown[]
    ): call is [string, (...args: unknown[]) => Promise<unknown>] =>
      Array.isArray(call) && call.length === 2 && typeof call[0] === "string"
  )?.[1];

  expect(registeredHandler).toBeDefined();
});

test("IPC handler execution", async () => {
  const mockData = { test: "data" };
  // Execute handler
  const result = await exampleHandler(
    {
      preventDefault: () => {},
      defaultPrevented: false,
    },
    mockData
  );

  // Verify result
  expect(result).toEqual({
    success: true,
    data: mockData,
  });
});

test("IPC handler error handling", async () => {
  const errorHandler = async () => {
    throw new Error("Test error");
  };

  // Register error handler
  ipcMain.handle("error-channel", errorHandler);

  // Execute handler and expect it to throw
  await expect(errorHandler()).rejects.toThrow("Test error");
});
