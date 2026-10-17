import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";
import { TemplatePlayground } from "@/components/TemplatePlayground";

const templates = [
  { name: "blog", description: "Editorial cards for posts, essays, changelogs and tutorials.", schema: `{ "template":"blog", "title":"string", "author":"string?", "tag":"string?", "brand":"string?", "accent_color":"#RRGGBB?" }`, imageSrc: "/template-previews/blog.png" },
  { name: "product", description: "Product announcements, landing pages and feature launches.", schema: `{ "template":"product", "title":"string", "author":"string?", "tag":"string?", "brand":"string?", "background_color":"#RRGGBB?" }`, imageSrc: "/template-previews/product.png" },
  { name: "saas", description: "SaaS-style cards for features, dashboards and metrics.", schema: `{ "template":"saas", "title":"string", "author":"string?", "tag":"string?", "brand":"string?" }`, imageSrc: "/template-previews/saas.png" },
] as const;

export default function TemplatesPage() {
  return <DocsShell title="Template gallery" description="Use built-in social-card templates or create reusable HTML templates with variables for developer-controlled designs.">
    <DocsSection title="Built-in templates"><div className="flex flex-col gap-5">{templates.map((template)=><div key={template.name} className="rounded border border-line-dim bg-ink-soft p-5"><div className="relative aspect-[1200/630] w-full overflow-hidden rounded border border-line-dim bg-ink"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url("${template.imageSrc}")`}} /></div><div className="mt-5 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]"><div><h2 className="font-body text-[17px] font-semibold text-paper">{template.name}</h2><p className="mt-2 text-sm text-muted">{template.description}</p></div><CodeBlock>{template.schema}</CodeBlock></div></div>)}</div></DocsSection>

    <DocsSection title="Reusable HTML templates"><p>Create a template once, then render it with different data without resending the full HTML on every request.</p><CodeBlock>{`POST /v1/templates

{
  "name": "Release card",
  "html": "<main><h1>{{title}}</h1><p>{{version}}</p></main>",
  "css": "main{width:1200px;height:630px;background:#111;color:white}",
  "width": 1200,
  "height": 630
}

POST /v1/templates/tpl_123/render

{ "data": { "title": "Ogify 2.0", "version": "v2.0.0" } }`}</CodeBlock><p>Template variables are HTML escaped before rendering. Use these templates for release cards, product images, certificates, invoices, dashboards, and any design you can express in HTML/CSS.</p></DocsSection>
    <DocsSection title="Live production-safe demo"><TemplatePlayground /></DocsSection>
  </DocsShell>;
}
