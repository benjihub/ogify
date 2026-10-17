/**
 * SVG → PNG rendering via @resvg/resvg-wasm.
 *
 * Cloudflare Workers require WASM to be bundled as a precompiled module.
 * Fonts are sourced from Fontsource npm packages at install/build time and
 * bundled by Wrangler as Data modules; no runtime network fetch is used.
 */
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import interRegular from "@fontsource/inter/files/inter-latin-400-normal.woff2";
import interSemibold from "@fontsource/inter/files/inter-latin-600-normal.woff2";
import jetbrainsMonoRegular from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2";

let initialized = false;
let initialization: Promise<void> | undefined;

const fontBuffers = [
  new Uint8Array(interRegular),
  new Uint8Array(interSemibold),
  new Uint8Array(jetbrainsMonoRegular),
];

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

/** Converts a self-contained SVG string to PNG bytes. */
export async function svgToPng(
  svg: string,
  { width = 1200, height = 630 }: SvgToPngOptions = {}
): Promise<Uint8Array> {
  await initOnce();

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "transparent",
    font: {
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
      sansSerifFamily: "Inter",
      monospaceFamily: "JetBrains Mono",
      fontBuffers,
    },
  });

  return resvg.render().asPng();
}

/** Derives a deterministic SHA-256 hex cache key from render inputs. */
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
