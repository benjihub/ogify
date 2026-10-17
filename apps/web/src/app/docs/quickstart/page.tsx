import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";

export default function QuickstartPage() {
  return (
    <DocsShell
      title="Quickstart"
      description="Create an API key and render your first screenshot, social card, HTML image, or PDF in minutes."
    >
      <DocsSection title="1. Create an API key">
        <p>Sign in to the dashboard and generate an API key. Keep it on your server or in CI — never expose it in browser JavaScript.</p>
        <CodeBlock>{`export OGIFY_KEY="ogfy_live_..."`}</CodeBlock>
      </DocsSection>

      <DocsSection title="2. Turn one URL into a social card">
        <CodeBlock>{`curl -X POST https://api.ogify.online/v1/render/social \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/blog/launch"}'`}</CodeBlock>
        <p>Ogify extracts metadata, captures the page, builds a branded card, stores it, and returns a hosted URL.</p>
      </DocsSection>

      <DocsSection title="3. Or use the SDK">
        <CodeBlock>{`npm install @ogify/sdk

import { Ogify } from "@ogify/sdk";
const ogify = new Ogify({ apiKey: process.env.OGIFY_API_KEY! });

const image = await ogify.render.screenshot({
  url: "https://example.com",
  full_page: true,
  format: "webp"
});

console.log(image.url);`}</CodeBlock>
      </DocsSection>

      <DocsSection title="4. Other high-value endpoints">
        <p><code>/v1/render/html</code> renders HTML/CSS to images, <code>/v1/render/pdf</code> generates PDFs, <code>/v1/render/batch</code> groups work, and <code>/v1/jobs</code> moves heavier renders to asynchronous jobs with webhooks.</p>
      </DocsSection>
    </DocsShell>
  );
}
