import type { Env, HtmlRenderRequest, ImageFormat } from "../../types/index.js";
import { applyAfterLoad, openSafePage } from "../browser.js";

export interface HtmlImageResult {
  bytes: Uint8Array;
  contentType: string;
  extension: ImageFormat;
  width?: number;
  height?: number;
}

export async function renderHtmlImage(env: Env, request: HtmlRenderRequest): Promise<HtmlImageResult> {
  const width = request.width ?? 1200;
  const height = request.height ?? 630;
  const format = request.format ?? "png";

  const { browser, page } = await openSafePage(env, {
    viewportWidth: width,
    viewportHeight: height,
    deviceScaleFactor: request.device_scale_factor ?? 1,
    userAgent: request.user_agent,
    headers: request.headers,
    darkMode: request.dark_mode,
    locale: request.locale,
    timezone: request.timezone,
    blockResources: request.block_resources,
  });

  try {
    const document = injectCss(request.html, request.css);
    await page.setContent(document, { waitUntil: request.wait_until ?? "networkidle0", timeout: 25_000 });
    await applyAfterLoad(page, {
      delay: request.delay,
      waitForSelector: request.wait_for_selector,
      customCss: request.custom_css,
      customJs: request.custom_js,
      clickSelector: request.click_selector,
      scrollTo: request.scroll_to,
    });

    const opts: Record<string, unknown> = { type: format, omitBackground: request.omit_background ?? false };
    if (format !== "png") opts.quality = Math.min(100, Math.max(1, Math.round(request.quality ?? 90)));

    let raw: unknown;
    if (request.selector) {
      const element = await page.$(request.selector);
      if (!element) throw new Error(`Selector not found: ${request.selector}`);
      raw = await element.screenshot(opts);
    } else if (request.full_page) {
      raw = await page.screenshot({ ...opts, fullPage: true });
    } else {
      raw = await page.screenshot({ ...opts, clip: { x: 0, y: 0, width, height } });
    }

    const bytes = normalizeBinary(raw);
    return {
      bytes,
      contentType: format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png",
      extension: format,
      width: request.selector || request.full_page ? undefined : width,
      height: request.selector || request.full_page ? undefined : height,
    };
  } finally {
    await browser.close();
  }
}

function injectCss(html: string, css?: string): string {
  if (!css) return html;
  const style = `<style data-ogify-user-css>${css}</style>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${style}</head>`);
  return `${style}${html}`;
}

function normalizeBinary(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  throw new Error("Browser did not return binary image data.");
}
