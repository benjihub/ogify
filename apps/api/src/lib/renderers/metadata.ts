import type { Env, MetadataExtractRequest, PageMetadata } from "../../types/index.js";
import { applyAfterLoad, applyCookies, navigateSafe, openSafePage } from "../browser.js";

export async function extractPageMetadata(env: Env, request: MetadataExtractRequest): Promise<PageMetadata> {
  const { browser, page } = await openSafePage(env, {
    viewportWidth: 1280,
    viewportHeight: 800,
    userAgent: request.user_agent,
    headers: request.headers,
    darkMode: request.dark_mode,
    locale: request.locale,
    timezone: request.timezone,
    blockResources: request.block_resources,
  });

  try {
    await applyCookies(page, request.cookies, request.url);
    await navigateSafe(page, request.url, request.wait_until ?? "domcontentloaded");
    await applyAfterLoad(page, {
      delay: request.delay,
      waitForSelector: request.wait_for_selector,
      customCss: request.custom_css,
      customJs: request.custom_js,
      clickSelector: request.click_selector,
      scrollTo: request.scroll_to,
    });

    const result = await page.evaluate(() => {
      const meta = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || "";
      const href = (selector: string) => document.querySelector<HTMLLinkElement>(selector)?.href || "";
      return {
        url: location.href,
        title: meta('meta[property="og:title"]') || document.title || "",
        description: meta('meta[property="og:description"]') || meta('meta[name="description"]') || "",
        canonical_url: href('link[rel="canonical"]'),
        site_name: meta('meta[property="og:site_name"]'),
        image_url: meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]'),
        favicon_url: href('link[rel~="icon"]') || "/favicon.ico",
        theme_color: meta('meta[name="theme-color"]'),
        locale: meta('meta[property="og:locale"]') || document.documentElement.lang || "",
      };
    });

    return {
      url: result.url,
      title: result.title.slice(0, 300),
      description: result.description.slice(0, 1_000),
      canonical_url: normalizeMaybeUrl(result.canonical_url, result.url),
      site_name: result.site_name || undefined,
      image_url: normalizeMaybeUrl(result.image_url, result.url),
      favicon_url: normalizeMaybeUrl(result.favicon_url, result.url),
      theme_color: result.theme_color || undefined,
      locale: result.locale || undefined,
    };
  } finally {
    await browser.close();
  }
}

function normalizeMaybeUrl(value: string, base: string): string | undefined {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); }
  catch { return undefined; }
}
