import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { DocsNav, type DocLink } from "./docs-nav";

const DOC_LINKS: DocLink[] = [
  { href: "/docs/quickstart", label: "Quickstart" },
  { href: "/docs/authentication", label: "Authentication" },
  { href: "/docs/api-reference/render-template", label: "Render template" },
  { href: "/docs/api-reference/render-url", label: "Screenshot URL" },
  { href: "/docs/api-reference/render-html", label: "HTML → image" },
  { href: "/docs/api-reference/render-pdf", label: "URL / HTML → PDF" },
  { href: "/docs/api-reference/render-social", label: "Smart social card" },
  { href: "/docs/api-reference/render-composite", label: "Render composite" },
  { href: "/docs/api-reference/batch-jobs", label: "Batch & async jobs" },
  { href: "/docs/api-reference/metadata", label: "Metadata extraction" },
  { href: "/docs/api-reference/content-extraction", label: "Content extraction" },
  { href: "/docs/api-reference/structured-extraction", label: "Structured / Markdown" },
  { href: "/docs/api-reference/brand-link-preview", label: "Brand / link preview" },
  { href: "/docs/api-reference/advanced-browser", label: "Advanced browser controls" },
  { href: "/docs/api-reference/browser-run", label: "Browser actions" },
  { href: "/docs/api-reference/projects-keys", label: "Projects / API scopes" },
  { href: "/docs/api-reference/collections", label: "Render collections" },
  { href: "/docs/api-reference/storage-export", label: "Storage export" },
  { href: "/docs/api-reference/video-document-tools", label: "Video / PDF tools" },
  { href: "/docs/templates", label: "Reusable templates" },
  { href: "/docs/render-links", label: "Render links" },
  { href: "/docs/sdk", label: "SDK & CLI" },
  { href: "/docs/public-images", label: "Hosted assets" },
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
      <main className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-20">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
          <DocsNav links={DOC_LINKS} />
        </aside>

        <article className="min-w-0">
          <div className="eyebrow mb-3.5">
            {eyebrow}
          </div>
          <h1 className="text-[clamp(1.9rem,3.5vw,2.6rem)] leading-[1.1] tracking-[-0.04em] text-paper">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{description}</p>
          <div className="mt-8 space-y-10 sm:mt-10">{children}</div>
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
    <section className="border-t border-line-dim pt-6 sm:pt-7">
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
    <div className="overflow-x-auto rounded-xl border border-line-dim">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
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
