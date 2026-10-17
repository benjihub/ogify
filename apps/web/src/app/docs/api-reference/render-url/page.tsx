import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "url", type: "string", required: "Yes", notes: "Public http/https URL. Private/local hosts are blocked." },
  { name: "viewport_width", type: "integer", required: "No", notes: "320–2400. Defaults to 1200." },
  { name: "viewport_height", type: "integer", required: "No", notes: "240–3000. Defaults to 630." },
  { name: "full_page", type: "boolean", required: "No", notes: "Capture the entire page height." },
  { name: "selector", type: "string", required: "No", notes: "Capture one matching element instead of the viewport." },
  { name: "format", type: "png | jpeg | webp", required: "No", notes: "Defaults to png." },
  { name: "quality", type: "integer", required: "No", notes: "1–100 for JPEG/WebP." },
  { name: "delay", type: "integer", required: "No", notes: "0–10000 ms after navigation." },
  { name: "wait_until", type: "string", required: "No", notes: "load, domcontentloaded, or networkidle0." },
  { name: "wait_for_selector", type: "string", required: "No", notes: "Wait for a CSS selector before capture." },
  { name: "custom_css", type: "string", required: "No", notes: "Inject up to 100 KB of CSS before capture." },
  { name: "custom_js", type: "string", required: "No", notes: "Run page-side JavaScript before capture." },
  { name: "dark_mode", type: "boolean", required: "No", notes: "Emulate prefers-color-scheme: dark." },
  { name: "hide_selectors", type: "string[]", required: "No", notes: "Hide up to 25 elements before capture." },
  { name: "headers", type: "object", required: "No", notes: "Additional safe request headers." },
  { name: "user_agent", type: "string", required: "No", notes: "Override browser user agent." },
  { name: "device_scale_factor", type: "number", required: "No", notes: "1–3 for higher-density output." },
  { name: "cookies", type: "array", required: "No", notes: "Set up to 50 cookies before navigation." },
  { name: "locale", type: "string", required: "No", notes: "Set Accept-Language for localized pages." },
  { name: "timezone", type: "string", required: "No", notes: "IANA timezone used by the browser page." },
  { name: "click_selector", type: "string", required: "No", notes: "Click an element before capture." },
  { name: "scroll_to", type: "number | bottom", required: "No", notes: "Scroll before capture to trigger lazy content." },
  { name: "block_resources", type: "string[]", required: "No", notes: "Optionally block image, stylesheet, font, media, or script resources." },
  { name: "clip", type: "object", required: "No", notes: "Capture x/y/width/height region. Not with selector/full_page." },
  { name: "omit_background", type: "boolean", required: "No", notes: "Preserve transparency where supported." },
];

export default function RenderUrlPage() {
  return (
    <DocsShell eyebrow="API reference" title="Screenshot URL" description="Capture viewport, full-page, or element screenshots and receive a hosted PNG, JPEG, or WebP URL.">
      <DocsSection title="HTTP request"><CodeBlock>{`POST https://api.ogify.online/v1/render/url
Content-Type: application/json
x-api-key: $OGIFY_KEY`}</CodeBlock></DocsSection>
      <DocsSection title="Request body"><FieldTable rows={fields} /></DocsSection>
      <DocsSection title="Example"><CodeBlock>{`curl -X POST https://api.ogify.online/v1/render/url \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url":"https://example.com",
    "full_page":true,
    "format":"webp",
    "quality":88,
    "hide_selectors":[".cookie-banner"],
    "wait_until":"networkidle0"
  }'`}</CodeBlock></DocsSection>
      <DocsSection title="Browser controls">
        <p>Use <code>selector</code> or <code>clip</code> for partial captures, <code>custom_css</code>/<code>custom_js</code> for page automation, cookies for authenticated sessions you control, <code>click_selector</code> and <code>scroll_to</code> for lazy UI, and locale/timezone controls for regional rendering.</p>
        <p><code>full_page</code> and <code>selector</code> cannot be used together.</p>
      </DocsSection>
      <DocsSection title="Security"><p>Ogify blocks direct private/local URLs and aborts browser subrequests to direct private/local hosts. Some sites may still show region-specific pages, consent dialogs, login screens, or anti-bot challenges because Ogify captures the page the browser actually receives.</p></DocsSection>
    </DocsShell>
  );
}
