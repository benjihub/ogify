import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { DocsNav, type DocLink } from "./docs-nav";

const DOC_LINKS: DocLink[] = [
  { href: "/docs/quickstart", label: "Quickstart" },
  { href: "/docs/authentication", label: "Authentication" },
  { href: "/docs/api-reference/render-template", label: "Render template" },
  { href: "/docs/api-reference/render-url", label: "Render URL" },
  { href: "/docs/api-reference/render-composite", label: "Render composite" },
  { href: "/docs/public-images", label: "Public image URLs" },
  { href: "/docs/templates", label: "Templates" },
  { href: "/docs/rate-limits", label: "Rate limits" },
  { href: "/docs/integrations/nextjs", label: "Next.js" },
  { href: "/docs/integrations/astro", label: "Astro / static sites" },
  { href: "/docs/integrations/ci-cd", label: "CI/CD" },
];

export function DocsShell({
  eyebrow = "Docs",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-6xl gap-10 px-7 py-20 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <DocsNav links={DOC_LINKS} />
        </aside>

        <article className="min-w-0">
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold">
            <span className="h-px w-[18px] bg-gold" />
            {eyebrow}
          </div>
          <h1 className="text-[34px] leading-tight text-paper">{title}</h1>
          <p className="mt-3.5 max-w-2xl text-base text-muted">{description}</p>
          <div className="mt-10 space-y-10">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export function DocsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line-dim pt-7">
      <h2 className="font-body text-[19px] font-semibold normal-case tracking-normal text-paper">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted">{children}</div>
    </section>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="code-card">
      {children}
    </pre>
  );
}

export function FieldTable({
  rows,
}: {
  rows: { name: string; type: string; required: string; notes: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded border border-line-dim">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-ink-soft text-gold">
          <tr>
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Field</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Required</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-line-dim">
              <td className="px-4 py-3 font-mono text-paper">{row.name}</td>
              <td className="px-4 py-3">{row.type}</td>
              <td className="px-4 py-3">{row.required}</td>
              <td className="px-4 py-3">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
