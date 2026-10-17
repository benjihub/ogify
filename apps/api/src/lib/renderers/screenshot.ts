/**
 * URL → PNG screenshot using Cloudflare Browser Rendering (Puppeteer).
 */
import puppeteer from "@cloudflare/puppeteer";
import type { Env, ScreenshotWaitUntil } from "../../types/index.js";
import { isPrivateHost } from "../security.js";

export interface ScreenshotOptions {
  url: string;
  viewportWidth?: number;
  viewportHeight?: number;
  delay?: number;
  waitUntil?: ScreenshotWaitUntil;
}

export async function screenshotUrl(
  env: Env,
  {
    url,
    viewportWidth = 1200,
    viewportHeight = 630,
    delay = 0,
    waitUntil = "networkidle0",
  }: ScreenshotOptions
): Promise<Uint8Array> {
  const clampedDelay = Math.min(Math.max(0, delay), 5_000);
  // Browser binding types differ slightly between Wrangler and Puppeteer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser = await puppeteer.launch(env.BROWSER as any);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: viewportWidth, height: viewportHeight });

    // Keep fonts and normal image assets so screenshots look like the source site.
    // Block streaming media/websockets, and block navigation/assets that directly
    // target private/local addresses (including redirects).
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["media", "websocket"].includes(resourceType)) {
        req.abort();
        return;
      }

      try {
        const requestUrl = req.url();
        if (requestUrl.startsWith("http://") || requestUrl.startsWith("https://")) {
          const parsed = new URL(requestUrl);
          if (isPrivateHost(parsed.hostname)) {
            req.abort();
            return;
          }
        }
      } catch {
        req.abort();
        return;
      }

      req.continue();
    });

    await page.goto(url, { waitUntil, timeout: 20_000 });

    if (clampedDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, clampedDelay));
    }

    const screenshot = (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: viewportWidth, height: viewportHeight },
    })) as unknown;

    if (screenshot instanceof Uint8Array) return screenshot;
    if (screenshot instanceof ArrayBuffer) return new Uint8Array(screenshot);
    throw new Error("Browser screenshot did not return binary PNG data.");
  } finally {
    await browser.close();
  }
}
