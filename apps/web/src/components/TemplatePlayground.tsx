"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api-base";

type TemplateId = "blog" | "product" | "saas";

const TEMPLATES: Record<TemplateId, { tag: string; title: string; author: string }> = {
  blog: { tag: "Building in public", title: "Shipping a side project in a weekend", author: "Your Name · yoursite.com" },
  product: { tag: "New release", title: "Introducing the v2.0 dashboard", author: "Acme Inc. · acme.io" },
  saas: { tag: "Changelog", title: "Now with team workspaces", author: "Flowbase · flowbase.app" },
};

const API_BASE = getApiBaseUrl();

export function TemplatePlayground() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("blog");
  const [title, setTitle] = useState(TEMPLATES.blog.title);
  const [author, setAuthor] = useState(TEMPLATES.blog.author);
  const [tag, setTag] = useState(TEMPLATES.blog.tag);
  const [imageUrl, setImageUrl] = useState("/template-previews/blog.png");
  const [status, setStatus] = useState<"idle" | "rendering" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const lastObjectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
  }, []);

  function selectTemplate(id: TemplateId) {
    setActiveTemplate(id);
    setTitle(TEMPLATES[id].title);
    setAuthor(TEMPLATES[id].author);
    setTag(TEMPLATES[id].tag);
    setImageUrl(`/template-previews/${id}.png`);
    setStatus("idle");
    setError("");
  }

  async function renderPreview() {
    if (!title.trim()) return;
    setStatus("rendering");
    setError("");
    try {
      const response = await fetch(`${API_BASE}/demo/render/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: activeTemplate, title, author, tag }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || `Render failed (${response.status})`);
      }
      const blob = await response.blob();
      if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
      const nextUrl = URL.createObjectURL(blob);
      lastObjectUrl.current = nextUrl;
      setImageUrl(nextUrl);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not render preview.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
      <div className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex gap-1.5 rounded-xl border border-line-dim bg-ink p-1.5">
          {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
            <button type="button" key={id} aria-pressed={activeTemplate === id} onClick={() => selectTemplate(id)} className={cn("min-h-10 flex-1 rounded-lg border border-transparent px-2 py-2 text-xs font-semibold capitalize transition", activeTemplate === id ? "border-cinnabar/30 bg-cinnabar text-white shadow-sm" : "text-muted hover:bg-ink-soft hover:text-paper")}>
              {id}
            </button>
          ))}
        </div>

        <label htmlFor="playground-title" className="mb-2 block text-xs font-semibold text-fg">Title</label>
        <input id="playground-title" value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} className="mb-4 min-h-11 w-full rounded-xl border border-line-dim bg-ink px-3.5 py-3 text-sm text-paper placeholder:text-muted focus:border-cinnabar focus:outline-none focus:ring-4 focus:ring-cinnabar/10" />
        <label htmlFor="playground-author" className="mb-2 block text-xs font-semibold text-fg">Author / site</label>
        <input id="playground-author" value={author} maxLength={70} onChange={(e) => setAuthor(e.target.value)} className="mb-4 min-h-11 w-full rounded-xl border border-line-dim bg-ink px-3.5 py-3 text-sm text-paper placeholder:text-muted focus:border-cinnabar focus:outline-none focus:ring-4 focus:ring-cinnabar/10" />
        <label htmlFor="playground-tag" className="mb-2 block text-xs font-semibold text-fg">Tag</label>
        <input id="playground-tag" value={tag} maxLength={40} onChange={(e) => setTag(e.target.value)} className="mb-5 min-h-11 w-full rounded-xl border border-line-dim bg-ink px-3.5 py-3 text-sm text-paper placeholder:text-muted focus:border-cinnabar focus:outline-none focus:ring-4 focus:ring-cinnabar/10" />

        <button type="button" onClick={renderPreview} disabled={status === "rendering" || !title.trim()} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cinnabar px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cinnabar-dark disabled:cursor-not-allowed disabled:opacity-50">
          {status === "rendering" ? "Rendering…" : "Render live preview"}
        </button>
        {error && <p role="alert" className="mt-3 rounded-xl border border-cinnabar/25 bg-cinnabar/10 p-3 text-sm leading-5 text-cinnabar">{error}</p>}
        <p className="mt-4 text-xs leading-5 text-muted">This preview calls Ogify&apos;s production-safe demo renderer. The demo is rate-limited; authenticated API requests have plan-based limits.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative aspect-[1200/630] overflow-hidden rounded-2xl border border-line-dim bg-ink shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`${activeTemplate} Ogify preview`} className="h-full w-full object-cover" />
          {status === "rendering" && <div className="absolute inset-0 grid place-items-center bg-ink/75 text-sm font-semibold text-paper backdrop-blur-sm">Rendering on Ogify…</div>}
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>1200 × 630 PNG</span>
          <span>{status === "ready" ? "Live render" : "Starter preview"}</span>
        </div>
      </div>
    </div>
  );
}
