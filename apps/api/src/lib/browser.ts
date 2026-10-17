import puppeteer from "@cloudflare/puppeteer";
import type { BlockableResource, BrowserCookie, Env, ScreenshotWaitUntil } from "../types/index.js";
import { isPrivateHost } from "./security.js";

type Browser = Awaited<ReturnType<typeof puppeteer.launch>>;
type Page = Awaited<ReturnType<Browser["newPage"]>>;

export interface PageSetupOptions {
  viewportWidth?: number;
  viewportHeight?: number;
  deviceScaleFactor?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  darkMode?: boolean;
  blockMedia?: boolean;
  blockResources?: BlockableResource[];
  locale?: string;
  timezone?: string;
}

export interface AfterLoadOptions {
  delay?: number;
  waitForSelector?: string;
  customCss?: string;
  customJs?: string;
  hideSelectors?: string[];
  clickSelector?: string;
  scrollTo?: number | "bottom";
}

export async function openSafePage(env: Env, options: PageSetupOptions = {}): Promise<{ browser: Browser; page: Page }> {
  // Browser binding types differ slightly between Wrangler and Cloudflare's Puppeteer fork.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser = await puppeteer.launch(env.BROWSER as any);
  const page = await browser.newPage();

  const width = options.viewportWidth ?? 1200;
  const height = options.viewportHeight ?? 630;
  const deviceScaleFactor = Math.min(3, Math.max(1, options.deviceScaleFactor ?? 1));
  await page.setViewport({ width, height, deviceScaleFactor });

  if (options.userAgent) await page.setUserAgent(options.userAgent);
  const headers = { ...(options.headers ?? {}) };
  if (options.locale && !Object.keys(headers).some((key) => key.toLowerCase() === "accept-language")) {
    headers["Accept-Language"] = options.locale;
  }
  if (Object.keys(headers).length) await page.setExtraHTTPHeaders(headers);
  if (options.darkMode) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  }
  if (options.timezone) {
    const candidate = page as unknown as { emulateTimezone?: (timezoneId: string) => Promise<void> };
    if (candidate.emulateTimezone) await candidate.emulateTimezone(options.timezone);
  }

  const blocked = new Set<BlockableResource>(options.blockResources ?? []);
  if (options.blockMedia !== false) blocked.add("media");

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType() as BlockableResource | "document" | "xhr" | "fetch" | "websocket" | "other";
    if (resourceType === "websocket" || blocked.has(resourceType as BlockableResource)) {
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

  return { browser, page };
}

export async function applyCookies(page: Page, cookies: BrowserCookie[] | undefined, defaultUrl: string): Promise<void> {
  if (!cookies?.length) return;
  const safeCookies = cookies.slice(0, 50).map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    ...(cookie.domain ? { domain: cookie.domain } : { url: defaultUrl }),
    ...(cookie.path ? { path: cookie.path } : {}),
    ...(cookie.expires !== undefined ? { expires: cookie.expires } : {}),
    ...(cookie.httpOnly !== undefined ? { httpOnly: cookie.httpOnly } : {}),
    ...(cookie.secure !== undefined ? { secure: cookie.secure } : {}),
    ...(cookie.sameSite ? { sameSite: cookie.sameSite } : {}),
  }));
  // Cloudflare's Puppeteer cookie type can lag upstream Puppeteer by a release.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.setCookie(...(safeCookies as any[]));
}

export async function navigateSafe(page: Page, url: string, waitUntil: ScreenshotWaitUntil = "networkidle0"): Promise<void> {
  await page.goto(url, { waitUntil, timeout: 25_000 });
}

export async function applyAfterLoad(page: Page, options: AfterLoadOptions = {}): Promise<void> {
  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: 10_000 });
  }

  if (options.customCss) {
    await page.addStyleTag({ content: options.customCss });
  }

  if (options.hideSelectors?.length) {
    const selectors = options.hideSelectors.slice(0, 25);
    await page.evaluate((items) => {
      for (const selector of items) {
        try {
          document.querySelectorAll(selector).forEach((node) => {
            (node as HTMLElement).style.setProperty("display", "none", "important");
          });
        } catch {
          // Ignore invalid selectors supplied by callers; input validation catches obvious cases.
        }
      }
    }, selectors);
  }

  if (options.clickSelector) {
    await page.waitForSelector(options.clickSelector, { timeout: 10_000 });
    await page.click(options.clickSelector);
  }

  if (options.scrollTo !== undefined) {
    const destination = options.scrollTo;
    await page.evaluate((target) => {
      const y = target === "bottom" ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) : target;
      window.scrollTo(0, Number(y));
    }, destination);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (options.customJs) {
    // The script runs in the isolated browser page, not in the Worker runtime.
    await page.evaluate((source) => {
      // eslint-disable-next-line no-eval
      (0, eval)(source);
    }, options.customJs);
  }

  const delay = Math.min(Math.max(0, options.delay ?? 0), 10_000);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}

export type OgifyPage = Page;
