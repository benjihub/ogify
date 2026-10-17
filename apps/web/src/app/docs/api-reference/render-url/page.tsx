import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "url", type: "string", required: "Yes", notes: "Public http/https URL. Private/local hosts are blocked." },
  { name: "viewport_width", type: "integer", required: "No", notes: "320–2400. Defaults to 1200." },
  { name: "viewport_height", type: "integer", required: "No", notes: "240–1800. Defaults to 630." },
  { name: "delay", type: "integer", required: "No", notes: "0–5000 milliseconds after navigation." },
  { name: "wait_until", type: "string", required: "No", notes: "load, domcontentloaded, or networkidle0." },
];

export default function RenderUrlPage() {
  return (
    <DocsShell eyebrow="API reference" title="Render URL" description="Capture a public webpage with Cloudflare Browser Rendering and receive a stable public PNG URL.">
      <DocsSection title="HTTP request"><CodeBlock>{`POST https://api.ogify.online/v1/render/url
Content-Type: application/json
x-api-key: $OGIFY_KEY`}</CodeBlock></DocsSection>
      <DocsSection title="Request body"><FieldTable rows={fields} /></DocsSection>
      <DocsSection title="Example"><CodeBlock>{`curl -X POST https://api.ogify.online/v1/render/url \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url":"https://example.com",
    "viewport_width":1200,
    "viewport_height":630,
    "delay":500,
    "wait_until":"networkidle0"
  }'`}</CodeBlock></DocsSection>
      <DocsSection title="Caching and website behavior">
        <p>Identical screenshot requests are cached briefly to reduce browser startup cost. A versioned render response is then persisted as an immutable public image URL.</p>
        <p>Some websites may show cookie consent, region-specific content, login screens, or anti-bot challenges. Ogify captures what the remote browser is actually served.</p>
      </DocsSection>
      <DocsSection title="Security"><p>Ogify rejects direct requests to localhost, RFC1918/private IP ranges, link-local addresses, and common internal hostnames. Browser subrequests and redirects to direct private/local hosts are also blocked.</p></DocsSection>
    </DocsShell>
  );
}
