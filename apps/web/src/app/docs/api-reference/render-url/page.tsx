import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "url", type: "string", required: "Yes", notes: "Public URL to screenshot." },
  { name: "viewport", type: "string", required: "No", notes: "Use og, desktop, mobile, or a custom preset if enabled." },
  { name: "waitUntil", type: "string", required: "No", notes: "load, domcontentloaded, or networkidle." },
];

export default function RenderUrlPage() {
  return (
    <DocsShell
      eyebrow="API reference"
      title="/render/url"
      description="Render a screenshot of a public URL using Ogify's browser rendering pipeline."
    >
      <DocsSection title="HTTP request">
        <CodeBlock>{`GET https://api.ogify.online/render/url?url=https://example.com&viewport=og
x-api-key: $OGIFY_KEY`}</CodeBlock>
      </DocsSection>

      <DocsSection title="Query parameters">
        <FieldTable rows={fields} />
      </DocsSection>

      <DocsSection title="Caching behavior">
        <p>Successful screenshots are cached at the edge. Identical URL and viewport requests may return the cached PNG.</p>
        <p>Use stable page URLs and pre-render important marketing pages during deploys to avoid cold screenshots on first share.</p>
      </DocsSection>

      <DocsSection title="Example">
        <CodeBlock>{`curl "https://api.ogify.online/render/url?url=https://example.com&viewport=og" \\
  -H "x-api-key: $OGIFY_KEY" \\
  --output screenshot.png`}</CodeBlock>
      </DocsSection>
    </DocsShell>
  );
}
