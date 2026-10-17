"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DailyUsage } from "@/app/dashboard/page";

interface UsageChartProps {
  data: DailyUsage[];
  rendersUsed: number;
  rendersLimit: number;
}

export function UsageChart({ data, rendersUsed, rendersLimit }: UsageChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const avg = data.length > 0 ? total / data.length : 0;
  const peak =
    data.length > 0
      ? data.reduce((best, d) => (d.count > best.count ? d : best), data[0])
      : { date: new Date().toISOString().slice(0, 10), count: 0 };
  const pct = Math.round((rendersUsed / rendersLimit) * 100);
  const barColor = pct >= 80 ? "#F05A3A" : pct >= 50 ? "#F8C45A" : "#34D399";

  const projectedMonthEnd = Math.round(avg * 30);
  const projectedPct = Math.min(100, Math.round((projectedMonthEnd / rendersLimit) * 100));

  return (
    <div className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-paper">Usage history <span className="font-normal text-muted">· past 30 days</span></div>
          <div className="mt-1 text-xs leading-5 text-muted">
            Peak: <span className="text-fg">{peak.count} renders</span> on{" "}
            {new Date(peak.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" · "}
            Avg: <span className="text-fg">{avg.toFixed(0)}/day</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">
            Projected month-end
          </div>
          <div
            className={cn(
              "mt-0.5 text-xs font-semibold",
              projectedPct >= 100 ? "text-cinnabar" : "text-fg"
            )}
          >
            {projectedPct}% of limit
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${data.length * 18} 80`}
          className="w-full"
          style={{ height: "80px" }}
          onMouseLeave={() => setHovered(null)}
        >
          {data.map((d, i) => {
            const barH = max > 0 ? Math.max(2, (d.count / max) * 68) : 2;
            const x = i * 18 + 2;
            const y = 72 - barH;
            return (
              <rect
                key={d.date}
                x={x}
                y={y}
                width={14}
                height={barH}
                rx={2}
                fill={i === hovered ? barColor : `${barColor}88`}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHovered(i)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered !== null && (
          <div
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded border border-line-dim bg-ink px-3 py-1.5"
            style={{ left: `${(hovered * 18 + 9) / (data.length * 18) * 100}%` }}
          >
            <div className="font-mono text-[11px] text-fg">
              {data[hovered].count} renders
            </div>
            <div className="font-mono text-[10px] text-muted">
              {new Date(data[hovered].date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        )}
      </div>

      {/* X-axis labels — first and last */}
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>
          {data[0]
            ? new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "No data"}
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}
