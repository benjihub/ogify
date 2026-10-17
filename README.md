# Ogify — Render API for developers

Ogify turns URLs, HTML, templates, and page metadata into production-ready images and PDFs. It is designed for developers who do not want to run Chromium fleets, maintain image-generation infrastructure, or build their own social-card pipeline.

## What this build includes

### Rendering
- Built-in social-card templates (`blog`, `product`, `saas`)
- URL → PNG / JPEG / WebP
- Full-page screenshots
- Element screenshots with CSS selectors
- HTML + CSS → PNG / JPEG / WebP
- URL → PDF
- Rendered page → metadata / hydrated HTML / visible text / Markdown / links
- Structured extraction by CSS selector rules
- Brand profile and normalized link-preview extraction
- HTML + CSS → PDF
- Best-effort PDF text extraction; optional PDF-to-image/thumbnails service
- Screenshot + branded composite cards
- Smart social cards: URL metadata + screenshot + branded composition
- Multi-size rendering (up to 6 variants)
- Mixed batch rendering (up to 10 operations)

### Browser controls
- viewport and device scale factor
- wait strategy + wait-for-selector
- custom CSS injection
- page-side custom JavaScript
- custom user agent, safe headers, and cookies
- locale and timezone emulation
- click + scroll automation, clip regions, and transparent captures
- optional resource blocking and ad/tracker URL blocking
- device presets with mobile/touch emulation and DPR scaling
- locale, timezone, country-profile and browser geolocation emulation
- cookie-banner / popup cleanup heuristics and optional accept-button click
- dark-mode emulation and selectors to hide before capture
- private/local host protections on page requests
- customer proxy routing adapter when `PROXY_RENDERER` is configured

### Developer platform
- Hosted render asset URLs
- HMAC-signed on-demand render links that do not expose API keys
- Reusable HTML templates with `{{variables}}` and dashboard visual editor
- Saved render collections for reusable multi-size campaigns
- Project CRUD and API-key scopes / expiry / origin / IP policies
- Bounded browser action sequences
- Async render jobs with processing retry
- Completion webhooks with HMAC signatures, retries, delivery logs and dead-letter records
- Customer S3/R2 export via presigned PUT URL
- Optional video and PDF page-conversion service adapters
- Render usage + rate-limit headers
- API key auth by `x-api-key` or Bearer token
- OpenAPI discovery
- Official TypeScript/JavaScript SDK source under `packages/sdk`
- CLI under `packages/cli`

### Product application
- Next.js landing site and documentation
- Dashboard API-key management
- Usage and render history
- Render Studio supporting template, screenshot, social, HTML, and PDF workflows
- Paddle billing integration
- Supabase auth/data

## Main endpoints

### Backward compatible
- `POST /render/template` → PNG binary
- `POST /render/url` → PNG binary
- `GET /me/usage`

### Versioned developer API
- `POST /v1/render/template`
- `POST /v1/render/url`
- `POST /v1/render/html`
- `POST /v1/render/pdf`
- `POST /v1/render/composite`
- `POST /v1/render/social`
- `POST /v1/render/multi`
- `POST /v1/render/batch`
- `POST /v1/extract/metadata`
- `POST /v1/extract/content`
- `POST /v1/extract/markdown`
- `POST /v1/extract/structured`
- `POST /v1/extract/brand`
- `POST /v1/preview/link`
- `POST /v1/browser/run`
- `POST /v1/render/video` (optional service binding)
- `POST /v1/documents/pdf-to-text`
- `POST /v1/documents/pdf-to-images` and `/pdf-thumbnails` (optional service binding)
- `GET|POST|PUT|DELETE /v1/templates`
- `POST /v1/templates/:id/render`
- `POST /v1/jobs`
- `GET /v1/jobs/:id`
- `POST /v1/render-links`
- `GET|POST|PUT|DELETE /v1/projects`
- `GET|PUT /v1/api-keys/:id/policy`
- `GET|POST|DELETE /v1/collections`
- `POST /v1/collections/:id/render`
- `POST /v1/storage/export`
- `GET /v1/devices`, `/v1/countries`, `/v1/capabilities`
- `GET /v1/me/usage`

### Public delivery
- `GET /i/:id.png` — legacy generated PNGs
- `GET /a/:asset` — hosted images/PDFs
- `GET /r/:id` — on-demand render links

## Repository

- `apps/api` — Hono + Cloudflare Worker API
- `apps/web` — Next.js customer site/dashboard/docs
- `packages/sdk` — official JS/TS SDK source
- `packages/cli` — CLI source
- `packages/shared` — shared types

## Production stack

- Vercel — web app
- Cloudflare Workers + Browser Run — render API and browser automation
- Cloudflare KV — render cache, hosted assets, template definitions, jobs, projects, key policies, collections and short-window limits
- Optional Cloudflare service bindings — customer proxy renderer, video renderer and document conversion service
- Supabase — auth, API-key hashes, subscriptions, usage, render logs
- Paddle — Merchant of Record / subscription billing

## Validate before deploy

```bash
cd apps/api
npm ci
npm run type-check
npm test
npx wrangler deploy --dry-run --env=""

cd ../web
npm ci
npm run type-check
npm run build
```

See `FEATURE_MATRIX.md`, `DEVELOPER_PLATFORM.md`, `UI_UX_REFRESH.md`, and `PRODUCTION_READINESS.md` before deploying.

## Advanced feature deployment

See [`ADVANCED_FEATURES_DEPLOYMENT.md`](./ADVANCED_FEATURES_DEPLOYMENT.md) for the exact validation/deployment sequence, optional service-binding requirements, and known production boundaries.
