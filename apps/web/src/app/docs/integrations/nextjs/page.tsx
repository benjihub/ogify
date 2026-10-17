import { CodeBlock, DocsSection, DocsShell } from "../../docs-shell";

export default function NextjsIntegrationPage(){return <DocsShell title="Next.js integration" description="Generate an Ogify image from server-side Next.js code and place the returned public URL in metadata.">
<DocsSection title="Server-side render"><CodeBlock>{`const response = await fetch("https://api.ogify.online/v1/render/template", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.OGIFY_KEY!,
  },
  body: JSON.stringify({
    template: "blog",
    title: post.title,
    author: post.author,
  }),
});

const { image_url } = await response.json();`}</CodeBlock></DocsSection>
<DocsSection title="Metadata"><CodeBlock>{`export async function generateMetadata() {
  const image = await getOrCreateOgifyImage();
  return {
    openGraph: { images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}`}</CodeBlock><p>Prefer generating when content changes and persisting the URL instead of creating a new render for every crawler request.</p></DocsSection>
</DocsShell>}
