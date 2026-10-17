"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { generateApiKey, revokeApiKey } from "@/app/dashboard/actions";
import type { ApiKeyDisplay } from "@/app/dashboard/page";

interface ApiKeysPanelProps {
  keys: ApiKeyDisplay[];
}

export function ApiKeysPanel({ keys: initialKeys }: ApiKeysPanelProps) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateApiKey();
        setNewKey(result.key);
        setKeys((prev) => [
          {
            id: result.id,
            keyPreview: result.key.slice(0, 20),
            lastUsedAt: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  async function handleRevoke(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await revokeApiKey(id);
        setKeys((prev) => prev.filter((k) => k.id !== id));
        setRevokeTarget(null);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section id="api-keys" className="rounded-2xl border border-line-dim bg-ink-soft/80 p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-paper">API keys</span>
        <span className="font-mono text-[10px] text-muted">
          {keys.length} active
        </span>
      </div>

      {/* Security warning */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-gold/25 bg-gold/5 px-3.5 py-3">
        <span className="mt-0.5 text-gold">⚠</span>
        <p className="text-xs leading-5 text-muted">
          Your API key is like a password.{" "}
          <span className="text-fg">Never commit it to a public repo.</span> Use
          environment variables in production.
        </p>
      </div>

      {/* Key list */}
      {keys.length === 0 ? (
        <div className="py-8 text-center font-mono text-sm text-muted">
          No keys yet. Generate one below.
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line-dim bg-ink px-3 py-3 sm:px-4"
            >
              <div>
                <div className="break-all font-mono text-xs text-fg sm:text-[13px]">
                  {key.keyPreview
                    ? `${key.keyPreview}••••••••••••`
                    : "ogfy_live_••••••••••••••••••••"}
                </div>
                <div className="mt-1 break-all text-[10px] leading-5 text-muted">
                  ID: {key.id} · Created {formatDate(key.createdAt)}
                  {key.lastUsedAt && ` · Last used ${timeAgo(key.lastUsedAt)}`}
                  {!key.lastUsedAt && " · Never used"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(key.id)}
                className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition hover:bg-cinnabar/10 hover:text-cinnabar"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-lg border border-cinnabar/25 bg-cinnabar/10 p-3 text-sm text-cinnabar">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={isPending}
        className={cn(
          "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cinnabar/50 py-2.5",
          "text-sm font-semibold text-cinnabar transition",
          "hover:bg-cinnabar/10 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {isPending ? "Generating…" : "+ Generate new key"}
      </button>

      {/* ── One-time key reveal modal ─────────────────────── */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="api-key-dialog-title" className="w-full max-w-lg rounded-2xl border border-line-dim bg-ink-soft p-5 shadow-2xl sm:p-6">
            <div id="api-key-dialog-title" className="mb-1 font-display text-lg tracking-tight text-fg">
              Save your API key
            </div>
            <p className="mb-5 text-sm leading-6 text-muted">
              This is shown{" "}
              <span className="text-cinnabar">only once</span>. Copy it into a
              password manager or your{" "}
              <code className="text-fg">.env.local</code> file before dismissing.
            </p>
            <div className="overflow-hidden rounded-xl border border-gold/30 bg-stampInk px-4 py-3">
              <code className="block break-all font-mono text-[13px] text-[#CFE8D9]">
                {newKey}
              </code>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleCopy(newKey, "modal")}
                className={cn(
                  "flex-1 rounded-xl border py-3 text-sm font-semibold transition",
                  copiedId === "modal"
                    ? "border-[#4ade80] text-[#4ade80]"
                    : "border-cinnabar text-cinnabar hover:bg-cinnabar/10"
                )}
              >
                {copiedId === "modal" ? "✓ Copied!" : "Copy key"}
              </button>
              <button
                onClick={() => setNewKey(null)}
                className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold text-muted transition hover:border-fg hover:text-fg"
              >
                I&apos;ve saved it — dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke confirm modal ──────────────────────────── */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="revoke-dialog-title" className="w-full max-w-sm rounded-2xl border border-line-dim bg-ink-soft p-5 shadow-2xl sm:p-6">
            <div id="revoke-dialog-title" className="mb-2 font-display text-lg tracking-tight text-fg">
              Revoke key?
            </div>
            <p className="mb-5 text-sm leading-6 text-muted">
              Any integrations using this key will stop working immediately.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRevoke(revokeTarget)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-cinnabar/40 bg-cinnabar/10 py-3 text-sm font-semibold text-cinnabar transition hover:bg-cinnabar/20 disabled:opacity-50"
              >
                {isPending ? "Revoking…" : "Yes, revoke"}
              </button>
              <button
                onClick={() => setRevokeTarget(null)}
                className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold text-muted transition hover:border-fg hover:text-fg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
