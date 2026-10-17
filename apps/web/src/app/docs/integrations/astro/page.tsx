import { CodeBlock, DocsSection, DocsShell } from "../../docs-shell";

export default function AstroIntegrationPage(){return <DocsShell title="Astro / static-site integration" description="Generate a public Ogify image during a content build and write its URL into static metadata.">
<DocsSection title="Build-time request"><CodeBlock>{`const response = await fetch("https://api.ogify.online/v1/render/template", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.OGIFY_KEY,
  },
  body: JSON.stringify({ template: "blog", title: frontmatter.title }),
});
const { image_url } = await response.json();`}</CodeBlock></DocsSection>
<DocsSection title="HTML metadata"><CodeBlock>{`<meta property="og:image" content={image_url} />
<meta name="twitter:card" content="summary_large_image" />`}</CodeBlock></DocsSection>
</DocsShell>}
