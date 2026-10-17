/** Shared URL validation for screenshot and composite rendering. */
export function parsePublicHttpUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("INVALID_URL");
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("INVALID_PROTOCOL");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error("PRIVATE_HOST");
  }

  return parsed;
}

export function isPrivateHost(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const patterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./,
    /^0\./,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^fc[0-9a-f]{2}:/,
    /^fd[0-9a-f]{2}:/,
    /^fe8[0-9a-f]:/,
    /\.internal$/,
    /\.local$/,
    /\.localhost$/,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

export function isSafeHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}
