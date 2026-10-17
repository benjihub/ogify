/**
 * SVG → PNG rendering via @resvg/resvg-wasm.
 *
 * The WASM module must be initialised once before use. Cloudflare Workers
 * require the module to be bundled and precompiled rather than dynamically
 * compiled from fetched bytes.
 */
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

let initialized = false;
let initialization: Promise<void> | undefined;

async function initOnce(): Promise<void> {
  if (initialized) return;
  initialization ??= (async () => {
    await initWasm(resvgWasm);
    initialized = true;
  })();
  await initialization;
}

export interface SvgToPngOptions {
  width?: number;
  height?: number;
}

/**
 * Converts an SVG string to a PNG `Uint8Array`.
 */
export async function svgToPng(
  svg: string,
  { width = 1200, height = 630 }: SvgToPngOptions = {}
): Promise<Uint8Array> {
  await initOnce();

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "transparent",
    font: { loadSystemFonts: false },
  });

  return resvg.render().asPng();
}

// ── Cache-key helper ──────────────────────────────────────────────────────

/**
 * Derives a deterministic hex cache key from the render inputs.
 */
export async function cacheKey(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload);
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(json)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
