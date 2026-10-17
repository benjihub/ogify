# Ogify

Ogify turns structured content and public URLs into share-ready PNGs through a developer-friendly API.

## Production capabilities

- Built-in Open Graph/social-card templates (`blog`, `product`, `saas`)
- Website screenshot rendering with Cloudflare Browser Rendering
- Composite rendering: live website screenshot + branded social-card layout
- Immutable public PNG URLs for `og:image`, Twitter cards, Slack, Discord, and CMS integrations
- API-key authentication backed by Supabase
- Monthly usage quotas and best-effort edge burst limits
- Edge caching for templates and screenshots
- Dashboard with key management, usage, render history, billing, and a render studio
- Paddle billing/webhook handling with exact price mapping and webhook idempotency
- Live public template playground with a tightly rate-limited demo endpoint
- OpenAPI discovery at `https://api.ogify.online/openapi.json`
- SEO landing pages, sitemap, robots metadata, and structured data

## Repository structure

- `apps/web` — Next.js customer application, dashboard, pricing, docs, SEO pages
- `apps/api` — Hono + Cloudflare Worker rendering API
- `packages/shared` — shared API response types
- `.github/workflows/ci.yml` — API/web CI validation

## API endpoints

### Existing binary endpoints

- `POST /render/template` → `image/png`
- `POST /render/url` → `image/png`
- `GET /me/usage` → JSON

These remain for backward compatibility.

### Versioned endpoints

- `POST /v1/render/template` → JSON with immutable `image_url`
- `POST /v1/render/url` → JSON with immutable `image_url`
- `POST /v1/render/composite` → JSON with immutable `image_url`
- `GET /v1/me/usage` → JSON
- `GET /i/:id.png` → public generated PNG

### Public/product endpoints

- `GET /health`
- `GET /openapi.json`
- `POST /demo/render/template` — restricted public demo renderer
- `POST /webhooks/paddle`

## Development

See:

- `apps/web/README.md`
- `apps/api/README.md`
- `PRODUCTION_READINESS.md`

## Deployment model

- `ogify.online` → Next.js/Vercel web application
- `api.ogify.online` → Cloudflare Worker
- Supabase → authentication + application data
- Paddle → billing / Merchant of Record
- Cloudflare KV → render cache, public generated PNGs, short-window rate counters, webhook idempotency keys
- Cloudflare Browser Rendering → webpage screenshots

## Compatibility principle

Production-facing binary endpoints were preserved while new behavior was added under `/v1`. This keeps existing integrations stable while enabling crawler-safe public image URLs and composite rendering.
