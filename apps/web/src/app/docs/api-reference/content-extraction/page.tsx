import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "url", type: "string", required: "Yes", notes: "Public http/https URL." },
  { name: "selector", type: "string", required: "No", notes: "Scope extraction to one element." },
  { name: "include_links", type: "boolean", required: "No", notes: "Return up to 200 resolved links." },
  { name: "wait_for_selector", type: "string", required: "No", notes: "Wait for dynamic content before extraction." },
  { name: "cookies", type: "array", required: "No", notes: "Set up to 50 browser cookies before navigation." },
  { name: "locale", type: "string", required: "No", notes: "Set Accept-Language, for example en-US." },
  { name: "timezone", type: "string", required: "No", notes: "IANA timezone such as America/New_York." },
  { name: "click_selector", type: "string", required: "No", notes: "Click an element before extraction." },
  { name: "scroll_to", type: "number | bottom", required: "No", notes: "Scroll before reading hydrated content." },
];

export default function ContentExtractionDocs() {
  return <DocsShell eyebrow="API reference" title="Rendered content extraction" description="Extract hydrated HTML, visible text, and resolved links after JavaScript has executed in the browser.">
    <DocsSection title="Request"><CodeBlock>{`POST /v1/extract/content

{
  "url": "https://example.com/docs",
  "selector": "main",
  "include_links": true,
  "wait_until": "domcontentloaded"
}`}</CodeBlock></DocsSection>
    <DocsSection title="Fields"><FieldTable rows={fields} /></DocsSection>
    <DocsSection title="Response"><CodeBlock>{`{
  "content": {
    "url": "https://example.com/docs",
    "title": "Docs",
    "text": "Rendered visible text...",
    "html": "<article>...</article>",
    "links": [{"text":"API", "url":"https://example.com/api"}]
  }
}`}</CodeBlock></DocsSection>
  </DocsShell>;
}
