import type { ContentExtractRequest, Env, PageContent } from "../../types/index.js";
import { applyAfterLoad, applyCookies, navigateSafe, openSafePage } from "../browser.js";

export async function extractPageContent(env: Env, request: ContentExtractRequest): Promise<PageContent> {
  const { browser, page } = await openSafePage(env, {
    viewportWidth: 1280,
    viewportHeight: 900,
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

    const result = await page.evaluate(({ selector, includeLinks }) => {
      const scope = selector ? document.querySelector(selector) : document.documentElement;
      if (!scope) throw new Error(`Selector not found: ${selector}`);
      const links = includeLinks
        ? Array.from(scope.querySelectorAll("a[href]"))
            .slice(0, 200)
            .map((node) => {
              const anchor = node as HTMLAnchorElement;
              return {
                text: (anchor.innerText || anchor.textContent || "").trim().slice(0, 300),
                url: anchor.href,
              };
            })
        : undefined;
      return {
        url: location.href,
        title: document.title || "",
        text: ((scope as HTMLElement).innerText || scope.textContent || "").trim(),
        html: scope.innerHTML || "",
        links,
      };
    }, { selector: request.selector, includeLinks: request.include_links ?? false });

    return {
      url: result.url,
      title: result.title.slice(0, 300),
      text: result.text.slice(0, 200_000),
      html: result.html.slice(0, 500_000),
      links: result.links,
    };
  } finally {
    await browser.close();
  }
}
