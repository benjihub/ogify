import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";

export function SeoLandingPage({
  eyebrow,
  title,
  description,
  secondaryTitle,
  secondaryBody,
  bullets,
  code,
}: {
  eyebrow: string;
  title: string;
  description: string;
  secondaryTitle: string;
  secondaryBody: string;
  bullets: string[];
  code: string;
}) {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <div className="eyebrow mb-4">{eyebrow}</div>
              <h1 className="max-w-2xl text-[clamp(2.35rem,4.8vw,3.9rem)] leading-[1.04] tracking-[-0.045em] text-paper">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-[17px] sm:leading-8">
                {description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild href="/signup">Start free</Button>
                <Button asChild href="/docs" variant="ghost">Read docs</Button>
              </div>
            </div>
            <pre className="code-card max-w-full text-[12px]">{code}</pre>
          </div>
        </section>

        <section className="border-t border-line-dim py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
            <div>
              <h2 className="text-[clamp(1.8rem,3.2vw,2.4rem)] leading-tight tracking-[-0.035em] text-paper">
                {secondaryTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                {secondaryBody}
              </p>
            </div>
            <ul className="space-y-3">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-line-dim bg-ink-soft/65 p-4 text-sm leading-6 text-muted">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cinnabar" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
