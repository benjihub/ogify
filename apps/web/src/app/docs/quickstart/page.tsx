import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";

export default function QuickstartPage() {
  return (
    <DocsShell
      title="Quickstart"
      description="Get a rendered image back from the API in under five minutes."
    >
      <DocsSection title="1. Get your API key">
        <p>Create a free account and copy your key from the dashboard.</p>
      </DocsSection>

      <DocsSection title="2. Call the render endpoint">
        <CodeBlock>{`curl -X POST https://api.ogify.online/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"blog","title":"My Post"}' \\
  --output social.png`}</CodeBlock>
      </DocsSection>

      <DocsSection title="3. Add it to your meta tags">
        <CodeBlock>{`<meta property="og:image" content="https://api.ogify.online/render/template?...">
<meta name="twitter:card" content="summary_large_image">`}</CodeBlock>
      </DocsSection>
    </DocsShell>
  );
}
