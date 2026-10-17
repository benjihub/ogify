import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ogify.online";
  const paths = [
    "", "/pricing", "/docs", "/docs/quickstart", "/docs/authentication",
    "/docs/api-reference/render-template", "/docs/api-reference/render-url",
    "/docs/api-reference/render-composite", "/docs/api-reference/render-html", "/docs/api-reference/render-pdf",
    "/docs/api-reference/render-social", "/docs/api-reference/batch-jobs", "/docs/api-reference/metadata", "/docs/api-reference/content-extraction",
    "/docs/public-images", "/docs/templates", "/docs/render-links", "/docs/sdk",
    "/docs/rate-limits", "/docs/integrations/nextjs", "/docs/integrations/astro", "/docs/integrations/ci-cd", "/examples", "/open-graph-image-api", "/website-screenshot-api",
    "/dynamic-og-images", "/nextjs-og-images", "/social-preview-image-generator",
    "/cloudflare-screenshot-api", "/status", "/privacy", "/terms",
  ];
  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path.startsWith("/docs") ? "monthly" : "weekly", priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.7 }));
}
