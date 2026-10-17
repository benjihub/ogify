import test from "node:test";
import assert from "node:assert/strict";
import { signRenderLink, verifyRenderLinkSignature } from "./render-links.ts";

test("render links use expiring HMAC signatures", async () => {
  const secret = "test-signing-secret-123456789";
  const expires = new Date(Date.now() + 60_000).toISOString();
  const signed = await signRenderLink("rl_test", expires, secret);

  assert.match(signed.signature, /^[a-f0-9]{64}$/);
  assert.equal(await verifyRenderLinkSignature("rl_test", signed.exp, signed.signature, secret), true);
  assert.equal(await verifyRenderLinkSignature("rl_other", signed.exp, signed.signature, secret), false);
});
