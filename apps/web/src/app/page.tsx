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
  { title: "URL → screenshot", body: "Viewport, full-page and element captures with PNG, JPEG or WebP output." },
  { title: "HTML → image", body: "Render raw HTML and CSS without maintaining Chromium, fonts, or screenshot infrastructure." },
  { title: "URL / HTML → PDF", body: "Generate invoices, reports, certificates and page PDFs with print backgrounds and page controls." },
  { title: "Smart social cards", body: "Give Ogify a URL and it can extract metadata, capture the page and generate a branded social image." },
  { title: "Rendered page data", body: "Extract hydrated HTML, visible text, metadata and resolved links after JavaScript executes." },
  { title: "Reusable developer templates", body: "Save HTML templates with {{variables}} and render them repeatedly through the API." },
  { title: "Batch + multi-size", body: "Generate multiple formats and social sizes from one request, including mixed render batches." },
  { title: "Async jobs + webhooks", body: "Queue heavier render work and receive signed completion webhooks instead of holding requests open." },
  { title: "Hosted render assets", body: "Get public CDN-style URLs for generated images and PDFs, plus HMAC-signed on-demand render links." },
  { title: "Advanced browser controls", body: "Cookies, custom CSS/JS, click/scroll automation, locale/timezone, dark mode, headers, clipping and resource controls." },
  { title: "Official SDK + CLI", body: "Use the TypeScript SDK or command-line client instead of hand-writing every HTTP request." },
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
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <div className="eyebrow mb-4">Render API for developers</div>
              <h1 className="max-w-[760px] text-[clamp(2.55rem,5.3vw,4.3rem)] leading-[1.02] tracking-[-0.045em] text-paper">Render websites and HTML into <span className="text-cinnabar">images, PDFs & social cards</span>.</h1>
              <p className="mt-5 max-w-[560px] text-base leading-7 text-muted sm:text-[17px]">One API for screenshots, HTML-to-image, PDFs, reusable templates, social cards, batch jobs and hosted render assets — without operating your own browser fleet.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Button asChild href="/signup">Get started free</Button><Button asChild href="/docs" variant="ghost">Read the docs</Button></div>
              <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-medium text-muted"><span className="rounded-full border border-line-dim bg-ink-soft/80 px-3 py-1.5">100 free renders / month</span><span className="rounded-full border border-line-dim bg-ink-soft/80 px-3 py-1.5">SDK + CLI</span><span className="rounded-full border border-line-dim bg-ink-soft/80 px-3 py-1.5">Hosted asset URLs</span></div>
            </div>
            <HeroCard />
          </div>

          <PaperCard className="mt-12 max-w-[760px] !p-0 sm:mt-14">
            <div className="flex justify-between border-b border-line-dim px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted sm:px-5"><span>request</span><span>v1 / render / social</span></div>
            <pre className="code-card rounded-b">{`curl -X POST https://api.ogify.online/v1/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"blog","title":"My Post"}'

# → { "image_url": "https://api.ogify.online/i/...png" }`}</pre>
          </PaperCard>
        </section>

        <section className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHead eyebrow="How it works" title="Send data. Get a render URL." />
          <div className="grid gap-4 md:grid-cols-3">{[
            {num:"01",title:"Create an API key",body:"Keep it server-side and rotate it from the dashboard whenever needed."},
            {num:"02",title:"Render URL, HTML, PDF or template",body:"Use one API for screenshots, HTML images, PDFs, smart social cards and reusable templates."},
            {num:"03",title:"Use the hosted result URL",body:"Use it in your app, metadata, CMS, email, automation pipeline, CI/CD or webhook workflow."},
          ].map(step=><div key={step.num} className="rounded-xl border border-line-dim bg-ink-soft/40 p-5 sm:p-6"><span className="mb-3.5 block font-mono text-xs font-semibold text-cinnabar">{step.num}</span><h3 className="font-body text-[18px] font-semibold text-paper">{step.title}</h3><p className="mt-2.5 text-[14.5px] text-muted">{step.body}</p></div>)}</div>
        </div></section>

        <section id="demo" className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHead eyebrow="Try it live" title="Type a title. Render it on the real API." body="The public demo endpoint is rate-limited and uses the same Worker-safe font/rendering stack as authenticated requests." /><TemplatePlayground /></div></section>

        <section id="features" className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHead eyebrow="Production features" title="A rendering pipeline you do not have to maintain." /><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{FEATURES.map(f=><div key={f.title} className="rounded-xl border border-line-dim bg-ink-soft/55 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-ink-soft sm:p-6"><h3 className="flex items-center gap-2.5 font-body text-[15.5px] font-semibold text-paper"><span className="h-1.5 w-1.5 shrink-0 bg-cinnabar" />{f.title}</h3><p className="mt-2.5 text-sm text-muted">{f.body}</p></div>)}</div></div></section>

        <section className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHead eyebrow="Who it is for" title="Built for teams that publish links." /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">{AUDIENCE.map(a=><div key={a.title} className="rounded-xl border border-line-dim bg-ink-soft/45 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line sm:p-6"><div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-gold">{a.tag}</div><h3 className="mt-2.5 font-body text-[15px] font-semibold text-paper">{a.title}</h3><p className="mt-2 text-[13px] text-muted">{a.body}</p></div>)}</div></div></section>

        <section className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHead eyebrow="Examples" title="Three workflows you can ship today." /><div className="grid gap-6 md:grid-cols-3">{USE_CASES.map(item=><PaperCard key={item.title}><h3 className="font-body text-[16px] font-semibold text-paper">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{item.body}</p></PaperCard>)}</div><div className="mt-8"><Link href="/examples" className="font-mono text-xs uppercase tracking-wide text-cinnabar hover:underline">Browse examples →</Link></div></div></section>

        <section id="faq" className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHead eyebrow="FAQ" title="Questions, answered." /><FaqAccordion /></div></section>

        <section className="border-t border-line-dim py-16 sm:py-20 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-cinnabar/40 bg-gradient-to-br from-cinnabar to-cinnabar-dark p-6 text-white shadow-[0_18px_55px_rgba(199,62,29,0.18)] sm:p-9"><div><h3 className="text-[22px]">Start free, then scale when your traffic does.</h3><p className="mt-2 font-mono text-[13px] text-paper/85">100 renders/month on Free. Paid plans increase quota and remove Ogify template branding.</p></div><Button asChild href="/pricing" variant="paper">View pricing</Button></div></div></section>
      </main>
      <Footer />
    </>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) { return <div className="mb-10 max-w-[720px] sm:mb-12"><div className="eyebrow mb-3.5">{eyebrow}</div><h2 className="text-[clamp(1.8rem,3.3vw,2.5rem)] leading-[1.1] tracking-[-0.035em] text-paper">{title}</h2>{body&&<p className="mt-4 max-w-[600px] text-base leading-7 text-muted">{body}</p>}</div>; }
function HeroCard(){return <div className="hero-preview flex items-center justify-center"><div className="relative aspect-[1200/630] w-full overflow-hidden rounded-2xl border border-line-dim bg-ink shadow-[0_28px_90px_-35px_rgba(0,0,0,0.65)]"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:'url("/landing-previews/hero-card.png")'}} /><div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/10 via-transparent to-white/5" /></div></div>;}
