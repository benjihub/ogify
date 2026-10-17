# Ogify API — Cloudflare Worker

Hono + TypeScript API for social-card templates, website screenshots, composite images, public image delivery, usage tracking, and Paddle webhooks.

## Local setup

```bash
npm ci
cp .dev.vars.example .dev.vars  # then fill in local values
npm run dev
```

Required Worker secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `CACHE_SIGNING_KEY` (reserved for signed-delivery evolution; keep configured)

Normal Worker variables include `SUPABASE_URL`, `OGIFY_ENV`, and the seven Paddle price IDs.

## Stable binary API

### `POST /render/template`

Returns PNG bytes directly.

```json
{
  "template": "blog",
  "title": "My Post",
  "author": "Your Name · site.com",
  "tag": "Tutorial",
  "brand": "Acme",
  "accent_color": "#C73E1D",
  "background_color": "#171E26",
  "width": 1200,
  "height": 630
}
```

### `POST /render/url`

Returns screenshot PNG bytes directly.

```json
{
  "url": "https://example.com",
  "viewport_width": 1200,
  "viewport_height": 630,
  "delay": 500,
  "wait_until": "networkidle0"
}
```

## Versioned API

The `/v1` render endpoints return JSON with an immutable public PNG URL.

### `POST /v1/render/template`

### `POST /v1/render/url`

### `POST /v1/render/composite`

Example response:

```json
{
  "id": "content-hash-id",
  "image_url": "https://api.ogify.online/i/content-hash-id.png",
  "content_type": "image/png",
  "width": 1200,
  "height": 630,
  "cache": "MISS",
  "renders_used": 1,
  "renders_limit": 100
}
```

### `GET /v1/me/usage`

Returns current plan and monthly usage.

## Public images

`GET /i/:id.png` requires no API key so social crawlers can fetch generated images. Public IDs are content hashes, and responses use immutable cache headers.

Public image bytes use the existing Cloudflare KV binding in this build, avoiding a new production binding. R2 can be introduced later behind the same public URL contract.

## Demo renderer

`POST /demo/render/template` is unauthenticated but strongly rate-limited by client IP and fixed to a standard 1200×630 output. It powers the public website playground.

## Request controls

Authenticated requests return short-window rate-limit headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` on 429s

All API responses receive an `X-Request-Id`. JSON errors include `request_id`.

## Screenshot safety

- initial targets must be public `http`/`https` URLs
- common local/private/link-local targets are blocked
- intercepted browser requests to direct private/local hosts are aborted
- viewport and delay values are bounded
- streaming media/websocket requests are skipped
- fonts and normal image assets remain enabled so captures more closely match real pages

## Paddle

`POST /webhooks/paddle` verifies Paddle signatures, rejects stale signatures, maps exact configured price IDs, and uses KV event IDs for webhook idempotency when Paddle supplies an `event_id`.

Handled events include:

- `subscription.activated`
- `subscription.updated`
- `subscription.resumed`
- `subscription.cancelled`
- `subscription.paused`
- `transaction.completed` for configured lifetime purchases

## Validation

```bash
npm run type-check
npm test
npx wrangler deploy --dry-run --env=""
```
