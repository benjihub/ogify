import { CodeBlock, DocsSection, DocsShell } from "../../docs-shell";
export default function SocialDocs(){return <DocsShell title="Smart social card" description="Give Ogify a URL. It extracts page metadata, captures the page, and builds a branded social image.">
  <DocsSection title="One-request workflow"><CodeBlock>{`POST /v1/render/social\n\n{\n  "url": "https://example.com/blog/launch",\n  "accent_color": "#6D5EF7",\n  "width": 1200,\n  "height": 630\n}`}</CodeBlock><p>You can override <code>title</code>, <code>tag</code>, <code>author</code>, and <code>brand</code>. When omitted, Ogify uses Open Graph metadata and the resolved page URL.</p></DocsSection>
</DocsShell>}
