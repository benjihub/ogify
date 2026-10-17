import assert from "node:assert/strict";
import { test } from "node:test";
import { renderCompositeSvg } from "./composite.ts";

test("composite SVG embeds screenshot and escapes user content", () => {
  const svg = renderCompositeSvg({
    screenshot: new Uint8Array([137, 80, 78, 71]),
    title: "Hello <world>",
    author: "A & B",
    width: 1200,
    height: 630,
    showOgifyMark: true,
  });
  assert.match(svg, /data:image\/png;base64/);
  assert.match(svg, /Hello &lt;world&gt;/);
  assert.match(svg, /A &amp; B/);
  assert.match(svg, /OGIFY/);
});
