export interface PublicAssetMeta {
  id: string;
  content_type: string;
  extension: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
}

const BODY_PREFIX = "public-asset:body:";
const META_PREFIX = "public-asset:meta:";

export async function assetContentId(bytes: Uint8Array, _extension?: string): Promise<string> {
  // Copy into an ArrayBuffer-backed view for the Web Crypto BufferSource types.
  const digestInput = new Uint8Array(bytes.byteLength);
  digestInput.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", digestInput.buffer);
  const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Keep the identifier strictly hexadecimal so public routes can validate it
  // independently of the file extension. The extension is stored in metadata.
  return hash.slice(0, 48);
}

export async function persistPublicAsset(
  kv: KVNamespace,
  id: string,
  bytes: Uint8Array,
  meta: Omit<PublicAssetMeta, "id" | "bytes" | "created_at">,
  ttlSeconds = 60 * 60 * 24 * 30,
): Promise<PublicAssetMeta> {
  const complete: PublicAssetMeta = {
    ...meta,
    id,
    bytes: bytes.byteLength,
    created_at: new Date().toISOString(),
  };
  await Promise.all([
    kv.put(`${BODY_PREFIX}${id}`, bytes.buffer as ArrayBuffer, { expirationTtl: ttlSeconds }),
    kv.put(`${META_PREFIX}${id}`, JSON.stringify(complete), { expirationTtl: ttlSeconds }),
  ]);
  return complete;
}

export async function getPublicAsset(kv: KVNamespace, id: string): Promise<{ bytes: Uint8Array; meta: PublicAssetMeta } | null> {
  const [body, metaText] = await Promise.all([
    kv.get(`${BODY_PREFIX}${id}`, "arrayBuffer"),
    kv.get(`${META_PREFIX}${id}`),
  ]);
  if (!body || !metaText) return null;
  try {
    const meta = JSON.parse(metaText) as PublicAssetMeta;
    return { bytes: new Uint8Array(body), meta };
  } catch {
    return null;
  }
}

export function makePublicAssetUrl(requestUrl: string, id: string, extension: string): string {
  const origin = new URL(requestUrl).origin;
  return `${origin}/a/${id}.${extension}`;
}
