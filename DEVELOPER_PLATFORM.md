# Ogify Developer Platform feature map

This build intentionally focuses on features developers already understand and pay for in rendering platforms: screenshots, HTML-to-image, PDFs, hosted assets, rendered page extraction, reusable templates, asynchronous jobs, webhooks, batch work, browser controls, signed render links, and client tooling.

## Recommended product positioning

**Render anything. One API.**

Screenshots, HTML-to-image, PDFs, dynamic social cards, reusable templates, and hosted render assets for developers.

## High-value workflows

### URL → screenshot
Use `/v1/render/url` for viewport, full-page, or element screenshots. PNG, JPEG, and WebP are supported.

### HTML → image
Use `/v1/render/html` to turn application-generated HTML/CSS into a hosted image. This is useful for receipts, product cards, dashboard snapshots, certificates, social media images, and email graphics.

### URL or HTML → PDF
Use `/v1/render/pdf` for invoices, reports, tickets, contracts, certificates, and printable pages.

### URL → smart social card
Use `/v1/render/social`. Ogify extracts metadata, captures the page, and creates a social card without requiring the caller to manually provide the title/site name.

### Saved template → many images
Create an HTML template under `/v1/templates`, then render it repeatedly with variable data. Template variables are HTML-escaped.

### Batch or asynchronous rendering
Use `/v1/render/batch` for small synchronous batches. Use `/v1/jobs` for background rendering and optional webhooks.

### Signed render links
Create a render link with `/v1/render-links`. The public URL carries an HMAC signature and expiry, lazily renders once, and redirects to the cached hosted asset without exposing an API key.

### Rendered content extraction
Use `/v1/extract/content` for hydrated HTML, visible text, and resolved links after JavaScript executes. Browser controls include cookies, locale, timezone, click, scroll, custom CSS/JS, and safe resource blocking.

## Current deliberate boundaries

This package does not attempt to become a full video editor, generative-AI image model, Figma clone, proxy network, anti-bot bypass product, or browser-agent platform. Those are separate products with materially different cost and abuse surfaces.

The next expansion after proving demand should be one of:
- visual template editor backed by the existing reusable-template API
- R2-backed long-term asset storage
- per-project/team API keys and roles
- Python/PHP SDKs
- Zapier/Make/n8n integrations
- background removal/image transformation service
