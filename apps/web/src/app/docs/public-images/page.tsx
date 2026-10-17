import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";

export default function PublicImagesPage() {
  return (
    <DocsShell title="Public image URLs" description="Versioned /v1 render endpoints return immutable image URLs designed for og:image, Twitter cards, Slack, Discord, and other crawlers.">
      <DocsSection title="Why this matters"><p>Social crawlers cannot send your private API key when they fetch an <code>og:image</code>. Generate once on your server or CI pipeline, then place the returned public URL in your metadata.</p></DocsSection>
      <DocsSection title="Example flow"><CodeBlock>{`POST /v1/render/template
        ↓
{ "image_url": "https://api.ogify.online/i/abc123.png" }
        ↓
<meta property="og:image" content="https://api.ogify.online/i/abc123.png">`}</CodeBlock></DocsSection>
      <DocsSection title="Caching"><p>Public generated images are served with a one-year immutable cache header. Generate a new image whenever content changes; the new render gets a new content-derived ID.</p></DocsSection>
    </DocsShell>
  );
}
