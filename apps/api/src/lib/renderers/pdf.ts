import type { Env, PdfRenderRequest } from "../../types/index.js";
import { applyAfterLoad, applyCookies, navigateSafe, openSafePage } from "../browser.js";

export async function renderPdf(env: Env, request: PdfRenderRequest): Promise<Uint8Array> {
  const { browser, page } = await openSafePage(env, {
    viewportWidth: 1280,
    viewportHeight: 900,
    userAgent: request.user_agent,
    headers: request.headers,
    darkMode: request.dark_mode,
    locale: request.locale,
    timezone: request.timezone,
    blockResources: request.block_resources,
    blockMedia: false,
  });

  try {
    if (request.url) {
      await applyCookies(page, request.cookies, request.url);
      await navigateSafe(page, request.url, request.wait_until ?? "networkidle0");
    } else if (request.html) {
      await page.setContent(injectCss(request.html, request.css), {
        waitUntil: request.wait_until ?? "networkidle0",
        timeout: 25_000,
      });
    } else {
      throw new Error("PDF render requires url or html.");
    }

    await applyAfterLoad(page, {
      delay: request.delay,
      waitForSelector: request.wait_for_selector,
      hideSelectors: request.hide_selectors,
      customCss: request.custom_css,
      customJs: request.custom_js,
      clickSelector: request.click_selector,
      scrollTo: request.scroll_to,
    });

    const raw: unknown = await page.pdf({
      format: request.format ?? "A4",
      landscape: request.landscape ?? false,
      printBackground: request.print_background ?? true,
      margin: {
        top: request.margin_top ?? "0.4in",
        right: request.margin_right ?? "0.4in",
        bottom: request.margin_bottom ?? "0.4in",
        left: request.margin_left ?? "0.4in",
      },
    });

    if (raw instanceof Uint8Array) return raw;
    if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
    throw new Error("Browser did not return binary PDF data.");
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
