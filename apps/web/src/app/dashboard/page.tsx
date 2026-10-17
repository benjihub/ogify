import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { PlanId } from "@/lib/paddle";
import { StatCards } from "@/components/dashboard/StatCards";
import { Quickstart } from "@/components/dashboard/Quickstart";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { ApiKeysPanel } from "@/components/dashboard/ApiKeysPanel";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import { RecentRenders } from "@/components/dashboard/RecentRenders";
import { TemplateGallery } from "@/components/dashboard/TemplateGallery";
import { RenderStudio } from "@/components/dashboard/RenderStudio";

// ── Shared types (used by child components) ───────────────────────────────

export interface ApiKeyDisplay {
  id: string;
  keyPreview: string | null;   // first 20 chars of raw key — safe to show
  lastUsedAt: string | null;
  createdAt: string;
}

export interface SubscriptionDisplay {
  plan: PlanId;
  rendersLimit: number;
  status: string;
  currentPeriodEnd: string | null;
}

export interface DailyUsage {
  date: string;   // YYYY-MM-DD
  count: number;
}

export interface RenderLog {
  id: string;
  type: "template" | "url";
  templateId: string | null;
  status: "success" | "error" | "rate_limited";
  durationMs: number | null;
  createdAt: string;
}

interface RenderLogRow {
  id: string;
  type: RenderLog["type"];
  template_id: string | null;
  status: RenderLog["status"];
  duration_ms: number | null;
  created_at: string;
}

function buildDailyUsage(rows: Pick<RenderLogRow, "created_at">[]): DailyUsage[] {
  const now = new Date();
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const date = row.created_at.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  });

  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });
}

function mapRenderLog(row: RenderLogRow): RenderLog {
  return {
    id: row.id,
    type: row.type,
    templateId: row.template_id,
    status: row.status,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const period = new Date().toISOString().slice(0, 7);

  // Parallel data fetches
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    { data: subRow },
    { data: usageRow },
    { data: keyRows },
    { data: recentRenderRows },
    { data: chartRenderRows },
  ] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, renders_limit, status, current_period_end")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("usage")
        .select("renders_used")
        .eq("user_id", user.id)
        .eq("period", period)
        .single(),
      supabase
        .from("api_keys")
        .select("id, key_preview, last_used_at, created_at")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("render_logs")
        .select("id, type, template_id, status, duration_ms, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("render_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString()),
    ]);

  const subscriptionActive = subRow?.status === "active";
  const subscription: SubscriptionDisplay = {
    plan:             subscriptionActive ? ((subRow?.plan as PlanId) ?? "free") : "free",
    rendersLimit:     subscriptionActive ? (subRow?.renders_limit ?? 100) : 100,
    status:           subRow?.status ?? "active",
    currentPeriodEnd: subscriptionActive ? (subRow?.current_period_end ?? null) : null,
  };

  const rendersUsed = usageRow?.renders_used ?? 0;

  const apiKeys: ApiKeyDisplay[] = (keyRows ?? []).map((k) => ({
    id:          k.id,
    keyPreview:  k.key_preview ?? null,
    lastUsedAt:  k.last_used_at ?? null,
    createdAt:   k.created_at,
  }));

  const firstName =
    (user.email?.split("@")[0] ?? "there")
      .split(".")
      .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isNewUser = rendersUsed < 5;
  const dailyData = buildDailyUsage(chartRenderRows ?? []);
  const recentRenders = ((recentRenderRows ?? []) as RenderLogRow[]).map(mapRenderLog);

  return (
    <div className="space-y-8">
      {/* ── Welcome ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Workspace overview</p>
          <h1 className="dashboard-page-title text-paper">Welcome back, {firstName}.</h1>
          <p className="mt-2 text-sm text-muted">Your rendering workspace at a glance · Member since {memberSince}</p>
        </div>
        <a href="#render-studio" className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-lg border border-line-dim bg-ink-soft px-4 py-2 text-sm font-semibold text-paper transition hover:border-line hover:bg-ink-soft/70">
          <span aria-hidden="true" className="text-cinnabar">＋</span> Create a render
        </a>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <StatCards
        subscription={subscription}
        rendersUsed={rendersUsed}
        period={period}
        apiKeys={apiKeys}
      />

      {/* ── Quickstart ─────────────────────────────────── */}
      <Quickstart
        isNewUser={isNewUser}
        keyPreview={apiKeys[0]?.keyPreview ?? null}
      />

      {/* ── Render studio ──────────────────────────────── */}
      <RenderStudio />

      {/* ── Usage chart ────────────────────────────────── */}
      <UsageChart
        data={dailyData}
        rendersUsed={rendersUsed}
        rendersLimit={subscription.rendersLimit}
      />

      {/* ── Keys + Billing ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiKeysPanel keys={apiKeys} />
        <BillingPanel
          subscription={subscription}
          userEmail={user.email ?? ""}
        />
      </div>

      {/* ── Recent renders ─────────────────────────────── */}
      <RecentRenders renders={recentRenders} totalRendersUsed={rendersUsed} />

      {/* ── Template gallery ───────────────────────────── */}
      <TemplateGallery />
    </div>
  );
}
