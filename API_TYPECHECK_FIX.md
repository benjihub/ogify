# Ogify API TypeScript compatibility fix

This patch fixes two TypeScript errors caused by newer typed-array/Web Crypto definitions.

Apply from the root of the Ogify repository:

```bash
unzip -o ~/Downloads/ogify-api-typecheck-fix.zip -d .
cd apps/api
npm run type-check
npm test
npx wrangler deploy --dry-run --env=""
```

The changes do not alter API behavior or production configuration. Do not run `npm audit fix --force`; it may downgrade Cloudflare Puppeteer to an incompatible version.
