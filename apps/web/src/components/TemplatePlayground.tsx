"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TemplateId = "blog" | "product" | "saas";

const TEMPLATES: Record<TemplateId, { tag: string; title: string; author: string }> = {
  blog: { tag: "Building in public", title: "Shipping a side project in a weekend", author: "Your Name · yoursite.com" },
  product: { tag: "New release", title: "Introducing the v2.0 dashboard", author: "Acme Inc. · acme.io" },
  saas: { tag: "Changelog", title: "Now with team workspaces", author: "Flowbase · flowbase.app" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.ogify.online";

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
    <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded border border-line-dim bg-ink-soft p-6">
        <div className="mb-5 flex gap-2">
          {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
            <button key={id} onClick={() => selectTemplate(id)} className={cn("flex-1 rounded border px-0 py-2.5 font-mono text-xs uppercase tracking-wide", activeTemplate === id ? "border-cinnabar bg-cinnabar/10 text-paper" : "border-line-dim text-muted")}>
              {id}
            </button>
          ))}
        </div>

        <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-line">Title</label>
        <input value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} className="mb-4 w-full rounded border border-line-dim bg-ink px-3 py-2.5 text-sm text-paper focus:border-cinnabar focus:outline-none" />
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-line">Author / site</label>
        <input value={author} maxLength={70} onChange={(e) => setAuthor(e.target.value)} className="mb-4 w-full rounded border border-line-dim bg-ink px-3 py-2.5 text-sm text-paper focus:border-cinnabar focus:outline-none" />
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-line">Tag</label>
        <input value={tag} maxLength={40} onChange={(e) => setTag(e.target.value)} className="mb-5 w-full rounded border border-line-dim bg-ink px-3 py-2.5 text-sm text-paper focus:border-cinnabar focus:outline-none" />

        <button onClick={renderPreview} disabled={status === "rendering" || !title.trim()} className="w-full rounded bg-cinnabar px-4 py-3 font-mono text-xs uppercase tracking-wide text-paper disabled:cursor-not-allowed disabled:opacity-50">
          {status === "rendering" ? "Rendering…" : "Render live preview"}
        </button>
        {error && <p className="mt-3 font-mono text-xs text-cinnabar">{error}</p>}
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-line">This preview calls Ogify&apos;s production-safe demo renderer. The demo is rate-limited; authenticated API requests have plan-based limits.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative aspect-[1200/630] overflow-hidden rounded border border-line-dim bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`${activeTemplate} Ogify preview`} className="h-full w-full object-cover" />
          {status === "rendering" && <div className="absolute inset-0 grid place-items-center bg-ink/70 font-mono text-xs uppercase tracking-wider text-paper">Rendering on Ogify…</div>}
        </div>
        <div className="flex items-center justify-between font-mono text-[10.5px] text-line">
          <span>1200 × 630 PNG</span>
          <span>{status === "ready" ? "Live render" : "Starter preview"}</span>
        </div>
      </div>
    </div>
  );
}
