import { CodeBlock, DocsSection, DocsShell, FieldTable } from "../../docs-shell";

export default function RenderHtmlDocs() {
  return <DocsShell title="HTML to image" description="Render arbitrary HTML and CSS into hosted PNG, JPEG, or WebP assets using Ogify's browser infrastructure.">
    <DocsSection title="Request"><CodeBlock>{`POST /v1/render/html\n\n{\n  "html": "<div class='card'>Hello</div>",\n  "css": ".card{font:700 64px sans-serif}",\n  "width": 1200,\n  "height": 630,\n  "format": "webp"\n}`}</CodeBlock></DocsSection>
    <DocsSection title="Fields"><FieldTable rows={[
      {name:"html",type:"string",required:"yes",notes:"HTML document or fragment, up to 500 KB."},
      {name:"css",type:"string",required:"no",notes:"Additional stylesheet, up to 100 KB."},
      {name:"width / height",type:"integer",required:"no",notes:"Viewport/output size."},
      {name:"format",type:"png | jpeg | webp",required:"no",notes:"Defaults to png."},
      {name:"selector",type:"string",required:"no",notes:"Capture only the matching element."},
      {name:"full_page",type:"boolean",required:"no",notes:"Capture complete document height."},
    ]}/></DocsSection>
  </DocsShell>;
}
