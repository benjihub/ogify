import type { ImageFormat, StoredHtmlTemplate, StoredHtmlTemplateInput } from "../types/index.js";

const ITEM_PREFIX = "html-template:item:";
const INDEX_PREFIX = "html-template:index:";

export async function createStoredTemplate(kv: KVNamespace, userId: string, input: StoredHtmlTemplateInput): Promise<StoredHtmlTemplate> {
  const now = new Date().toISOString();
  const item: StoredHtmlTemplate = {
    id: `tpl_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    name: input.name.trim().slice(0, 80),
    html: input.html,
    css: input.css,
    width: input.width ?? 1200,
    height: input.height ?? 630,
    format: input.format ?? "png",
    created_at: now,
    updated_at: now,
  };
  const key = `${ITEM_PREFIX}${userId}:${item.id}`;
  await kv.put(key, JSON.stringify(item));
  const ids = await readIndex(kv, userId);
  ids.unshift(item.id);
  await kv.put(`${INDEX_PREFIX}${userId}`, JSON.stringify(ids.slice(0, 100)));
  return item;
}

export async function listStoredTemplates(kv: KVNamespace, userId: string): Promise<StoredHtmlTemplate[]> {
  const ids = await readIndex(kv, userId);
  const values = await Promise.all(ids.map((id) => getStoredTemplate(kv, userId, id)));
  return values.filter((item): item is StoredHtmlTemplate => Boolean(item));
}

export async function getStoredTemplate(kv: KVNamespace, userId: string, id: string): Promise<StoredHtmlTemplate | null> {
  const text = await kv.get(`${ITEM_PREFIX}${userId}:${id}`);
  if (!text) return null;
  try { return JSON.parse(text) as StoredHtmlTemplate; }
  catch { return null; }
}

export async function updateStoredTemplate(kv: KVNamespace, userId: string, id: string, patch: Partial<StoredHtmlTemplateInput>): Promise<StoredHtmlTemplate | null> {
  const current = await getStoredTemplate(kv, userId, id);
  if (!current) return null;
  const updated: StoredHtmlTemplate = {
    ...current,
    ...(typeof patch.name === "string" ? { name: patch.name.trim().slice(0, 80) } : {}),
    ...(typeof patch.html === "string" ? { html: patch.html } : {}),
    ...(typeof patch.css === "string" ? { css: patch.css } : {}),
    ...(typeof patch.width === "number" ? { width: patch.width } : {}),
    ...(typeof patch.height === "number" ? { height: patch.height } : {}),
    ...(patch.format ? { format: patch.format as ImageFormat } : {}),
    updated_at: new Date().toISOString(),
  };
  await kv.put(`${ITEM_PREFIX}${userId}:${id}`, JSON.stringify(updated));
  return updated;
}

export async function deleteStoredTemplate(kv: KVNamespace, userId: string, id: string): Promise<boolean> {
  const item = await getStoredTemplate(kv, userId, id);
  if (!item) return false;
  await kv.delete(`${ITEM_PREFIX}${userId}:${id}`);
  const ids = (await readIndex(kv, userId)).filter((value) => value !== id);
  await kv.put(`${INDEX_PREFIX}${userId}`, JSON.stringify(ids));
  return true;
}

export function applyTemplateData(source: string, data: Record<string, string | number | boolean | null> = {}): string {
  return source.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, key: string) => escapeHtml(resolveValue(data, key)));
}

async function readIndex(kv: KVNamespace, userId: string): Promise<string[]> {
  const text = await kv.get(`${INDEX_PREFIX}${userId}`);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").slice(0, 100) : [];
  } catch { return []; }
}

function resolveValue(data: Record<string, string | number | boolean | null>, key: string): string {
  const value = data[key];
  return value == null ? "" : String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
