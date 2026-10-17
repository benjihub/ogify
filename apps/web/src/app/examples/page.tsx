import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { PaperCard } from "@/components/ui/card";

export const metadata: Metadata = { title: "Examples", description: "Practical Ogify API examples for templates, website screenshots, composite social cards, and Open Graph metadata." };

const EXAMPLES = [
  { title: "Article card", endpoint: "/v1/render/template", body: "Generate an editorial social card from a title, author, tag, and brand colors.", code: `curl -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"blog","title":"Launch notes","author":"You · site.com"}'` },
  { title: "Website screenshot", endpoint: "/v1/render/url", body: "Capture a public page and receive an immutable image URL.", code: `curl -X POST https://api.ogify.online/v1/render/url \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","viewport_width":1200,"viewport_height":630}'` },
  { title: "Screenshot + branded card", endpoint: "/v1/render/composite", body: "Turn a live landing page into a polished share card with one call.", code: `curl -X POST https://api.ogify.online/v1/render/composite \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","title":"We just shipped","brand":"Acme"}'` },
];

export default function ExamplesPage() {
  return <><Header /><main className="mx-auto max-w-6xl px-7 py-20"><div className="max-w-3xl"><div className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Examples</div><h1 className="mt-3 text-4xl text-paper">Build with Ogify</h1><p className="mt-4 text-base leading-7 text-muted">These examples use the versioned endpoints that return stable public image URLs for social metadata.</p></div><div className="mt-12 grid gap-6">{EXAMPLES.map(ex=><PaperCard key={ex.title}><div className="font-mono text-[10px] uppercase tracking-wider text-cinnabar">{ex.endpoint}</div><h2 className="mt-2 text-xl text-paper">{ex.title}</h2><p className="mt-2 text-sm text-muted">{ex.body}</p><pre className="code-card mt-5 overflow-x-auto text-[12px]">{ex.code}</pre></PaperCard>)}</div><div className="mt-10"><Link href="/docs/quickstart" className="font-mono text-xs uppercase tracking-wide text-cinnabar hover:underline">Continue to quickstart →</Link></div></main><Footer /></>;
}
