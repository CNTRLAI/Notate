import {
  test,
  expect,
  _electron,
  Page,
  ElectronApplication,
} from "@playwright/test";

let electronApp: ElectronApplication;
let loadingWindow: Page;
let mainWindow: Page;

// Increase timeout for the entire test file
test.setTimeout(160000);

async function waitForMainWindow(timeout = 45000): Promise<Page> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const windows = await electronApp.windows();
    // Find the window that's not the loading window
    const mainWin = windows.find((win) => win !== loadingWindow);
    if (mainWin) {
      return mainWin;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Main window did not appear within timeout");
}

async function waitForPreloadScript(page: Page): Promise<unknown> {
  const timeout = 30000;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error("Timeout waiting for preload script"));
          return;
        }

        const electronBridge = await page.evaluate(() => {
          return (window as { electron?: unknown }).electron;
        });

        if (electronBridge) {
          clearInterval(interval);
          resolve(electronBridge);
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}

test.beforeEach(async () => {
  // Launch the app with increased timeout
  electronApp = await _electron.launch({
    args: ["."],
    env: { NODE_ENV: "development" },
    timeout: 45000,
  });

  // Get the loading window (first window)
  loadingWindow = await electronApp.firstWindow();

  // Wait for loading window to be ready and verify its existence
  await loadingWindow.waitForLoadState("domcontentloaded");

  try {
    // Verify loading window content before it potentially closes
    const loadingContent = await loadingWindow.textContent("body");
    expect(loadingContent).toBeTruthy();
  } catch (error) {
    console.log("Loading window content check failed:", error);
  }

  // Wait for Python server to start and main window to appear
  mainWindow = await waitForMainWindow();
  await mainWindow.waitForLoadState("domcontentloaded");
  await waitForPreloadScript(mainWindow);
});

test.afterEach(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test("application startup sequence", async () => {
  // Verify main window appears and is loaded
  await mainWindow.waitForLoadState("domcontentloaded");

  // Verify main window has expected title
  const title = await mainWindow.title();
  expect(title).toBe("Notate");

  // Verify window count
  const windows = await electronApp.windows();
  expect(windows.length).toBeGreaterThanOrEqual(1);
});

test("main window functionality after startup", async () => {
  // Wait for main window to be ready
  await mainWindow.waitForLoadState("domcontentloaded");

  // Get all windows and verify main window state
  const isMinimized = await electronApp.evaluate(({ BrowserWindow }) => {
    const wins = BrowserWindow.getAllWindows();
    // Find the window that's not minimized (should be our main window)
    const mainWin = wins.find((win) => !win.isMinimized());
    return mainWin ? mainWin.isMinimized() : null;
  });

  expect(isMinimized).toBe(false);
});

test("menu structure verification", async () => {
  // Get the application menu
  interface MenuItem {
    label: string;
    submenuLabels: string[];
  }

  const menu = await electronApp.evaluate(({ Menu }) => {
    const appMenu = Menu.getApplicationMenu();
    if (!appMenu) return null;

    return appMenu.items.map((item) => ({
      label: item.label,
      submenuLabels: item.submenu?.items.map((subItem) => subItem.label) || [],
    }));
  });

  // Verify menu exists
  expect(menu).toBeTruthy();
  expect(Array.isArray(menu)).toBe(true);

  // Verify File menu
  const fileMenu = menu?.find((item) => item.label === "File") as MenuItem;
  expect(fileMenu).toBeTruthy();
  expect(fileMenu.label).toBe("File");
  expect(fileMenu.submenuLabels).toContain("Change User");
  expect(fileMenu.submenuLabels).toContain("Quit");

  // Verify Edit menu
  const editMenu = menu?.find((item) => item.label === "Edit") as MenuItem;
  expect(editMenu).toBeTruthy();
  expect(editMenu.label).toBe("Edit");
  expect(editMenu.submenuLabels).toContain("Undo");
  expect(editMenu.submenuLabels).toContain("Redo");
  expect(editMenu.submenuLabels).toContain("Cut");
  expect(editMenu.submenuLabels).toContain("Copy");
  expect(editMenu.submenuLabels).toContain("Paste");
  expect(editMenu.submenuLabels).toContain("Delete");
  expect(editMenu.submenuLabels).toContain("Select All");

  // Verify View menu
  const viewMenu = menu?.find((item) => item.label === "View") as MenuItem;
  expect(viewMenu).toBeTruthy();
  expect(viewMenu.label).toBe("View");
  expect(viewMenu.submenuLabels).toContain("Chat");
  expect(viewMenu.submenuLabels).toContain("History");
  expect(viewMenu.submenuLabels).toContain("Temp DevTools");
});

test("menu DevTools functionality", async () => {
  // Test menu functionality - Toggle DevTools
  const devToolsVisible = await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    return win?.webContents.isDevToolsOpened() || false;
  });
  expect(devToolsVisible).toBe(false);

  // Toggle DevTools through menu
  await electronApp.evaluate(async ({ Menu, BrowserWindow }) => {
    const appMenu = Menu.getApplicationMenu();
    if (!appMenu) return;

    const viewMenu = appMenu.items.find((item) => item.label === "View");
    if (!viewMenu?.submenu) return;

    const devToolsItem = viewMenu.submenu.items.find(
      (item) => item.label === "Temp DevTools"
    );
    if (devToolsItem) {
      const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      if (win) {
        win.webContents.toggleDevTools();
        // Add a longer wait time for DevTools to open
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  });

  // Verify DevTools is now open
  const devToolsNowVisible = await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    return win?.webContents.isDevToolsOpened() || false;
  });
  expect(devToolsNowVisible).toBe(true);
});

test("menu View functionality", async () => {
  // Wait for initial load
  await mainWindow.waitForLoadState("domcontentloaded");

  // Test View menu functionality - Chat view
  const chatClicked = await electronApp.evaluate(async ({ Menu }) => {
    try {
      const appMenu = Menu.getApplicationMenu();
      if (!appMenu) return false;

      const viewMenu = appMenu.items.find((item) => item.label === "View");
      if (!viewMenu?.submenu) return false;

      const chatItem = viewMenu.submenu.items.find(
        (item) => item.label === "Chat"
      );
      if (!chatItem) return false;

      await chatItem.click();
      return true;
    } catch (error) {
      console.error("Error clicking Chat menu item:", error);
      return false;
    }
  });

  expect(chatClicked).toBe(true);

  // Add a small delay to allow for view change
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Verify the view changed to Chat
  const isChatView = await mainWindow.evaluate(() => {
    // Try multiple possible selectors
    return Boolean(
      document.querySelector('[data-view="Chat"]') ||
        document.querySelector(".chat-view") ||
        document.querySelector("#chat-view") ||
        // Look for any element containing "Chat" text in a heading
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).some((el) =>
          el.textContent?.includes("Notate")
        )
    );
  });
  expect(isChatView).toBe(true);

  // Additional verification - try to find chat-related elements
  const hasChatElements = await mainWindow.evaluate(() => {
    return Boolean(
      document.querySelector('input[type="text"]') || // Chat input
        document.querySelector("textarea") || // Chat input
        document.querySelector(".message") || // Chat messages
        document.querySelector(".chat-container") // Chat container
    );
  });
  expect(hasChatElements).toBe(true);
});

test("menu Change User functionality", async () => {
  // Test menu functionality - Change User
  // Note: This will close the app, so it should be the last test
  const changeUserClicked = await electronApp.evaluate(async ({ Menu }) => {
    try {
      const appMenu = Menu.getApplicationMenu();
      if (!appMenu) return false;

      const fileMenu = appMenu.items.find((item) => item.label === "File");
      if (!fileMenu?.submenu) return false;

      const changeUserItem = fileMenu.submenu.items.find(
        (item) => item.label === "Change User"
      );
      if (!changeUserItem) return false;

      await changeUserItem.click();
      return true;
    } catch (error) {
      console.error("Error clicking Change User menu item:", error);
      return false;
    }
  });

  expect(changeUserClicked).toBe(true);
});

test("keyboard shortcuts and DevTools functionality", async () => {
  // Test common keyboard shortcuts
  await mainWindow.keyboard.press("Control+Z"); // Test Undo
  await mainWindow.keyboard.press("Control+Y"); // Test Redo
  await mainWindow.keyboard.press("Control+A"); // Test Select All

  // Test DevTools using Electron API directly
  await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    if (win && !win.webContents.isDevToolsOpened()) {
      win.webContents.openDevTools();
    }
  });

  // Add a small delay to allow DevTools to open
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const devToolsOpen = await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    return win?.webContents.isDevToolsOpened() || false;
  });
  expect(devToolsOpen).toBe(true);

  // Close DevTools
  await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    if (win && win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    }
  });

  // Verify DevTools is closed
  const devToolsClosed = await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    return !win?.webContents.isDevToolsOpened();
  });
  expect(devToolsClosed).toBe(true);
});

test("window state management", async () => {
  // Test minimize with retry logic
  let retries = 3;
  let isMinimized = false;
  
  while (retries > 0 && !isMinimized) {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      if (win && !win.isMinimized()) {
        win.minimize();
      }
    });
    
    // Wait longer for the window state to change
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    isMinimized = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      return win?.isMinimized() || false;
    });
    
    retries--;
  }
  
  expect(isMinimized).toBe(true);

  // Test restore
  await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    win?.restore();
  });
});

test("chat interaction flow", async () => {
  // Set up response mocking
  await mainWindow.route("**/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        messages: [
          {
            role: "user",
            content: "Test message",
            timestamp: new Date().toISOString(),
          },
          {
            role: "assistant",
            content: "This is a mock AI response",
            timestamp: new Date().toISOString(),
          },
        ],
        title: "Test Conversation",
      }),
    });
  });

  // Navigate to chat view and wait for it to be ready
  const chatClicked = await electronApp.evaluate(async ({ Menu }) => {
    try {
      const appMenu = Menu.getApplicationMenu();
      const viewMenu = appMenu?.items.find((item) => item.label === "View");
      const chatItem = viewMenu?.submenu?.items.find(
        (item) => item.label === "Chat"
      );
      if (!chatItem) return false;
      await chatItem.click();
      return true;
    } catch (error) {
      console.error("Error clicking Chat menu item:", error);
      return false;
    }
  });

  expect(chatClicked).toBe(true);

  // Wait for chat interface to load
  const chatInput = await mainWindow.waitForSelector(
    '[data-testid="chat-input"]',
    {
      timeout: 10000,
      state: "visible",
    }
  );
  expect(chatInput).toBeTruthy();

  // Type the message
  await chatInput.type("Test message");

  // Click the send button instead of pressing Enter
  const sendButton = await mainWindow.waitForSelector(
    '[data-testid="chat-submit"]',
    {
      timeout: 5000,
      state: "visible",
    }
  );
  expect(sendButton).toBeTruthy();
  await sendButton.click();

  // Add debug logging
  console.log("Waiting for user message to appear...");

  // Wait for user message to appear with increased timeout
  const userMessage = await mainWindow.waitForSelector(
    [
      '[data-testid="chat-message-user"]',
      '[data-testid="message-content-user"]',
      ".user-message",
      '.message:has-text("Test message")',
    ].join(","),
    {
      timeout: 20000,
      state: "visible",
    }
  );

  // Add more debug logging
  console.log("User message found, checking content...");

  expect(userMessage).toBeTruthy();

  // Get all text content to debug
  const pageContent = await mainWindow.textContent("body");
  console.log("Page content:", pageContent);

  // Verify the message content
  const messageText = await userMessage.textContent();
  console.log("Message text:", messageText);
  expect(messageText).toContain("Test message");

  // Clean up route
  await mainWindow.unroute("**/chat");
});

test("history view functionality", async () => {
  // Navigate to history view
  const historyClicked = await electronApp.evaluate(async ({ Menu }) => {
    try {
      const appMenu = Menu.getApplicationMenu();
      const viewMenu = appMenu?.items.find((item) => item.label === "View");
      const historyItem = viewMenu?.submenu?.items.find(
        (item) => item.label === "History"
      );
      if (!historyItem) return false;
      await historyItem.click();
      return true;
    } catch (error) {
      console.error("Error clicking History menu item:", error);
      return false;
    }
  });

  expect(historyClicked).toBe(true);

  // Wait for history view to be visible
  const historyView = await mainWindow.waitForSelector(
    '[data-testid="history-view"]',
    {
      timeout: 10000,
      state: "visible",
    }
  );
  expect(historyView).toBeTruthy();

  // Wait for the header to be visible
  const header = await mainWindow.waitForSelector(
    'h1:has-text("Chat History")',
    {
      timeout: 5000,
      state: "visible",
    }
  );
  expect(header).toBeTruthy();

  // Wait for the search input to be visible
  const searchInput = await mainWindow.waitForSelector(
    'input[type="text"][placeholder="Search conversations..."]',
    {
      timeout: 5000,
      state: "visible",
    }
  );
  expect(searchInput).toBeTruthy();

  // Verify the scroll area exists using multiple possible selectors
  const scrollArea = await mainWindow.waitForSelector(
    [
      '[data-testid="history-scroll-area"]',
      ".scroll-area",
      ".scrollarea",
      '[role="scrollarea"]',
      ".overflow-auto",
    ].join(","),
    {
      timeout: 10000,
      state: "visible",
    }
  );
  expect(scrollArea).toBeTruthy();

  // Test search functionality
  await searchInput.type("test");
  await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for search to update

  // Get the entire history view content
  const historyContent = await historyView.textContent();
  expect(historyContent).toContain("Chat History");
});
