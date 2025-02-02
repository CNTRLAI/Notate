import { chromium } from "playwright";

import fs from "fs";
import path from "path";
import { app, BrowserWindow } from "electron";
import db from "../db.js";
import { getToken } from "../authentication/token.js";

interface PythonProgressData {
  type: string;
  message: string;
  chunk?: number;
  totalChunks?: number;
  percent_complete?: string;
}

interface ProgressData {
  status: string;
  data: {
    message: string;
    chunk?: number;
    total_chunks?: number;
    percent_complete?: string;
  };
}

export async function websiteFetch(payload: {
  url: string;
  userId: number;
  userName: string;
  collectionId: number;
  collectionName: string;
  signal?: AbortSignal;
}): Promise<{
  success: boolean;
  content?: string;
  textContent?: string;
  metadata?: {
    title: string;
    description: string;
    author: string;
    keywords: string;
    ogImage: string;
  };
  error?: string;
  url: string;
  filePath?: string;
}> {
  try {
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];

    const sendProgress = (data: string) => {
      try {
        if (typeof data === "string") {
          const lines = data.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              const jsonStr = line.replace(/^data:\s*/, "").trim();
              if (jsonStr) {
                try {
                  // Convert Python-style single quotes to double quotes for JSON parsing
                  const formattedJson = jsonStr
                    .replace(/'/g, '"')
                    // Handle nested quotes in message strings
                    .replace(/"([^"]*)'([^']*)'([^"]*)"/, '"$1\\"$2\\"$3"');
                  const parsedData = JSON.parse(
                    formattedJson
                  ) as PythonProgressData;

                  const progressData: ProgressData = {
                    status: parsedData.type || "progress",
                    data: {
                      message: parsedData.message,
                      chunk: parsedData.chunk,
                      total_chunks: parsedData.totalChunks,
                      percent_complete: parsedData.percent_complete,
                    },
                  };

                  mainWindow?.webContents.send("ingest-progress", progressData);
                } catch (parseError) {
                  console.error(
                    "[WEBSITE_FETCH] JSON parse error:",
                    parseError
                  );
                  console.error(
                    "[WEBSITE_FETCH] Failed to parse data:",
                    jsonStr
                  );
                }
              }
            }
          }
        } else {
          mainWindow?.webContents.send("ingest-progress", data);
        }
      } catch (error) {
        console.error("[WEBSITE_FETCH] Error in sendProgress:", error);
        console.error("[WEBSITE_FETCH] Problematic data:", data);
        mainWindow?.webContents.send("ingest-progress", {
          status: "error",
          data: {
            message: "Error processing progress update",
          },
        });
      }
    };

    let apiKey = null;
    try {
      apiKey = db.getApiKey(payload.userId, "openai");
    } catch {
      apiKey = null;
    }
    let isLocal = false;
    let localEmbeddingModel = "";
    if (!apiKey) {
      isLocal = true;
      localEmbeddingModel =
        "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5";
    }
    if (payload.collectionId) {
      if (db.isCollectionLocal(payload.collectionId)) {
        isLocal = true;
        localEmbeddingModel = db.getCollectionLocalEmbeddingModel(
          payload.collectionId
        );
      }
    }

    const browser = await chromium.launch({
      headless: true,
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "linux"
          ? "/usr/bin/google-chrome"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
    });
    sendProgress(
      JSON.stringify({
        type: "progress",
        message: "Launching browser...",
        chunk: 1,
        totalChunks: 4,
        percent_complete: "25%",
      })
    );

    const page = await context.newPage();

    sendProgress(
      JSON.stringify({
        type: "progress",
        message: "Navigating to website...",
        chunk: 2,
        totalChunks: 4,
        percent_complete: "50%",
      })
    );

    await page.goto(payload.url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForSelector("body");

    const metadata = await page.evaluate((url) => {
      const getMetaContent = (name: string): string => {
        const element = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return element ? (element as HTMLMetaElement).content : "";
      };

      return {
        title: document.title,
        source: url,
        description:
          getMetaContent("description") || getMetaContent("og:description"),
        author: getMetaContent("author"),
        keywords: getMetaContent("keywords"),
        ogImage: getMetaContent("og:image"),
      };
    }, payload.url);

    sendProgress(
      JSON.stringify({
        type: "progress",
        message: "Extracting content...",
        chunk: 3,
        totalChunks: 4,
        percent_complete: "75%",
      })
    );

    const textContent = await page.evaluate(() => {
      const scripts = document.getElementsByTagName("script");
      const styles = document.getElementsByTagName("style");
      Array.from(scripts).forEach((script) => script.remove());
      Array.from(styles).forEach((style) => style.remove());
      return document.body.innerText;
    });

    await browser.close();

    const collectionPath = path.join(
      process.platform === "linux" ? app.getPath("userData") : app.getAppPath(),
      "..",
      "FileCollections",
      payload.userId.toString() + "_" + payload.userName,
      payload.collectionId.toString() + "_" + payload.collectionName
    );

    if (!fs.existsSync(collectionPath)) {
      fs.mkdirSync(collectionPath, { recursive: true });
    }

    const fileName = `${new URL(payload.url).hostname}_${Date.now()}.txt`;
    const filePath = path.join(collectionPath, fileName);
    fs.writeFileSync(filePath, textContent);

    db.addFileToCollection(payload.userId, payload.collectionId, fileName);

    sendProgress(
      JSON.stringify({
        type: "progress",
        message: "Starting file processing...",
        chunk: 4,
        totalChunks: 4,
        percent_complete: "90%",
      })
    );

    const controller = new AbortController();

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }

    const token = await getToken({ userId: payload.userId.toString() });
    const response = await fetch("http://localhost:47372/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        file_path: filePath,
        metadata: metadata,
        api_key: apiKey,
        user: payload.userId,
        collection: payload.collectionId,
        collection_name: payload.collectionName,
        is_local: isLocal,
        local_embedding_model: localEmbeddingModel,
      }),
      signal: controller.signal,
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get response reader");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (payload.signal?.aborted || controller.signal.aborted) {
        reader.cancel();
        sendProgress(
          JSON.stringify({
            type: "error",
            message: "Operation cancelled",
          })
        );
        return {
          success: false,
          error: "Operation cancelled",
          url: payload.url,
        };
      }

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || "";

      for (const message of messages) {
        if (message.trim()) {
          sendProgress(message);
        }
      }
    }

    if (buffer.trim()) {
      sendProgress(buffer);
    }

    return {
      success: true,
      textContent,
      metadata,
      url: payload.url,
      filePath,
    };
  } catch (error) {
    console.error("[WEBSITE_FETCH] Error in website fetch:", error);
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];

    mainWindow?.webContents.send("ingest-progress", {
      status: "error",
      data: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      url: payload.url,
    };
  }
}
