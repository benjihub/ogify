import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Row { id:string; type:"template"|"url"; template_id:string|null; status:"success"|"error"|"rate_limited"; duration_ms:number|null; created_at:string; }

export default async function RenderHistoryPage({ searchParams }: { searchParams?: { status?: string; type?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase.from("render_logs").select("id,type,template_id,status,duration_ms,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (searchParams?.status && ["success","error","rate_limited"].includes(searchParams.status)) query = query.eq("status", searchParams.status);
  if (searchParams?.type && ["template","url"].includes(searchParams.type)) query = query.eq("type", searchParams.type);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/dashboard" className="font-mono text-[11px] text-cinnabar hover:underline">← Dashboard</Link><h1 className="mt-3 font-display text-[28px] uppercase tracking-wide text-fg">Render history</h1><p className="mt-1 font-mono text-xs text-muted">Latest 100 render events. Filter using the controls below.</p></div><div className="flex flex-wrap gap-2"><Filter href="/dashboard/renders" label="All" active={!searchParams?.status&&!searchParams?.type}/><Filter href="/dashboard/renders?status=success" label="Success" active={searchParams?.status==="success"}/><Filter href="/dashboard/renders?status=error" label="Errors" active={searchParams?.status==="error"}/><Filter href="/dashboard/renders?type=template" label="Templates" active={searchParams?.type==="template"}/><Filter href="/dashboard/renders?type=url" label="Screenshots" active={searchParams?.type==="url"}/></div></div><div className="overflow-x-auto rounded border border-line-dim bg-ink-soft"><table className="w-full"><thead><tr className="border-b border-line-dim">{["Type","Template","Status","Duration","Created"].map(col=><th key={col} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted">{col}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b border-line-dim/50 last:border-none"><td className="px-4 py-3 font-mono text-xs text-fg">{row.type}</td><td className="px-4 py-3 font-mono text-xs text-muted">{row.template_id??"—"}</td><td className="px-4 py-3 font-mono text-xs"><span className={row.status==="success"?"text-[#4ade80]":row.status==="error"?"text-cinnabar":"text-gold"}>{row.status}</span></td><td className="px-4 py-3 font-mono text-xs text-muted">{row.duration_ms==null?"—":row.duration_ms<1000?`${row.duration_ms} ms`:`${(row.duration_ms/1000).toFixed(1)} s`}</td><td className="px-4 py-3 font-mono text-xs text-muted">{new Date(row.created_at).toLocaleString()}</td></tr>)}{rows.length===0&&<tr><td colSpan={5} className="px-4 py-12 text-center font-mono text-xs text-muted">No renders match this filter.</td></tr>}</tbody></table></div></div>;
}

function Filter({ href,label,active }:{href:string;label:string;active:boolean}){return <Link href={href} className={`rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide ${active?"border-cinnabar bg-cinnabar/10 text-paper":"border-line-dim text-muted hover:text-fg"}`}>{label}</Link>;}
