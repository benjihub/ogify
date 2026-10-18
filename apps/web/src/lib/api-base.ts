const PRODUCTION_API_BASE = "https://api.ogify.online";

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!configured) return PRODUCTION_API_BASE;

  // A local .env.local is useful for `next dev`, but must not be baked into a
  // production build where browser requests would target the user's machine.
  if (process.env.NODE_ENV === "production" && isLocalhostUrl(configured)) {
    return PRODUCTION_API_BASE;
  }

  return configured;
}

function isLocalhostUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname === "[::1]"
      || hostname === "::1";
  } catch {
    return false;
  }
}
