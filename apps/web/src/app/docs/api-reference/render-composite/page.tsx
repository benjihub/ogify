import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

const fields = [
  { name: "url", type: "string", required: "Yes", notes: "Website to capture." },
  { name: "title", type: "string", required: "Yes", notes: "Headline shown beside the screenshot." },
  { name: "author", type: "string", required: "No", notes: "Supporting author / site text." },
  { name: "tag", type: "string", required: "No", notes: "Eyebrow label." },
  { name: "brand", type: "string", required: "No", notes: "Brand mark on paid plans." },
  { name: "accent_color", type: "#RRGGBB", required: "No", notes: "Accent override." },
  { name: "background_color", type: "#RRGGBB", required: "No", notes: "Background override." },
  { name: "width / height", type: "integer", required: "No", notes: "Final card size. Defaults to 1200 × 630." },
  { name: "viewport_width / viewport_height", type: "integer", required: "No", notes: "Browser capture viewport." },
];

export default function RenderCompositePage() {
  return (
    <DocsShell eyebrow="API reference" title="Render composite" description="Capture a live website and place it inside a branded Ogify social-card layout in one API request.">
      <DocsSection title="Request"><CodeBlock>{`POST https://api.ogify.online/v1/render/composite
Content-Type: application/json
x-api-key: $OGIFY_KEY`}</CodeBlock></DocsSection>
      <DocsSection title="Request body"><FieldTable rows={fields} /></DocsSection>
      <DocsSection title="Example"><CodeBlock>{`curl -X POST https://api.ogify.online/v1/render/composite \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url":"https://ogify.online",
    "title":"Beautiful social images in one API call",
    "tag":"Website preview",
    "brand":"Ogify"
  }'`}</CodeBlock></DocsSection>
      <DocsSection title="Use cases"><ul className="list-disc space-y-2 pl-5"><li>Product launch cards with a live landing-page capture.</li><li>Changelog cards with a screenshot of the shipped feature.</li><li>Agency/social assets generated automatically from client URLs.</li></ul></DocsSection>
    </DocsShell>
  );
}
