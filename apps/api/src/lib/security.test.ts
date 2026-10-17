import assert from "node:assert/strict";
import { test } from "node:test";
import { isPrivateHost, isSafeHexColor, parsePublicHttpUrl } from "./security.ts";

test("blocks local and private hosts", () => {
  for (const host of ["localhost", "127.0.0.1", "10.0.0.1", "192.168.1.1", "172.16.0.1", "app.internal", "host.local"]) {
    assert.equal(isPrivateHost(host), true, host);
  }
  assert.equal(isPrivateHost("example.com"), false);
});

test("accepts only public http(s) urls", () => {
  assert.equal(parsePublicHttpUrl("https://example.com/path").hostname, "example.com");
  assert.throws(() => parsePublicHttpUrl("file:///etc/passwd"));
  assert.throws(() => parsePublicHttpUrl("http://127.0.0.1/admin"));
});

test("validates strict six-digit hex colors", () => {
  assert.equal(isSafeHexColor("#C73E1D"), true);
  assert.equal(isSafeHexColor("#fff"), false);
  assert.equal(isSafeHexColor("red"), false);
});
