import type { RenderLinkRecord } from "../types/index.js";

const PREFIX = "render-link:";
const RESULT_PREFIX = "render-link-result:";

export async function createRenderLink(
  kv: KVNamespace,
  input: Omit<RenderLinkRecord, "id" | "created_at" | "expires_at" | "result_url">,
): Promise<RenderLinkRecord> {
  const now = new Date();
  const maxTtl = 60 * 60 * 24 * 30;
  const ttl = Math.min(maxTtl, Math.max(60, input.expires_in_seconds ?? 60 * 60 * 24 * 7));
  const record: RenderLinkRecord = {
    ...input,
    id: `rl_${crypto.randomUUID().replace(/-/g, "")}`,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttl * 1000).toISOString(),
  };
  await kv.put(`${PREFIX}${record.id}`, JSON.stringify(record), { expirationTtl: ttl });
  return record;
}

export async function getRenderLink(kv: KVNamespace, id: string): Promise<RenderLinkRecord | null> {
  const text = await kv.get(`${PREFIX}${id}`);
  if (!text) return null;
  try { return JSON.parse(text) as RenderLinkRecord; }
  catch { return null; }
}

export async function getRenderLinkResult(kv: KVNamespace, id: string): Promise<string | null> {
  return kv.get(`${RESULT_PREFIX}${id}`);
}

export async function saveRenderLinkResult(kv: KVNamespace, id: string, url: string, expiresAt: string): Promise<void> {
  const ttl = Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  await kv.put(`${RESULT_PREFIX}${id}`, url, { expirationTtl: ttl });
}

export async function signRenderLink(id: string, expiresAt: string, secret: string): Promise<{ exp: number; signature: string }> {
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000);
  const signature = await hmacHex(`${id}.${exp}`, secret);
  return { exp, signature };
}

export async function verifyRenderLinkSignature(id: string, exp: number, signature: string, secret: string): Promise<boolean> {
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000) || exp > Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 31) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = await hmacHex(`${id}.${exp}`, secret);
  return constantTimeEqual(expected, signature.toLowerCase());
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
