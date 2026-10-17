import test from "node:test";
import assert from "node:assert/strict";
import { assetContentId, makePublicAssetUrl } from "./public-assets.ts";

test("public asset IDs are stable hexadecimal hashes independent of extension", async () => {
  const bytes = new TextEncoder().encode("ogify-public-asset");
  const pngId = await assetContentId(bytes, "png");
  const pdfId = await assetContentId(bytes, "pdf");

  assert.match(pngId, /^[a-f0-9]{48}$/);
  assert.equal(pngId, pdfId);
});

test("public asset URLs keep the extension outside the asset ID", () => {
  const id = "a".repeat(48);
  assert.equal(
    makePublicAssetUrl("https://api.ogify.online/v1/render/html", id, "webp"),
    `https://api.ogify.online/a/${id}.webp`,
  );
});
