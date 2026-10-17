import type { AsyncJobRecord } from "../types/index.js";

const JOB_PREFIX = "job:";
const TTL = 60 * 60 * 24 * 7;

export async function createJob(kv: KVNamespace, record: Omit<AsyncJobRecord, "id" | "status" | "created_at" | "updated_at">): Promise<AsyncJobRecord> {
  const now = new Date().toISOString();
  const job: AsyncJobRecord = {
    ...record,
    id: `job_${crypto.randomUUID().replace(/-/g, "")}`,
    status: "queued",
    created_at: now,
    updated_at: now,
  };
  await putJob(kv, job);
  return job;
}

export async function getJob(kv: KVNamespace, id: string): Promise<AsyncJobRecord | null> {
  const text = await kv.get(`${JOB_PREFIX}${id}`);
  if (!text) return null;
  try { return JSON.parse(text) as AsyncJobRecord; }
  catch { return null; }
}

export async function putJob(kv: KVNamespace, job: AsyncJobRecord): Promise<void> {
  await kv.put(`${JOB_PREFIX}${job.id}`, JSON.stringify(job), { expirationTtl: TTL });
}

export async function updateJob(kv: KVNamespace, id: string, patch: Partial<AsyncJobRecord>): Promise<AsyncJobRecord | null> {
  const current = await getJob(kv, id);
  if (!current) return null;
  const next: AsyncJobRecord = { ...current, ...patch, id: current.id, updated_at: new Date().toISOString() };
  await putJob(kv, next);
  return next;
}

export async function sendJobWebhook(job: AsyncJobRecord): Promise<void> {
  if (!job.webhook_url) return;
  const safe = { ...job, webhook_secret: undefined };
  const body = JSON.stringify({ event: job.status === "completed" ? "render.completed" : "render.failed", job: safe });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "Ogify-Webhooks/1.0", "X-Ogify-Timestamp": timestamp };
  if (job.webhook_secret) {
    headers["X-Ogify-Signature"] = `v1=${await hmacHex(job.webhook_secret, `${timestamp}.${body}`)}`;
  }
  const response = await fetch(job.webhook_url, { method: "POST", headers, body, redirect: "error" });
  if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
}

async function hmacHex(secret: string, input: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
