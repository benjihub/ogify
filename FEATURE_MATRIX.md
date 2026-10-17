# Ogify Developer Platform — Feature Matrix

## Implemented in this build

| Area | Capability |
|---|---|
| Screenshot API | viewport, full-page, element, clip-region captures |
| Screenshot output | PNG, JPEG, WebP |
| Browser control | delay, wait strategy, wait selector, device scale factor |
| Browser automation | custom CSS, custom JS, click selector, scroll position |
| Session/localization | safe headers, user agent, cookies, locale, timezone, dark mode |
| Performance controls | hide selectors and optional image/stylesheet/font/media/script blocking |
| HTML rendering | HTML + CSS → PNG/JPEG/WebP |
| PDF rendering | URL or HTML → A4/Letter/Legal/A3 PDF, margins, landscape, print backgrounds |
| Social automation | URL metadata → screenshot → branded social card |
| Composite rendering | live website screenshot embedded in branded template |
| Built-in templates | blog, product, SaaS with brand/accent/background overrides |
| Reusable templates | stored HTML/CSS templates with escaped variables and CRUD API |
| Multi-size | up to six output variants per request |
| Batch API | up to ten mixed render operations |
| Async jobs | background rendering, job status, webhook callback |
| Webhooks | optional HMAC-signed completion webhooks |
| Public assets | hosted image/PDF URLs with ETag/cache headers |
| Signed render links | HMAC-signed expiring public links; lazy render + redirect to cached result |
| Metadata extraction | title, description, canonical, OG image, favicon, theme color, locale |
| Content extraction | hydrated HTML, visible text, scoped selector, resolved links |
| API auth | x-api-key and Bearer token |
| Developer tooling | OpenAPI endpoint, JS/TS SDK, CLI |
| Product tooling | dashboard Render Studio, render history, docs, examples, SEO pages |
| Reliability | request IDs, quota headers, rate limits, render logs, consistent API errors |
| Security | public URL validation and browser subrequest blocking for direct private/local hosts |
| Compatibility | legacy /render/template, /render/url and /me/usage retained |

## Deliberately not bundled into this production-safe build

These require separate infrastructure, a new abuse/cost model, or database migrations and should be added only when demand justifies them:

- MP4/WebM browser video recording and video editing
- managed proxy/geo-routing network, stealth browsing, or CAPTCHA/anti-bot bypass
- GPU render fleet
- AVIF/SVG webpage capture where the current Cloudflare screenshot API does not natively return it
- S3/customer-bucket uploads and permanent R2/CDN storage
- visual drag-and-drop template editor / Figma-style layer editor
- template version history/rollback
- organizations, team roles, and fine-grained/scoped API keys
- background removal and general image transformation pipeline
- Python, PHP, Ruby, and Go SDK packages
- Zapier/Make/n8n/WordPress first-party integrations
- generative-AI image creation

The current API contracts intentionally leave room for those additions without replacing the core `/v1` rendering API.
