# Ogify

Generate Open Graph images and website screenshots through a developer-friendly API.

Ogify is a SaaS platform for creating social preview images programmatically. It combines a Next.js web application with a Cloudflare Worker rendering API, authentication, storage and subscription billing.

## Features

- Open Graph image generation
- Template-based rendering
- Website screenshot generation
- Developer API
- API-key authentication
- Documentation interface
- User authentication
- Subscription billing
- Supabase-backed application data
- Cloudflare-based rendering infrastructure

## Technology

### Web Application

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Paddle

### Rendering API

- Hono
- TypeScript
- Cloudflare Workers
- Cloudflare Puppeteer
- Resvg WASM
- Supabase

## Repository Structure

- `apps/web` — Next.js customer-facing application
- `apps/api` — Cloudflare Worker rendering API
- `packages/shared` — shared TypeScript types
- `turbo.json` — monorepo task configuration

## Architecture

The web application handles authentication, billing, account management and product documentation.

The Cloudflare Worker API handles image rendering and website screenshot generation.

Shared contracts and types are maintained in the shared workspace.

## Development

Development instructions are available in:

- `apps/web/README.md`
- `apps/api/README.md`

## Product Goal

Ogify is designed for developers and teams that need consistent social preview images without maintaining their own screenshot or image-rendering infrastructure.
