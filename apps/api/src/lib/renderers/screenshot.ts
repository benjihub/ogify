import type { Env, ImageFormat, ScreenshotWaitUntil } from "../../types/index.js";
import { applyAfterLoad, applyCookies, navigateSafe, openSafePage } from "../browser.js";

export interface ScreenshotOptions {
  url: string;
  viewportWidth?: number;
  viewportHeight?: number;
  delay?: number;
  waitUntil?: ScreenshotWaitUntil;
  waitForSelector?: string;
  customCss?: string;
  customJs?: string;
  userAgent?: string;
  headers?: Record<string, string>;
  darkMode?: boolean;
  fullPage?: boolean;
  selector?: string;
  format?: ImageFormat;
  quality?: number;
  hideSelectors?: string[];
  deviceScaleFactor?: number;
  cookies?: import("../../types/index.js").BrowserCookie[];
  locale?: string;
  timezone?: string;
  clickSelector?: string;
  scrollTo?: number | "bottom";
  blockResources?: import("../../types/index.js").BlockableResource[];
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

export interface ScreenshotResult {
  bytes: Uint8Array;
  contentType: string;
  extension: ImageFormat;
  width?: number;
  height?: number;
}

export async function captureUrl(env: Env, options: ScreenshotOptions): Promise<ScreenshotResult> {
  const {
    url,
    viewportWidth = 1200,
    viewportHeight = 630,
    delay = 0,
    waitUntil = "networkidle0",
    waitForSelector,
    customCss,
    customJs,
    userAgent,
    headers,
    darkMode,
    fullPage = false,
    selector,
    format = "png",
    quality = 90,
    hideSelectors,
    deviceScaleFactor = 1,
    cookies,
    locale,
    timezone,
    clickSelector,
    scrollTo,
    blockResources,
    clip,
    omitBackground = false,
  } = options;

  const { browser, page } = await openSafePage(env, {
    viewportWidth,
    viewportHeight,
    deviceScaleFactor,
    userAgent,
    headers,
    darkMode,
    locale,
    timezone,
    blockResources,
  });

  try {
    await applyCookies(page, cookies, url);
    await navigateSafe(page, url, waitUntil);
    await applyAfterLoad(page, { delay, waitForSelector, customCss, customJs, hideSelectors, clickSelector, scrollTo });

    const screenshotOptions: Record<string, unknown> = { type: format, omitBackground };
    if (format !== "png") screenshotOptions.quality = Math.min(100, Math.max(1, Math.round(quality)));

    let raw: unknown;
    if (selector) {
      const element = await page.$(selector);
      if (!element) throw new Error(`Selector not found: ${selector}`);
      raw = await element.screenshot(screenshotOptions);
    } else if (fullPage) {
      raw = await page.screenshot({ ...screenshotOptions, fullPage: true });
    } else {
      raw = await page.screenshot({
        ...screenshotOptions,
        clip: clip ?? { x: 0, y: 0, width: viewportWidth, height: viewportHeight },
      });
    }

    const bytes = normalizeBinary(raw);
    return {
      bytes,
      contentType: imageContentType(format),
      extension: format,
      width: selector || fullPage ? undefined : (clip?.width ?? viewportWidth),
      height: selector || fullPage ? undefined : (clip?.height ?? viewportHeight),
    };
  } finally {
    await browser.close();
  }
}

/** Backward-compatible PNG helper used by legacy endpoints. */
export async function screenshotUrl(env: Env, options: ScreenshotOptions): Promise<Uint8Array> {
  return (await captureUrl(env, { ...options, format: "png" })).bytes;
}

function normalizeBinary(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  throw new Error("Browser did not return binary screenshot data.");
}

function imageContentType(format: ImageFormat): string {
  return format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
}
