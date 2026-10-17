import test from "node:test";
import assert from "node:assert/strict";
import { applyTemplateData } from "./stored-templates.ts";

test("stored template variables are HTML escaped", () => {
  const html = applyTemplateData("<h1>{{title}}</h1><p>{{count}}</p>", { title: '<script>alert("x")</script>', count: 3 });
  assert.equal(html, "<h1>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</h1><p>3</p>");
});

test("unknown stored template variables become empty strings", () => {
  assert.equal(applyTemplateData("<p>{{missing}}</p>", {}), "<p></p>");
});
