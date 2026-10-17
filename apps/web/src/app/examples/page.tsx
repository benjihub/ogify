import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { PaperCard } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Examples",
  description: "Practical Ogify API examples for templates, website screenshots, composite social cards, and Open Graph metadata.",
};

const EXAMPLES = [
  {
    title: "Article card",
    endpoint: "POST /v1/render/template",
    body: "Generate an editorial social card from a title, author, tag, and brand colors.",
    code: `curl -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"blog","title":"Launch notes","author":"You · site.com"}'`,
  },
  {
    title: "Website screenshot",
    endpoint: "POST /v1/render/url",
    body: "Capture a public page and receive an immutable image URL.",
    code: `curl -X POST https://api.ogify.online/v1/render/url \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","viewport_width":1200,"viewport_height":630}'`,
  },
  {
    title: "Screenshot + branded card",
    endpoint: "POST /v1/render/composite",
    body: "Turn a live landing page into a polished share card with one call.",
    code: `curl -X POST https://api.ogify.online/v1/render/composite \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","title":"We just shipped","brand":"Acme"}'`,
  },
];

export default function ExamplesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">Examples</div>
          <h1 className="text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.045em] text-paper">
            Build with Ogify
          </h1>
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
            Copy a working request, swap in your own content, and start generating share-ready assets from your application.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:mt-12">
          {EXAMPLES.map((example) => (
            <PaperCard key={example.title} className="p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-paper">{example.title}</h2>
                <span className="w-fit rounded-lg border border-line-dim bg-ink px-2.5 py-1.5 font-mono text-[11px] text-cinnabar">{example.endpoint}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{example.body}</p>
              <pre className="code-card mt-5 overflow-x-auto text-[12px]">{example.code}</pre>
            </PaperCard>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/docs/quickstart" className="text-sm font-semibold text-cinnabar hover:underline">Continue to quickstart →</Link>
          <Link href="/pricing" className="text-sm font-semibold text-muted hover:text-paper">Explore pricing</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
