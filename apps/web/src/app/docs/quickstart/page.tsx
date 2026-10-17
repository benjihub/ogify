import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";

export default function QuickstartPage() {
  return (
    <DocsShell
      title="Quickstart"
      description="Create an API key, render an image, and get a stable public image URL you can place directly in your Open Graph metadata."
    >
      <DocsSection title="1. Create an API key">
        <p>Sign in to your dashboard and generate an API key. The raw key is shown once, so store it in a server-side environment variable.</p>
        <CodeBlock>{`export OGIFY_KEY="ogfy_live_..."`}</CodeBlock>
      </DocsSection>

      <DocsSection title="2. Render a public social image">
        <CodeBlock>{`curl -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template":"blog",
    "title":"My Post",
    "author":"Your Name · yoursite.com",
    "tag":"Launch"
  }'`}</CodeBlock>
        <p>The versioned endpoint returns JSON containing an immutable public <code>image_url</code>. The legacy <code>/render/template</code> endpoint still returns the PNG binary directly.</p>
      </DocsSection>

      <DocsSection title="3. Add the returned URL to your page">
        <CodeBlock>{`<meta property="og:image" content="https://api.ogify.online/i/IMAGE_ID.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://api.ogify.online/i/IMAGE_ID.png">`}</CodeBlock>
      </DocsSection>

      <DocsSection title="4. Try website capture or composite mode">
        <p>Use <code>/v1/render/url</code> for a direct screenshot, or <code>/v1/render/composite</code> to place a live website capture inside an Ogify social-card layout.</p>
      </DocsSection>
    </DocsShell>
  );
}
