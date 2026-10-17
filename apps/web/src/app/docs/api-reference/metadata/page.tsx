import { CodeBlock, DocsSection, DocsShell } from "../../docs-shell";
export default function MetadataDocs(){return <DocsShell title="Page metadata extraction" description="Extract rendered Open Graph metadata, canonical URL, site name, image, favicon, theme color, and locale.">
  <DocsSection title="Request"><CodeBlock>{`POST /v1/extract/metadata\n\n{ "url": "https://example.com/article" }`}</CodeBlock></DocsSection>
  <DocsSection title="Why rendered metadata?"><p>Ogify uses the browser, so metadata added by JavaScript can be visible after navigation rather than relying only on the initial HTML response.</p></DocsSection>
</DocsShell>}
