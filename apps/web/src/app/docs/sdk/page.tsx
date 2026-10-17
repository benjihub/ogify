import { CodeBlock, DocsSection, DocsShell } from "../docs-shell";
export default function SdkDocs(){return <DocsShell title="JavaScript SDK & CLI" description="Use Ogify from Node.js, TypeScript, server runtimes, or the terminal.">
  <DocsSection title="SDK"><CodeBlock>{`npm install @ogify/sdk

import { Ogify } from "@ogify/sdk";

const ogify = new Ogify({ apiKey: process.env.OGIFY_API_KEY! });
const image = await ogify.render.screenshot({
  url: "https://example.com",
  full_page: true,
  format: "webp",
  locale: "en-US",
  timezone: "Africa/Kampala"
});

const content = await ogify.content({
  url: "https://example.com/docs",
  selector: "main",
  include_links: true
});

console.log(image.url, content.content);`}</CodeBlock><p>The SDK also exposes HTML-to-image, PDF, smart social cards, composites, multi-size rendering, batches, metadata, reusable templates, async jobs, and signed render links.</p></DocsSection>
  <DocsSection title="CLI"><CodeBlock>{`export OGIFY_API_KEY=ogfy_live_...
ogify screenshot https://example.com --format webp --full-page true
ogify social https://example.com
ogify html ./card.html --format png
ogify pdf https://example.com/report --format A4
ogify metadata https://example.com/article
ogify content https://example.com/docs --selector main --links true
ogify usage`}</CodeBlock></DocsSection>
</DocsShell>}
