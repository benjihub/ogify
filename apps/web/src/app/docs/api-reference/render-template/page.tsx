import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "template", type: "string", required: "Yes", notes: "blog, product, or saas." },
  { name: "title", type: "string", required: "Yes", notes: "Main headline, trimmed server-side." },
  { name: "author", type: "string", required: "No", notes: "Author, company, or site label." },
  { name: "tag", type: "string", required: "No", notes: "Small category / eyebrow label." },
  { name: "brand", type: "string", required: "No", notes: "Brand label used in paid-plan template marks." },
  { name: "accent_color", type: "#RRGGBB", required: "No", notes: "Template accent override." },
  { name: "background_color", type: "#RRGGBB", required: "No", notes: "Template background override." },
  { name: "width", type: "integer", required: "No", notes: "200–2400. Defaults to 1200." },
  { name: "height", type: "integer", required: "No", notes: "100–1400. Defaults to 630." },
];

export default function RenderTemplatePage() {
  return (
    <DocsShell eyebrow="API reference" title="Render template" description="Render a built-in social-card template as a PNG or as an immutable public image URL.">
      <DocsSection title="Recommended request">
        <CodeBlock>{`POST https://api.ogify.online/v1/render/template
Content-Type: application/json
x-api-key: $OGIFY_KEY`}</CodeBlock>
      </DocsSection>
      <DocsSection title="Request body"><FieldTable rows={fields} /></DocsSection>
      <DocsSection title="Example">
        <CodeBlock>{`curl -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "blog",
    "title": "How we launched Ogify",
    "author": "Benjamin · ogify.online",
    "tag": "Building in public",
    "accent_color": "#C73E1D"
  }'`}</CodeBlock>
      </DocsSection>
      <DocsSection title="JSON response">
        <CodeBlock>{`{
  "id": "f4f7...",
  "image_url": "https://api.ogify.online/i/f4f7....png",
  "content_type": "image/png",
  "width": 1200,
  "height": 630,
  "cache": "MISS",
  "renders_used": 12,
  "renders_limit": 500
}`}</CodeBlock>
      </DocsSection>
      <DocsSection title="Binary compatibility endpoint">
        <p><code>POST /render/template</code> accepts the same template fields and returns <code>image/png</code> directly. Existing integrations do not need to migrate immediately.</p>
      </DocsSection>
      <DocsSection title="Errors">
        <CodeBlock>{`400  VALIDATION_ERROR
401  INVALID_API_KEY / REVOKED_API_KEY
429  RATE_LIMITED / MONTHLY_QUOTA_EXCEEDED
500  RENDER_ERROR`}</CodeBlock>
      </DocsSection>
    </DocsShell>
  );
}
