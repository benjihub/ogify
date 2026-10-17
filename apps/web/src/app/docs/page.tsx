import Link from "next/link";
import { DocsSection, DocsShell } from "./docs-shell";

export default function DocsPage() {
  return (
    <DocsShell
      title="Ogify documentation"
      description="Start with the quickstart, then use the reference pages when you need exact request fields, limits, caching behavior, and template schemas."
    >
      <DocsSection title="Developer platform documentation">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Quickstart", "/docs/quickstart", "Render your first image in a few minutes."],
            ["Authentication", "/docs/authentication", "API keys, headers, rotation, and security."],
            ["Render template", "/docs/api-reference/render-template", "JSON body fields, responses, and errors."],
            ["Render URL", "/docs/api-reference/render-url", "Screenshot parameters, viewport, and caching."],
            ["HTML → image", "/docs/api-reference/render-html", "Render arbitrary HTML and CSS to PNG, JPEG, or WebP."],
            ["URL / HTML → PDF", "/docs/api-reference/render-pdf", "Generate hosted PDFs for reports, invoices, certificates, and pages."],
            ["Smart social card", "/docs/api-reference/render-social", "Turn one URL into extracted metadata + screenshot + branded card."],
            ["Content extraction", "/docs/api-reference/content-extraction", "Extract rendered HTML, visible text, and links from dynamic pages."],
            ["Batch & async jobs", "/docs/api-reference/batch-jobs", "Run mixed batches or background jobs with signed webhooks."],
            ["Render composite", "/docs/api-reference/render-composite", "Combine a live website capture with a branded social card."],
            ["Hosted assets", "/docs/public-images", "Use generated image/PDF URLs directly in your product or metadata."],
            ["Reusable templates", "/docs/templates", "Save HTML templates with variables and render them via API."],
            ["SDK & CLI", "/docs/sdk", "Official TypeScript client and command-line workflow."],
            ["Rate limits", "/docs/rate-limits", "Plan limits, usage checks, and 429 behavior."],
            ["Next.js", "/docs/integrations/nextjs", "Use Ogify from server routes, builds, and metadata generation."],
            ["Astro / static sites", "/docs/integrations/astro", "Generate public social images at build time."],
          ].map(([title, href, body]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-line-dim bg-ink-soft/65 p-5 transition duration-150 hover:-translate-y-0.5 hover:border-line hover:bg-ink-soft hover:shadow-lg"
            >
              <h2 className="font-body text-[16px] font-semibold normal-case tracking-normal text-paper">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </Link>
          ))}
        </div>
      </DocsSection>
    </DocsShell>
  );
}
