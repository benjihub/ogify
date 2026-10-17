# Ogify Production Readiness — Developer Platform Build

This build expands Ogify into a broader developer rendering platform while preserving the existing production endpoints and avoiding destructive infrastructure migrations.

## Implemented in this build

### Core render products

- Built-in social-card template rendering
- URL → PNG/JPEG/WebP
- full-page screenshots
- element screenshots by CSS selector
- HTML/CSS → PNG/JPEG/WebP
- URL → PDF
- HTML/CSS → PDF
- screenshot + branded composite cards
- smart social cards that extract metadata before rendering
- multi-size rendering (up to 6 variants)
- mixed render batches (up to 10 operations)

### Browser controls

- viewport and device scale factor
- `wait_until` and `wait_for_selector`
- custom CSS injection
- page-side custom JavaScript
- dark-mode emulation
- safe custom headers
- custom user agent
- selectors to hide before capture
- cookies, locale, timezone, click and scroll automation
- clip regions, transparent captures, and resource blocking
- private/local URL protection on navigation and intercepted subrequests

### Developer workflow

- reusable HTML templates with escaped `{{variables}}`
- CRUD template API
- asynchronous render jobs
- optional webhook delivery
- optional HMAC webhook signatures
- hosted image/PDF assets
- HMAC-signed on-demand render links that do not expose raw API keys
- page metadata extraction
- hydrated HTML / visible text / resolved-link extraction
- API auth by `x-api-key` or Bearer token
- official TypeScript/JavaScript SDK source
- CLI source
- OpenAPI discovery

### Existing platform features preserved

- legacy binary `/render/template` and `/render/url`
- Supabase API-key validation
- usage tracking and monthly quotas
- KV burst-rate limiting
- request IDs
- render logs
- Paddle exact price mapping + webhook idempotency
- dashboard key/usage/billing views
- live demo endpoint

## Compatibility / infrastructure decisions

This build intentionally does **not** require:

- a new R2 binding
- destructive Supabase migrations
- a new queue product
- DNS changes
- credential rotation
- changes to existing Paddle product IDs

New reusable templates, jobs, hosted generic assets, and render links use the existing Cloudflare KV binding so the feature set can be deployed without an infrastructure migration.

## Important production limitations to understand

### KV is not a permanent media database
Hosted generic assets currently use KV with a finite TTL. This is appropriate for launch and moderate usage but long-term/high-volume delivery should move to R2 + CDN.

### Monthly quota consumption is still check-then-increment
Each successful render increments usage after rendering. For strict high-concurrency accounting, replace this with an atomic reservation/consume RPC before charging overages.

### Browser rendering has real-world variability
Sites can show consent banners, geo-specific pages, login screens, CAPTCHAs, anti-bot pages, or different content to a Cloudflare browser. Ogify captures what the browser receives rather than attempting to bypass access controls.

### Custom JavaScript is powerful
`custom_js` executes inside the isolated browser page, not inside the Worker runtime. It should remain server-side/API-key protected and should never be exposed through an unauthenticated public endpoint.

## Validation performed in the generated artifact

- TypeScript/TSX syntax parser scan: passed across the project
- SDK strict TypeScript check: passed
- API internal strict type-check with external-runtime stubs: passed except expected stub-only Cloudflare/Hono surface gaps
- API core tests: **13 passed, 0 failed**
  - Paddle price mapping
  - Paddle custom-data validation
  - URL/private-host security
  - color validation
  - composite escaping/embedding
  - reusable-template HTML escaping
  - hosted-asset ID/URL stability
  - signed render-link HMAC verification
- API/web package JSON and lockfile top-level dependency consistency: passed
- CLI JavaScript syntax: passed
- archive integrity: should be checked after ZIP creation

Because this environment cannot download npm packages from the registry, run the real dependency-aware checks below on your machine before production deployment.

## Required pre-deploy checks

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

cd ../../packages/sdk
npm install
npm run type-check
npm run build
```

Do **not** blindly run `npm audit fix --force` on the API. npm previously attempted to downgrade `@cloudflare/puppeteer` to an old incompatible line. Keep Cloudflare browser compatibility ahead of making the audit counter reach zero.

## Recommended deployment sequence

1. Validate API typecheck/tests/dry-run.
2. Deploy the Worker.
3. Confirm `/health`.
4. Re-test legacy `/render/template` and `/render/url`.
5. Test `/v1/render/url` with PNG and WebP.
6. Test `/v1/render/html`.
7. Test `/v1/render/pdf`.
8. Test `/v1/extract/metadata` and `/v1/extract/content`.
9. Test `/v1/render/social`.
10. Test reusable templates.
11. Test async job polling and a webhook to your own test endpoint.
12. Test an HMAC-signed on-demand render link.
13. Deploy the web app.
14. Test Render Studio and documentation.
15. Confirm Paddle webhook secret is present before live billing tests.

## Smoke tests

```bash
curl https://api.ogify.online/health

curl -X POST https://api.ogify.online/v1/render/url \
  -H "x-api-key: $OGIFY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"webp","full_page":true}'

curl -X POST https://api.ogify.online/v1/render/html \
  -H "x-api-key: $OGIFY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Hello Ogify</h1>","width":1200,"height":630}'

curl -X POST https://api.ogify.online/v1/render/pdf \
  -H "x-api-key: $OGIFY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"A4"}'

curl -X POST https://api.ogify.online/v1/extract/content \
  -H "x-api-key: $OGIFY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","selector":"main","include_links":true}'

curl -X POST https://api.ogify.online/v1/render/social \
  -H "x-api-key: $OGIFY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ogify.online"}'
```

## Scale-up roadmap after paying demand appears

The next infrastructure upgrades should be demand-driven:

1. R2-backed asset storage and a dedicated image/CDN hostname.
2. Atomic quota reservations + overage billing.
3. Cloudflare Queues for high-volume async jobs and retries.
4. Projects/organizations, scoped keys, and team roles.
5. Python/PHP SDKs and integrations (Zapier/Make/n8n).
6. Visual template editor backed by the existing reusable-template API.
7. Optional image transformation/background-removal service.
