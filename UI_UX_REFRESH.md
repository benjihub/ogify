# Ogify UI/UX refresh

This package includes a visual and interaction refresh for the existing Ogify Next.js frontend. The API routes, Supabase auth flows, Paddle checkout integration, and Cloudflare Worker behavior are unchanged.

## What changed

- Replaced the old high-contrast, all-caps visual treatment with a cleaner developer SaaS design system, consistent spacing, rounded surfaces, improved typography, clearer contrast, and matching light/dark palettes.
- Reworked the landing page hero, feature cards, call-to-action panel, examples, pricing layout, and SEO landing pages to scale more gracefully across screen sizes.
- Added responsive navigation menus for the public site and authenticated dashboard; added a collapsible documentation topic list for mobile.
- Improved the authenticated dashboard's hierarchy, stats cards, render studio, template editor, projects/key policies, usage chart, render history, and API-key modals.
- Improved login and signup layouts without changing Supabase authentication behavior.
- Added more consistent input focus rings, button disabled states, visible keyboard focus, status/error feedback, reduced-motion handling, and mobile-friendly overflow for code/table content.
- Updated accent colors so primary buttons and text links have better contrast in their respective themes.

## Install safely

1. Back up your current repository and keep the current production deployment untouched until validation passes.
2. Copy the updated `apps/web/src`, `apps/web/tailwind.config.ts`, and `apps/web/src/app/globals.css` into the existing repository, or review the complete source package before replacing files.
3. Preserve `.env.local`, Cloudflare `.dev.vars`, Cloudflare secrets, Vercel environment variables, and all deployment settings. Do not overwrite them with example files.
4. In `apps/web`, run `npm ci`, `npm run type-check`, and `npm run build` using the Node version used for your production deployment.
5. Preview on mobile, tablet, and desktop in both dark and light themes before deploying.

This package has not been deployed to production. The dependency-aware Next.js build must be run in an environment with the project dependencies available before release.
