# Ogify Production Readiness

This build is a production hardening pass designed to add capabilities without forcing risky infrastructure migrations.

## Implemented in this build

### API reliability

- Request IDs (`X-Request-Id`) on responses and error bodies
- Consistent machine-readable error codes
- `429` for monthly quota exhaustion and burst-rate limits
- Plan-based best-effort edge burst limits using existing KV
- Screenshot viewport/delay/wait validation
- Short-lived screenshot caching
- Failed render logging
- Root API discovery response and enhanced health endpoint

### Rendering

- Worker-safe bundled WASM retained; open-source Inter/JetBrains Mono fonts are installed from pinned Fontsource packages and bundled by Wrangler at build time
- Safe template color overrides (`#RRGGBB`)
- Paid-plan template mark behavior
- Browser screenshots load web fonts/images while blocking media/websocket streams
- Direct private/local URL blocking on initial navigation and intercepted browser requests
- New screenshot + branded-card composite renderer

### Public image delivery

- New versioned JSON render endpoints
- Content-hashed immutable public PNG URLs
- Public images stored in the existing Cloudflare KV binding with one-year TTL
- No new R2 binding is required, avoiding a production deployment dependency

### Dashboard/product

- Real production-safe live template demo
- Dashboard render studio for template, screenshot, and composite flows
- Render-history page with filters
- Corrected feature/pricing claims
- Public image workflow documented

### Billing

- Exact Paddle price mapping retained
- Webhook replay window retained
- Webhook idempotency added using the existing KV binding
- `subscription.resumed` handled with normal subscription activation/update logic

### Discoverability

- Canonical metadata / Open Graph / Twitter metadata
- JSON-LD SoftwareApplication structured data
- `sitemap.xml`
- `robots.txt`
- examples page
- search-intent landing pages for OG-image and screenshot API queries

### CI/operations

- Replaced unrelated Webpack workflow with API and web validation jobs
- API core test step + Cloudflare dry-run step
- web type-check and build step
- public status page backed by `/health`
- request-ID support guidance

## Validation performed for this ZIP

- TypeScript/TSX parser scan: **98 source files, 0 syntax errors**
- API core tests: **8 passed, 0 failed** (Paddle price mapping, custom-data validation, URL/color safety, composite SVG escaping/embedding)
- `package.json` / lockfile JSON parsing: passed
- API `npm ci --dry-run --offline`: passed lockfile/dependency-plan validation
- GitHub Actions YAML parsing: passed
- secret-like token scan outside Git history: no matches
- generated/cache directories and Git history are excluded from the deliverable

A full dependency-aware Next.js build and Wrangler dry-run should still be run after `npm ci` in an internet-enabled environment; the included CI workflow performs those checks on push/PR.

## Intentionally not forced in this build

The following were intentionally left as non-breaking future upgrades because they require infrastructure/database/account changes that should be rolled out separately:

- replacing KV public-image persistence with a dedicated R2/CDN image domain
- atomic database quota reservation across highly concurrent requests
- new database tables for Paddle event storage / richer subscription history
- changing production secrets or rotating credentials
- adding production DNS/custom image-domain bindings
- destructive database migration rewrites

## Recommended deployment sequence

1. Run API type-check and Wrangler dry-run.
2. Deploy Worker and test `/health`.
3. Test existing `/render/template` and `/render/url` binary endpoints.
4. Test `/v1/render/template` and open its returned `image_url` in a browser.
5. Test `/v1/render/url` with a simple public site.
6. Test `/v1/render/composite`.
7. Deploy web app.
8. Verify landing demo, dashboard render studio, docs, sitemap, and status page.
9. Confirm Paddle webhook secret exists in the production Worker before live billing tests.

## Smoke-test commands

```bash
curl https://api.ogify.online/health

curl -X POST https://api.ogify.online/v1/render/template \
  -H "Content-Type: application/json" \
  -H "x-api-key: $OGIFY_KEY" \
  -d '{"template":"blog","title":"Production smoke test","author":"Ogify"}'

curl -X POST https://api.ogify.online/v1/render/url \
  -H "Content-Type: application/json" \
  -H "x-api-key: $OGIFY_KEY" \
  -d '{"url":"https://example.com","viewport_width":1200,"viewport_height":630}'

curl -X POST https://api.ogify.online/v1/render/composite \
  -H "Content-Type: application/json" \
  -H "x-api-key: $OGIFY_KEY" \
  -d '{"url":"https://ogify.online","title":"Ogify production smoke test","brand":"Ogify"}'
```

## Deliberately deferred infrastructure changes

To avoid destabilizing the existing production deployment, this build does not require new Cloudflare bindings or database RPCs. The following are documented scale-up items rather than launch blockers:

- Monthly quota validation still uses the existing check-then-background-increment flow. For strict concurrency enforcement at high volume, move quota consumption into one atomic database RPC.
- Public generated images use the existing KV namespace. KV-backed public image delivery is eventually consistent; move immutable image bodies to R2/CDN when traffic or multi-region consistency requirements justify it.
- Screenshot SSRF controls block obvious local/private destinations and subrequests by hostname. A future high-assurance deployment can add DNS-resolution/IP-range enforcement without changing the public API.

None of these deferred items requires changing the current production database schema or adding a new binding today.
