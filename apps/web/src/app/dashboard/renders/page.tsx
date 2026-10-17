import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Row {
  id: string;
  type: "template" | "url";
  template_id: string | null;
  status: "success" | "error" | "rate_limited";
  duration_ms: number | null;
  created_at: string;
}

export default async function RenderHistoryPage({
  searchParams,
}: {
  searchParams?: { status?: string; type?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("render_logs")
    .select("id,type,template_id,status,duration_ms,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams?.status && ["success", "error", "rate_limited"].includes(searchParams.status)) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams?.type && ["template", "url"].includes(searchParams.type)) {
    query = query.eq("type", searchParams.type);
  }

  const { data } = await query;
  const rows = (data ?? []) as Row[];
  const filters = [
    { href: "/dashboard/renders", label: "All events", active: !searchParams?.status && !searchParams?.type },
    { href: "/dashboard/renders?status=success", label: "Success", active: searchParams?.status === "success" },
    { href: "/dashboard/renders?status=error", label: "Errors", active: searchParams?.status === "error" },
    { href: "/dashboard/renders?type=template", label: "Templates", active: searchParams?.type === "template" },
    { href: "/dashboard/renders?type=url", label: "Screenshots", active: searchParams?.type === "url" },
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-paper">
            <span aria-hidden="true">←</span> Dashboard overview
          </Link>
          <p className="eyebrow mb-2">Activity</p>
          <h1 className="dashboard-page-title text-paper">Render history</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Review your latest 100 render events, inspect outcomes, and narrow the list by type or status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.label}
              href={filter.href}
              aria-current={filter.active ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                filter.active
                  ? "border-cinnabar/35 bg-cinnabar/10 text-paper"
                  : "border-line-dim bg-ink-soft/50 text-muted hover:border-line hover:text-paper"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line-dim bg-ink-soft/80 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-line-dim px-4 py-4 sm:px-5">
          <span className="text-sm font-semibold text-paper">Recent activity</span>
          <span className="text-xs text-muted">{rows.length} event{rows.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line-dim bg-ink/35">
                {["Type", "Template", "Status", "Duration", "Created"].map((column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted sm:px-5">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-dim/70 last:border-none hover:bg-ink/25">
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-fg sm:px-5">{row.type === "url" ? "Screenshot" : "Template"}</td>
                  <td className="px-4 py-4 font-mono text-xs text-muted sm:px-5">{row.template_id ?? "—"}</td>
                  <td className="px-4 py-4 sm:px-5">
                    <Status status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-muted sm:px-5">
                    {row.duration_ms == null ? "—" : row.duration_ms < 1000 ? `${row.duration_ms} ms` : `${(row.duration_ms / 1000).toFixed(1)} s`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted sm:px-5">
                    {new Date(row.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center sm:px-5">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-line-dim bg-ink text-lg text-muted">↗</div>
                    <p className="text-sm font-semibold text-paper">No renders found</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Try another filter, or create your first render from the dashboard.</p>
                    <Link href="/dashboard#render-studio" className="mt-4 inline-flex text-xs font-semibold text-cinnabar hover:underline">Open render studio →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Status({ status }: { status: Row["status"] }) {
  const styles = {
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    error: "border-cinnabar/25 bg-cinnabar/10 text-cinnabar",
    rate_limited: "border-gold/25 bg-gold/10 text-gold",
  } as const;
  const labels = { success: "Success", error: "Error", rate_limited: "Rate limited" } as const;
  return <span className={`status-pill ${styles[status]}`}>{labels[status]}</span>;
}
