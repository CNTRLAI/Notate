import { chromium } from "playwright";

export async function webSearch(payload: { url: string }) {
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

  const page = await context.newPage();

  try {
    await page.goto(payload.url, {
      waitUntil: "networkidle",
      timeout: 3000,
    });

    await page.waitForSelector("body");

    const metadata = await page.evaluate((targetUrl: string) => {
      const getMetaContent = (name: string): string => {
        const element = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return element ? (element as HTMLMetaElement).content : "";
      };
      return {
        title: document.title,
        source: targetUrl,
        description:
          getMetaContent("description") || getMetaContent("og:description"),
        author: getMetaContent("author"),
        keywords: getMetaContent("keywords"),
        ogImage: getMetaContent("og:image"),
      };
    }, payload.url);

    const textContent = await page.evaluate(() => {
      // Remove scripts and styles before getting text content
      const scripts = document.getElementsByTagName("script");
      const styles = document.getElementsByTagName("style");
      Array.from(scripts).forEach((script) => script.remove());
      Array.from(styles).forEach((style) => style.remove());
      return document.body.innerText;
    });
    console.log("Length of textContent", textContent.length);
    let content = textContent;
    if (textContent.length > 2000) {
      content = textContent.slice(0, 2000);
    }
    console.log("Length of content", content.length);
    return {
      metadata,
      textContent: content,
    };
  } catch {
    return {
      metadata: null,
      textContent: "The URL is invalid or the page is not accessible",
    };
  } finally {
    await context.close();
    await browser.close();
  }
}
