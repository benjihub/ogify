import { CodeBlock, DocsSection, DocsShell } from "../../docs-shell";
export default function PdfDocs(){return <DocsShell title="URL / HTML to PDF" description="Generate hosted PDFs from a public URL or raw HTML.">
  <DocsSection title="URL to PDF"><CodeBlock>{`POST /v1/render/pdf\n\n{\n  "url": "https://example.com/invoice",\n  "format": "A4",\n  "print_background": true\n}`}</CodeBlock></DocsSection>
  <DocsSection title="HTML to PDF"><CodeBlock>{`{\n  "html": "<h1>Invoice #1004</h1>",\n  "css": "body{font-family:Inter,sans-serif}",\n  "format": "Letter",\n  "landscape": false\n}`}</CodeBlock><p>Provide exactly one of <code>url</code> or <code>html</code>. The response contains a hosted <code>application/pdf</code> URL.</p></DocsSection>
</DocsShell>}
