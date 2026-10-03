import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { TemplatePlayground } from "@/components/TemplatePlayground";
import { Button } from "@/components/ui/button";
import { PaperCard } from "@/components/ui/card";
import { FaqAccordion } from "./faq-accordion";

const FEATURES = [
  { title: "Template-based rendering", body: "Send a title, author, and image — Ogify does the design. No SVG knowledge needed." },
  { title: "URL screenshot mode", body: "Give us any URL and we'll snapshot the perfect social preview area." },
  { title: "Zero infrastructure", body: "Runs entirely on Cloudflare Workers. No server, no maintenance." },
  { title: "Automatic caching", body: "Images are cached at the edge, so they load instantly for social platforms." },
  { title: "Paddle handles taxes", body: "Billing and global tax compliance are on us. You never worry about VAT or GST." },
  { title: "Watermark-free on paid plans", body: "Remove the Ogify badge or replace it with your own logo." },
  { title: "Open-source OgImage component", body: "Drop it into your React or Next.js app — one line and you're done." },
  { title: "Webhooks and key management", body: "Rotate keys, monitor usage, and get alerts when you're near your limit." },
];

const AUDIENCE = [
  { tag: "Bloggers", title: "Content creators", body: "Automatically generate a unique share image for every post." },
  { tag: "Builders", title: "Indie hackers and SaaS", body: "Make your product links stand out on Twitter, LinkedIn and Discord." },
  { tag: "Static sites", title: "Hugo, Astro, Jekyll", body: "Works with any static site generator — no backend needed." },
  { tag: "Agencies", title: "Marketing teams", body: "Bulk-generate branded social cards for clients with one API." },
];

const TESTIMONIALS = [
  { quote: "Finally, I can stop maintaining a Puppeteer server just for OG images. Ogify did in 10 minutes what took me weeks.", who: "Sarah — Indie maker" },
  { quote: "We integrate it into our CI/CD so every blog deploy gets a fresh social card automatically. It just works.", who: "Marcus — Dev advocate" },
  { quote: "The lifetime deal was a no-brainer. Now I get professional sharing images for every product update.", who: "Jake — Solopreneur" },
];

export default function LandingPage() {
  return (
    <>
      <Header />

      <section className="mx-auto max-w-6xl px-7 pb-[70px] pt-[84px]">
        <div className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold">
              <span className="h-px w-[18px] bg-gold" />
              Open graph rendering API
            </div>
            <h1 className="text-[52px] leading-[1.06] text-paper">
              Beautiful social images for your site, in{" "}
              <span className="text-cinnabar">one</span> API call.
            </h1>
            <p className="mt-5 max-w-[480px] text-[17px] text-muted">
              No headless browser, no Puppeteer, no server. Just a curl command
              or a drop-in component. Generate perfect Open Graph images and
              screenshots — starting at $0.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/signup">
                <Button variant="primary">Get started free</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost">
                  Lifetime license — $99
                  <span className="ml-2 rounded-full border border-gold px-2 py-0.5 text-[11px] text-gold">
                    50 left
                  </span>
                </Button>
              </Link>
            </div>

            <div className="mt-9 font-mono text-[12.5px] tracking-wide text-line">
              TRUSTED BY 200+ INDIE HACKERS, BLOGGERS &amp; SAAS FOUNDERS
            </div>
          </div>

          <HeroCard />
        </div>

        <PaperCard className="mt-[60px] max-w-[620px] !p-0">
          <div className="flex justify-between border-b border-dashed border-ink px-5.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-55">
            <span>request</span>
            <span>render / template</span>
          </div>
          <pre className="code-card rounded-b">
{`curl -X POST https://api.ogify.online/render/template \\
  -H "x-api-key: $OGIFY_KEY" \\
  -d '{"template":"blog","title":"My Post"}' \\
  --output social.png`}
          </pre>
        </PaperCard>
      </section>

      <section className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <SectionHead
            eyebrow="How it works"
            title="From zero to a finished card in three steps."
          />
          <div className="grid gap-7 md:grid-cols-3">
            {[
              { num: "01", title: "Sign up and get an API key", body: "Free account, no credit card required." },
              { num: "02", title: "Choose a template or drop a URL", body: "Use a built-in template or just pass any public URL." },
              { num: "03", title: "Get back a perfect PNG", body: "Add it to your meta tags and go live." },
            ].map((step) => (
              <div key={step.num} className="border-l border-line-dim pl-[22px]">
                <span className="mb-3.5 block font-mono text-[13px] text-cinnabar">
                  {step.num}
                </span>
                <h3 className="font-body text-[18px] font-semibold normal-case tracking-normal text-paper">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[14.5px] text-muted">{step.body}</p>
              </div>
            ))}
          </div>

          <VideoSlot label="60-second walkthrough — drop your .mp4 / embed here" />
        </div>
      </section>

      <section id="demo" className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <SectionHead
            eyebrow="Try it now"
            title="Type a title. Watch the card render."
            body="This is a live preview running in your browser — no sign-up required. Hooked up to the real API, every render is rate-limited on this page."
          />
          <TemplatePlayground />
        </div>
      </section>

      <section id="features" className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <SectionHead
            eyebrow="Core features"
            title="Everything you need, nothing you have to maintain."
          />
          <div className="grid grid-cols-1 gap-px border border-line-dim bg-line-dim md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-ink p-7">
                <h3 className="flex items-center gap-2.5 font-body text-[15.5px] font-semibold normal-case tracking-normal text-paper">
                  <span className="h-1.5 w-1.5 shrink-0 bg-cinnabar" />
                  {f.title}
                </h3>
                <p className="mt-2.5 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <SectionHead
            eyebrow="Who it's for"
            title="Built for anyone shipping links into the world."
          />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="rounded border border-line-dim p-6">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-gold">
                  {a.tag}
                </div>
                <h3 className="mt-2.5 font-body text-[15px] font-semibold normal-case tracking-normal text-paper">
                  {a.title}
                </h3>
                <p className="mt-2 text-[13px] text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <SectionHead eyebrow="From early users" title="What people are saying." />
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <PaperCard key={t.who}>
                <span className="mb-2.5 block font-display text-[46px] leading-[0.4] text-cinnabar">
                  &ldquo;
                </span>
                <p className="text-[14.5px] leading-relaxed">{t.quote}</p>
                <div className="mt-[18px] font-mono text-[11.5px] uppercase tracking-wide text-[#5b5b55]">
                  {t.who}
                </div>
              </PaperCard>
            ))}
          </div>
          <VideoSlot label="Video testimonial — drop a clip here" tag="Customer video placeholder" />
        </div>
      </section>

      <section id="faq" className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <SectionHead eyebrow="FAQ" title="Questions, answered." />
          <FaqAccordion />
        </div>
      </section>

      <section className="border-t border-line-dim py-24">
        <div className="mx-auto max-w-6xl px-7">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded bg-cinnabar p-9 text-paper">
            <div>
              <h3 className="text-[22px]">Founder&apos;s license — $99 for lifetime access</h3>
              <p className="mt-2 font-mono text-[13px] text-paper/85">
                5,000 renders / month, forever. Only 50 spots.
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="paper">Claim a spot</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mb-14 max-w-[620px]">
      <div className="mb-3.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold">
        <span className="h-px w-[18px] bg-gold" />
        {eyebrow}
      </div>
      <h2 className="text-[34px] leading-tight text-paper">{title}</h2>
      {body && <p className="mt-3.5 max-w-[520px] text-base text-muted">{body}</p>}
    </div>
  );
}

function VideoSlot({ label, tag = "Demo video placeholder" }: { label: string; tag?: string }) {
  return (
    <div className="relative mt-12 flex aspect-video flex-col items-center justify-center gap-3.5 rounded border border-dashed border-line bg-ink-soft">
      <span className="absolute left-3.5 top-3.5 rounded-full border border-gold px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">
        {tag}
      </span>
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-paper">
        <div className="ml-1 h-0 w-0 border-y-[9px] border-l-[15px] border-y-transparent border-l-paper" />
      </div>
      <div className="text-center font-mono text-xs tracking-wide text-muted">{label}</div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative aspect-[1200/630] w-full overflow-hidden rounded border border-line-dim bg-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/landing-previews/hero-card.png")',
          }}
        />
      </div>
    </div>
  );
}
