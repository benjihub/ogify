import type { Metadata } from "next";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";

export const metadata: Metadata = { title: "Status", description: "Current Ogify API health." };

async function getHealth() {
  try {
    const res = await fetch("https://api.ogify.online/health", { cache: "no-store" });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const data = await res.json() as { status?: string; env?: string; version?: string; ts?: string };
    return { ok: data.status === "ok", status: res.status, data };
  } catch { return { ok: false, status: 0, data: null }; }
}

export default async function StatusPage() {
  const health = await getHealth();
  return <><Header /><main className="mx-auto max-w-4xl px-7 py-20"><div className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Status</div><h1 className="mt-3 text-4xl text-paper">Ogify service health</h1><div className="mt-10 rounded border border-line-dim bg-ink-soft p-6"><div className="flex items-center justify-between gap-4"><div><div className="font-body text-lg font-semibold text-paper">Rendering API</div><p className="mt-1 font-mono text-xs text-muted">api.ogify.online</p></div><span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase ${health.ok ? "border-[#4ade80] text-[#4ade80]" : "border-cinnabar text-cinnabar"}`}>{health.ok ? "Operational" : "Degraded"}</span></div>{health.data&&<div className="mt-5 grid gap-3 border-t border-line-dim pt-5 font-mono text-xs text-muted sm:grid-cols-3"><div>Environment<br/><span className="text-fg">{health.data.env??"—"}</span></div><div>Version<br/><span className="text-fg">{health.data.version??"—"}</span></div><div>Checked<br/><span className="text-fg">{health.data.ts ? new Date(health.data.ts).toLocaleString() : "—"}</span></div></div>}</div><p className="mt-6 text-sm text-muted">If your request fails while the API is operational, keep the <code className="text-paper">X-Request-Id</code> response header and include it in your support message.</p></main><Footer /></>;
}
