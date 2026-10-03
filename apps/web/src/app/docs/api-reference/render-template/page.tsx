import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "template", type: "string", required: "Yes", notes: "One of blog, product, saas." },
  { name: "title", type: "string", required: "Yes", notes: "Main headline rendered on the image." },
  { name: "subtitle", type: "string", required: "No", notes: "Supporting text under the title." },
  { name: "brand", type: "string", required: "No", notes: "Brand label shown on supported templates." },
  { name: "imageUrl", type: "string", required: "No", notes: "Remote image used by templates that support artwork." },
];

export default function RenderTemplatePage() {
  return (
    <DocsShell
      eyebrow="API reference"
      title="/render/template"
      description="Generate a PNG from one of Ogify's built-in templates."
    >
      <DocsSection title="HTTP request">
        <CodeBlock>{`POST https://api.ogify.online/render/template
Content-Type: application/json
x-api-key: $OGIFY_KEY`}</CodeBlock>
      </DocsSection>

      <DocsSection title="Request body schema">
        <FieldTable rows={fields} />
      </DocsSection>

      <DocsSection title="Example request">
        <CodeBlock>{`curl -X POST https://api.ogify.online/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "blog",
    "title": "How we launched Ogify",
    "subtitle": "A tiny API for social cards",
    "brand": "Ogify"
  }' \\
  --output og.png`}</CodeBlock>
      </DocsSection>

      <DocsSection title="Example response">
        <CodeBlock>{`HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: public, max-age=31536000, immutable
ETag: "ogify-template-abc123"

<PNG binary>`}</CodeBlock>
      </DocsSection>

      <DocsSection title="Error responses">
        <CodeBlock>{`401 Unauthorized
{ "error": "Missing or invalid API key" }

403 Forbidden
{ "error": "Template not available on your plan" }

429 Too Many Requests
{ "error": "Rate limit exceeded" }`}</CodeBlock>
      </DocsSection>
    </DocsShell>
  );
}
