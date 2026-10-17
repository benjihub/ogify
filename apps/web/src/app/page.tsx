import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { TemplatePlayground } from "@/components/TemplatePlayground";
import { Button } from "@/components/ui/button";
import { PaperCard } from "@/components/ui/card";
import { FaqAccordion } from "./faq-accordion";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};


const FEATURES = [
  { title: "Template rendering", body: "Generate polished Blog, Product, and SaaS cards from structured JSON." },
  { title: "Website screenshots", body: "Capture public webpages with Cloudflare Browser Rendering using controlled viewport and wait settings." },
  { title: "Composite social cards", body: "Combine a live website screenshot with a branded headline card in one request." },
  { title: "Public image URLs", body: "Versioned render endpoints return immutable PNG URLs ready for og:image and social crawlers." },
  { title: "Edge caching", body: "Deterministic templates and short-lived screenshot caches reduce latency and unnecessary browser work." },
  { title: "Brand controls", body: "Override safe accent/background colors and brand labels without maintaining your own SVG pipeline." },
  { title: "API key management", body: "Generate, revoke, and monitor keys from the dashboard. Raw keys are shown only once." },
  { title: "Usage & billing", body: "Track monthly render usage, rate-limit headers, and paid-plan entitlements from one dashboard." },
];

const AUDIENCE = [
  { tag: "Publishers", title: "Blogs & docs", body: "Create unique share images during publishing or CI/CD." },
  { tag: "Builders", title: "SaaS & indie hackers", body: "Turn product updates and landing pages into launch-ready social cards." },
  { tag: "Static sites", title: "Astro, Hugo, Jekyll", body: "Generate once on deploy and place the returned public URL in metadata." },
  { tag: "Teams", title: "Agencies & marketing", body: "Automate branded assets across multiple pages and client launches." },
];

const USE_CASES = [
  { title: "Dynamic article cards", body: "Render a branded 1200×630 image from title, author, tag, and brand colors." },
  { title: "Website preview cards", body: "Capture a live product page and wrap the screenshot inside a clean social-card composition." },
  { title: "Deployment automation", body: "Generate public image URLs in CI and write them into Open Graph and Twitter metadata." },
];

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-7 pb-[70px] pt-[84px]">
          <div className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-3.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold"><span className="h-px w-[18px] bg-gold" />Open Graph rendering API</div>
              <h1 className="text-[52px] leading-[1.06] text-paper">Turn content and URLs into <span className="text-cinnabar">share-ready images</span>.</h1>
              <p className="mt-5 max-w-[520px] text-[17px] leading-7 text-muted">Generate social cards, website screenshots, and branded screenshot composites without running your own browser or image-rendering infrastructure.</p>
              <div className="mt-8 flex flex-wrap gap-3.5"><Link href="/signup"><Button variant="primary">Get started free</Button></Link><Link href="/docs"><Button variant="ghost">Read the docs</Button></Link></div>
              <div className="mt-9 font-mono text-[12.5px] tracking-wide text-line">100 FREE RENDERS / MONTH · PUBLIC OG IMAGE URLS · NO CREDIT CARD TO START</div>
            </div>
            <HeroCard />
          </div>

          <PaperCard className="mt-[60px] max-w-[720px] !p-0">
            <div className="flex justify-between border-b border-dashed border-ink px-5.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-55"><span>request</span><span>v1 / render / template</span></div>
            <pre className="code-card rounded-b">{`curl -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"blog","title":"My Post"}'

# → { "image_url": "https://api.ogify.online/i/...png" }`}</pre>
          </PaperCard>
        </section>

        <section className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><SectionHead eyebrow="How it works" title="Generate once. Share everywhere." />
          <div className="grid gap-7 md:grid-cols-3">{[
            {num:"01",title:"Create an API key",body:"Keep it server-side and rotate it from the dashboard whenever needed."},
            {num:"02",title:"Render a template, URL, or composite",body:"Send structured JSON and let Ogify handle browser and image rendering."},
            {num:"03",title:"Use the returned public PNG URL",body:"Place it directly in og:image, Twitter cards, Slack, Discord, or your CMS."},
          ].map(step=><div key={step.num} className="border-l border-line-dim pl-[22px]"><span className="mb-3.5 block font-mono text-[13px] text-cinnabar">{step.num}</span><h3 className="font-body text-[18px] font-semibold text-paper">{step.title}</h3><p className="mt-2.5 text-[14.5px] text-muted">{step.body}</p></div>)}</div>
        </div></section>

        <section id="demo" className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><SectionHead eyebrow="Try it live" title="Type a title. Render it on the real API." body="The public demo endpoint is rate-limited and uses the same Worker-safe font/rendering stack as authenticated requests." /><TemplatePlayground /></div></section>

        <section id="features" className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><SectionHead eyebrow="Production features" title="A rendering pipeline you do not have to maintain." /><div className="grid grid-cols-1 gap-px border border-line-dim bg-line-dim md:grid-cols-2">{FEATURES.map(f=><div key={f.title} className="bg-ink p-7"><h3 className="flex items-center gap-2.5 font-body text-[15.5px] font-semibold text-paper"><span className="h-1.5 w-1.5 shrink-0 bg-cinnabar" />{f.title}</h3><p className="mt-2.5 text-sm text-muted">{f.body}</p></div>)}</div></div></section>

        <section className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><SectionHead eyebrow="Who it is for" title="Built for teams that publish links." /><div className="grid grid-cols-2 gap-6 md:grid-cols-4">{AUDIENCE.map(a=><div key={a.title} className="rounded border border-line-dim p-6"><div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-gold">{a.tag}</div><h3 className="mt-2.5 font-body text-[15px] font-semibold text-paper">{a.title}</h3><p className="mt-2 text-[13px] text-muted">{a.body}</p></div>)}</div></div></section>

        <section className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><SectionHead eyebrow="Examples" title="Three workflows you can ship today." /><div className="grid gap-6 md:grid-cols-3">{USE_CASES.map(item=><PaperCard key={item.title}><h3 className="font-body text-[16px] font-semibold text-paper">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{item.body}</p></PaperCard>)}</div><div className="mt-8"><Link href="/examples" className="font-mono text-xs uppercase tracking-wide text-cinnabar hover:underline">Browse examples →</Link></div></div></section>

        <section id="faq" className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><SectionHead eyebrow="FAQ" title="Questions, answered." /><FaqAccordion /></div></section>

        <section className="border-t border-line-dim py-24"><div className="mx-auto max-w-6xl px-7"><div className="flex flex-wrap items-center justify-between gap-6 rounded bg-cinnabar p-9 text-paper"><div><h3 className="text-[22px]">Start free, then scale when your traffic does.</h3><p className="mt-2 font-mono text-[13px] text-paper/85">100 renders/month on Free. Paid plans increase quota and remove Ogify template branding.</p></div><Link href="/pricing"><Button variant="paper">View pricing</Button></Link></div></div></section>
      </main>
      <Footer />
    </>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) { return <div className="mb-14 max-w-[650px]"><div className="mb-3.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold"><span className="h-px w-[18px] bg-gold" />{eyebrow}</div><h2 className="text-[34px] leading-tight text-paper">{title}</h2>{body&&<p className="mt-3.5 max-w-[560px] text-base text-muted">{body}</p>}</div>; }
function HeroCard(){return <div className="flex items-center justify-center"><div className="relative aspect-[1200/630] w-full overflow-hidden rounded border border-line-dim bg-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:'url("/landing-previews/hero-card.png")'}} /></div></div>;}
