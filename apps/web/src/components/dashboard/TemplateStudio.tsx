"use client";

import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.ogify.online";

export function TemplateStudio() {
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState("Launch announcement");
  const [title, setTitle] = useState("Build something remarkable.");
  const [subtitle, setSubtitle] = useState("A production-ready social card, generated on demand.");
  const [tag, setTag] = useState("PRODUCT UPDATE");
  const [brand, setBrand] = useState("YOUR BRAND");
  const [logoUrl, setLogoUrl] = useState("");
  const [alignment, setAlignment] = useState<"left" | "center">("left");
  const [accentShape, setAccentShape] = useState(true);
  const [accent, setAccent] = useState("#F05A3A");
  const [background, setBackground] = useState("#101216");
  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => makePreviewHtml({ title, subtitle, tag, brand, logoUrl, alignment, accentShape, accent, background }), [title, subtitle, tag, brand, logoUrl, alignment, accentShape, accent, background]);

  async function save() {
    setError("");
    setSavedId("");
    setBusy(true);
    try {
      if (!apiKey.trim()) throw new Error("Paste an Ogify API key to save this template.");
      const safeLogoUrl = safeImageUrl(logoUrl);
      if (logoUrl.trim() && !safeLogoUrl) throw new Error("Logo URL must be a public HTTP or HTTPS URL without credentials.");
      const response = await fetch(`${API_BASE}/v1/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey.trim() },
        body: JSON.stringify({
          name,
          width: 1200,
          height: 630,
          format: "png",
          html: `<main class="card layout-${alignment}"><img class="logo" src="${safeLogoUrl}" alt="${escapeHtml(brand)} logo"><div class="tag">{{tag}}</div><h1>{{title}}</h1><p>{{subtitle}}</p><footer><strong>{{brand}}</strong><span>ogify.online</span></footer></main>`,
          css: `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Inter,Arial,sans-serif}.card{position:relative;display:flex;flex-direction:column;justify-content:center;gap:24px;width:100%;height:100%;padding:76px;background:${safeColor(background, "#101216")};color:#fff;overflow:hidden}.card:before{content:"";position:absolute;width:360px;height:360px;right:-100px;top:-130px;border-radius:50%;background:${safeColor(accent, "#FF5A36")};opacity:${accentShape ? ".16" : "0"};filter:blur(2px)}.logo{position:absolute;z-index:1;right:76px;top:50px;max-width:180px;max-height:70px;object-fit:contain}.logo[src=""]{display:none}.tag{position:relative;z-index:1;align-self:flex-start;border:1px solid ${safeColor(accent, "#FF5A36")};border-radius:999px;padding:10px 16px;color:${safeColor(accent, "#FF5A36")};font-size:16px;font-weight:800;letter-spacing:.14em}.card h1{position:relative;z-index:1;max-width:1000px;margin:0;font-size:76px;line-height:1.02;letter-spacing:-.045em;font-weight:800}.card p{position:relative;z-index:1;max-width:850px;margin:0;color:#c5c8d0;font-size:28px;line-height:1.4}.card footer{position:absolute;z-index:1;left:76px;right:76px;bottom:48px;display:flex;justify-content:space-between;align-items:center;font-size:17px;color:#a8adb8}.card footer strong{color:#fff;letter-spacing:.08em;text-transform:uppercase}.layout-center{text-align:center;align-items:center}.layout-center .tag{align-self:center}.layout-center p{margin-inline:auto}.layout-center .logo{left:50%;right:auto;transform:translateX(-50%)}`,
        }),
      });
      const data = await response.json() as { template?: { id?: string; name?: string }; error?: string; request_id?: string };
      if (!response.ok) throw new Error(`${data.error || `Request failed (${response.status})`}${data.request_id ? ` · request ${data.request_id}` : ""}`);
      setSavedId(data.template?.id || "Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save template.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
        <div className="mb-1 text-base font-semibold tracking-tight text-paper">Visual template editor</div>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-muted">Design a reusable 1200 × 630 card, preview it live, and save the variable-backed HTML/CSS template to your Ogify account. The API key stays in this browser session and is not persisted.</p>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <Field label="API key"><input type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ogfy_live_…" className={inputClass} /></Field>
            <Field label="Template name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} /></Field>
            <Field label="Headline"><textarea value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} rows={3} className={inputClass} /></Field>
            <Field label="Subtitle"><textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={240} rows={2} className={inputClass} /></Field>
            <Field label="Tag"><input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={50} className={inputClass} /></Field>
            <Field label="Brand label"><input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={50} className={inputClass} /></Field>
            <Field label="Logo URL (optional)"><input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://cdn.example.com/logo.png" className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Text alignment"><select value={alignment} onChange={(e) => setAlignment(e.target.value as "left" | "center")} className={inputClass}><option value="left">Left aligned</option><option value="center">Centered</option></select></Field>
              <label className="flex items-center gap-2 pt-6 font-mono text-[10px] uppercase tracking-wider text-muted"><input type="checkbox" checked={accentShape} onChange={(e) => setAccentShape(e.target.checked)} className="accent-[#ff5a36]" /> Accent shape</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Accent" value={accent} onChange={setAccent} />
              <ColorField label="Background" value={background} onChange={setBackground} />
            </div>
            <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cinnabar px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cinnabar-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Save reusable template"}</button>
            {savedId && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">Template saved: {savedId}</p>}
            {error && <p role="alert" className="rounded-xl border border-cinnabar/25 bg-cinnabar/10 p-3 text-sm leading-5 text-cinnabar">{error}</p>}
            <p className="text-xs leading-5 text-muted">Saved templates expose title, subtitle, tag and brand text variables; logo URL, alignment and colors are fixed design layers. Render them through <code className="rounded bg-ink px-1.5 py-0.5 text-paper">/v1/templates/:id/render</code>.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-muted"><span>Live preview</span><span>1200 × 630</span></div>
            <div className="overflow-hidden rounded-2xl border border-line-dim bg-ink shadow-inner" style={{ aspectRatio: "1200 / 630" }}>
              <iframe title="Ogify template preview" srcDoc={preview} sandbox="" className="h-full w-full border-0" />
            </div>
            <p className="text-xs leading-5 text-muted">The preview is local. Saving creates a template through the live API; it does not render an image or consume a render credit until you call the template render endpoint.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function makePreviewHtml(values: { title: string; subtitle: string; tag: string; brand: string; logoUrl: string; alignment: "left" | "center"; accentShape: boolean; accent: string; background: string }) {
  const e = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const logo = safeImageUrl(values.logoUrl) || "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Inter,Arial,sans-serif}.card{position:relative;display:flex;flex-direction:column;justify-content:center;gap:clamp(8px,2vw,24px);width:100%;height:100%;padding:6.3%;background:${safeColor(values.background, "#101216")};color:#fff;overflow:hidden}.card:before{content:"";position:absolute;width:30%;aspect-ratio:1;right:-8%;top:-20%;border-radius:50%;background:${safeColor(values.accent, "#FF5A36")};opacity:${values.accentShape ? ".16" : "0"}}.logo{position:absolute;z-index:1;right:6.3%;top:8%;max-width:16%;max-height:12%;object-fit:contain}.logo[src=""]{display:none}.tag{position:relative;z-index:1;align-self:flex-start;border:1px solid ${safeColor(values.accent, "#FF5A36")};border-radius:999px;padding:1.3% 2%;color:${safeColor(values.accent, "#FF5A36")};font-size:clamp(7px,1.35vw,16px);font-weight:800;letter-spacing:.14em}.card h1{position:relative;z-index:1;max-width:1000px;margin:0;font-size:clamp(24px,6.4vw,76px);line-height:1.02;letter-spacing:-.045em;font-weight:800}.card p{position:relative;z-index:1;max-width:850px;margin:0;color:#c5c8d0;font-size:clamp(11px,2.35vw,28px);line-height:1.4}.card footer{position:absolute;z-index:1;left:6.3%;right:6.3%;bottom:7.5%;display:flex;justify-content:space-between;align-items:center;font-size:clamp(8px,1.4vw,17px);color:#a8adb8}.card footer strong{color:#fff;letter-spacing:.08em;text-transform:uppercase}.layout-center{text-align:center;align-items:center}.layout-center .tag{align-self:center}.layout-center p{margin-inline:auto}.layout-center .logo{left:50%;right:auto;transform:translateX(-50%)}</style></head><body><main class="card layout-${values.alignment}"><img class="logo" src="${e(logo)}" alt="${e(values.brand)} logo"><div class="tag">${e(values.tag)}</div><h1>${e(values.title)}</h1><p>${e(values.subtitle)}</p><footer><strong>${e(values.brand)}</strong><span>ogify.online</span></footer></main></body></html>`;
}

function safeImageUrl(value: string) { if (!value.trim()) return ""; try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|::1$)/i.test(url.hostname) || /\.(local|internal|localhost)$/i.test(url.hostname)) return ""; return url.toString(); } catch { return ""; } }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function safeColor(value: string, fallback: string) { return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-fg"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div><span className="mb-1.5 block text-xs font-semibold text-fg">{label}</span><div className="flex gap-2"><input type="color" aria-label={`${label} color picker`} value={safeColor(value, "#101216")} onChange={(e) => onChange(e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-line-dim bg-ink p-1" /><input aria-label={`${label} hex value`} value={value} onChange={(e) => onChange(e.target.value)} pattern="#[0-9a-fA-F]{6}" className={inputClass} /></div></div>; }
const inputClass = "w-full rounded-xl border border-line-dim bg-ink px-3.5 py-3 text-sm text-fg placeholder:text-muted focus:border-cinnabar focus:outline-none focus:ring-4 focus:ring-cinnabar/10";
