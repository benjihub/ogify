# @ogify/sdk

Official JavaScript/TypeScript client for Ogify.

```bash
npm install @ogify/sdk
```

```ts
import { Ogify } from "@ogify/sdk";

const ogify = new Ogify({ apiKey: process.env.OGIFY_API_KEY! });

const screenshot = await ogify.render.screenshot({
  url: "https://example.com",
  full_page: true,
  format: "webp",
  locale: "en-US",
  timezone: "Africa/Kampala",
  click_selector: ".accept-cookies",
});

console.log(screenshot.url);
```

Other high-level methods include `render.html`, `render.pdf`, `render.social`, `render.composite`, `render.multi`, `render.batch`, `metadata`, `content`, reusable `templates`, async `jobs`, and signed `renderLinks`.
