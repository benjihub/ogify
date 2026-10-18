const PUBLIC_TTL_SECONDS = 60 * 60 * 24 * 365;
const PUBLIC_READ_CACHE_TTL_SECONDS = 30;

export function publicImageKey(id: string): string {
  return `public-image:${id}`;
}

export async function persistPublicImage(
  kv: KVNamespace,
  id: string,
  png: Uint8Array
): Promise<void> {
  await kv.put(publicImageKey(id), toArrayBuffer(png), {
    expirationTtl: PUBLIC_TTL_SECONDS,
  });
}

export async function getPublicImage(
  kv: KVNamespace,
  id: string
): Promise<Uint8Array | null> {
  const value = await kv.get(publicImageKey(id), { type: "arrayBuffer", cacheTtl: PUBLIC_READ_CACHE_TTL_SECONDS });
  return value ? new Uint8Array(value) : null;
}

export function makePublicImageUrl(requestUrl: string, id: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/i/${id}.png`;
}

export async function imageContentId(png: Uint8Array): Promise<string> {
  const slice = png.byteOffset === 0 && png.byteLength === png.buffer.byteLength
    ? png.buffer
    : png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", slice as ArrayBuffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
