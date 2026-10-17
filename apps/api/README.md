# Ogify API

Hono + TypeScript on Cloudflare Workers, with Cloudflare Browser Run, Resvg, Supabase, KV, and Paddle.

## Core render endpoints

| Endpoint | Purpose |
|---|---|
| `POST /v1/render/template` | Built-in social-card templates |
| `POST /v1/render/url` | URL → PNG/JPEG/WebP |
| `POST /v1/render/html` | HTML/CSS → PNG/JPEG/WebP |
| `POST /v1/render/pdf` | URL or HTML → PDF |
| `POST /v1/render/composite` | Screenshot + branded social layout |
| `POST /v1/render/social` | URL metadata + screenshot + branded social layout |
| `POST /v1/render/multi` | Up to six size variants |
| `POST /v1/render/batch` | Up to ten mixed render operations |
| `POST /v1/extract/metadata` | Rendered page metadata extraction |

## Developer platform endpoints

- `GET|POST|PUT|DELETE /v1/templates`
- `POST /v1/templates/:id/render`
- `POST /v1/jobs`
- `GET /v1/jobs/:id`
- `POST /v1/render-links`
- `GET /v1/me/usage`
- `GET /openapi.json`

## Authentication

Use either:

```http
x-api-key: ogfy_live_...
```

or:

```http
Authorization: Bearer ogfy_live_...
```

## Advanced screenshots

`/v1/render/url` supports:
- full-page screenshots
- element screenshots (`selector`)
- PNG/JPEG/WebP
- quality control
- custom CSS
- page-side custom JS
- wait-for-selector
- dark mode
- user-agent override
- safe custom headers
- hide selectors
- device scale factor

## Async jobs and webhooks

Create a job:

```json
{
  "kind": "pdf",
  "payload": { "url": "https://example.com/report" },
  "webhook_url": "https://app.example.com/webhooks/ogify",
  "webhook_secret": "your-secret"
}
```

When a webhook secret is provided, the body is signed with HMAC-SHA256 in `X-Ogify-Signature` over `timestamp.body`, where the timestamp is in `X-Ogify-Timestamp`.

## Reusable HTML templates

Create a template with HTML such as:

```html
<h1>{{title}}</h1>
<p>{{version}}</p>
```

Then render it through `/v1/templates/:id/render` with:

```json
{ "data": { "title": "Launch", "version": "2.0" } }
```

Substituted values are HTML escaped.

## Local validation

```bash
npm ci
npm run type-check
npm test
npx wrangler deploy --dry-run --env=""
```

Do not run `npm audit fix --force` blindly: npm may propose a breaking downgrade of Cloudflare Puppeteer. Review security advisories and Cloudflare compatibility before changing browser packages.
