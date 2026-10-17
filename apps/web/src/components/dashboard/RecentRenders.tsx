import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RenderLog } from "@/app/dashboard/page";

interface RecentRendersProps {
  renders: RenderLog[];
  totalRendersUsed: number;
}

export function RecentRenders({ renders, totalRendersUsed }: RecentRendersProps) {
  const successCount = renders.filter((r) => r.status === "success").length;
  const successRate =
    renders.length > 0 ? Math.round((successCount / renders.length) * 100) : 0;

  return (
    <section className="rounded border border-line-dim bg-ink-soft p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
          Recent renders
        </span>
        {renders.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-muted">
              Success rate:{" "}
              <span
                className={cn(
                  "font-mono",
                  successRate === 100
                    ? "text-[#4ade80]"
                    : successRate >= 80
                    ? "text-gold"
                    : "text-cinnabar"
                )}
              >
                {successRate}%
              </span>
            </span>
            <span className="font-mono text-[10px] text-muted">
              Total this month:{" "}
              <span className="text-fg">{totalRendersUsed.toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>

      {renders.length === 0 ? (
        /* Empty state */
        <div className="py-10 text-center">
          <div className="mb-3 font-display text-3xl text-line">◌</div>
          <p className="font-mono text-sm text-muted">
            You haven&apos;t made any renders yet.
          </p>
          <p className="mt-1 font-mono text-xs text-line">
            Copy the cURL command above and make your first one in under 30 seconds.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-dim">
                {["Type", "Template", "When", "Status", "Duration"].map(
                  (col) => (
                    <th
                      key={col}
                      className="pb-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {renders.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-line-dim/50",
                    i === renders.length - 1 && "border-none"
                  )}
                >
                  <td className="py-3 pr-4">
                    <span className="rounded bg-ink px-2 py-0.5 font-mono text-[11px] text-muted">
                      {r.type === "template" ? "template" : "url"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-fg">
                    {r.templateId ?? "—"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-muted">
                    {timeAgo(r.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 font-mono text-[11px] text-muted">
                    {r.durationMs != null ? formatDuration(r.durationMs) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 font-mono text-[10px] text-line"><span>Showing last {renders.length} renders.</span><Link href="/dashboard/renders" className="text-cinnabar hover:underline">View full history →</Link></div>
    </section>
  );
}

function StatusBadge({ status }: { status: RenderLog["status"] }) {
  const map = {
    success:      { label: "✓ Success",     cls: "text-[#4ade80]" },
    error:        { label: "✗ Error",        cls: "text-cinnabar" },
    rate_limited: { label: "⊘ Rate limited", cls: "text-gold" },
  } as const;
  const { label, cls } = map[status];
  return <span className={cn("font-mono text-[11px]", cls)}>{label}</span>;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
