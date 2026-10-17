# Ogify Web App

Next.js + TypeScript + Tailwind + Supabase + Paddle frontend for Ogify.

## Production areas

- landing page with real rate-limited template playground
- pricing / Paddle checkout
- Supabase login/signup/session handling
- dashboard key management and usage data
- dashboard Render Studio for template/screenshot/composite requests
- render history
- API documentation
- public examples
- SEO landing pages
- sitemap / robots / structured metadata
- status page backed by the API health endpoint

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://api.ogify.online
NEXT_PUBLIC_PADDLE_ENV=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY=
NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY=
NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY=
NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY=
NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_MONTHLY=
NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_YEARLY=
NEXT_PUBLIC_PADDLE_PRICE_LIFETIME=
```

Never expose Supabase service-role credentials or Paddle webhook secrets in the web app.

## Validation

```bash
npm ci
npm run type-check
npm run build
```
