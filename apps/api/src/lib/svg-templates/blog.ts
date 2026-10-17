export interface BlogTemplateInput {
  title: string;
  author?: string;
  tag?: string;
  width: number;
  height: number;
}

/**
 * Generates the Blog OG image SVG.
 *
 * Visual identity: dark ink background, cinnabar-red accent, cream paper
 * text, postmark stamp in the top-right corner.
 *
 * All values are statically embedded — no external font or image requests.
 * The SVG is self-contained so resvg-wasm can render it offline.
 */
export function blogTemplate({
  title,
  author = "",
  tag = "Blog post",
  width,
  height,
}: BlogTemplateInput): string {
  // Trim long titles gracefully (resvg does not do text wrapping)
  const safeTitle = escapeXml(title.slice(0, 80));
  const safeAuthor = escapeXml(author.slice(0, 60));
  const safeTag = escapeXml(tag.slice(0, 40).toUpperCase());

  // Wrap title at ~36 chars per line — max 3 lines
  const titleLines = wrapText(safeTitle, 36);

  // Font sizes that look good at 1200×630
  const tagSize = Math.round(height * 0.022);
  const titleSize = Math.round(height * 0.074);
  const authorSize = Math.round(height * 0.026);
  const stampRadius = Math.round(height * 0.17);
  const stampCx = width - Math.round(height * 0.2);
  const stampCy = Math.round(height * 0.24);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .font-display { font-family: 'Lato'; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em; }
      .font-mono    { font-family: 'Liberation Mono'; }
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#23303A" />
      <stop offset="100%" stop-color="#171E26" />
    </linearGradient>
    <!-- Subtle grid lines across the background for the postal paper look -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.25" stroke-opacity="0.04" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />

  <!-- Left cinnabar accent bar -->
  <rect x="0" y="0" width="${Math.round(height * 0.012)}" height="${height}" fill="#C73E1D" />

  <!-- Bottom label strip -->
  <rect x="${Math.round(height * 0.012)}" y="${height - Math.round(height * 0.098)}" width="${width}" height="${Math.round(height * 0.098)}" fill="#C73E1D" opacity="0.12" />
  <line x1="${Math.round(height * 0.012)}" y1="${height - Math.round(height * 0.098)}" x2="${width}" y2="${height - Math.round(height * 0.098)}" stroke="#C73E1D" stroke-width="1" stroke-opacity="0.4" />

  <!-- Postmark stamp (top-right) -->
  <circle cx="${stampCx}" cy="${stampCy}" r="${stampRadius}" fill="none" stroke="#C73E1D" stroke-width="3" />
  <circle cx="${stampCx}" cy="${stampCy}" r="${stampRadius - 8}" fill="none" stroke="#C73E1D" stroke-width="1" stroke-opacity="0.5" />
  <text x="${stampCx}" y="${stampCy - 10}" text-anchor="middle" class="font-mono" fill="#C73E1D" font-size="${Math.round(height * 0.022)}" letter-spacing="0.12em">OGIFY</text>
  <line x1="${stampCx - stampRadius + 14}" y1="${stampCy}" x2="${stampCx + stampRadius - 14}" y2="${stampCy}" stroke="#C73E1D" stroke-width="1" stroke-opacity="0.5" />
  <text x="${stampCx}" y="${stampCy + 18}" text-anchor="middle" class="font-mono" fill="#C73E1D" font-size="${Math.round(height * 0.02)}" letter-spacing="0.1em">RENDERED</text>

  <!-- Eyebrow tag -->
  <text x="${Math.round(width * 0.058)}" y="${Math.round(height * 0.42)}" class="font-mono" fill="#D4A12C" font-size="${tagSize}" letter-spacing="0.14em">${safeTag}</text>

  <!-- Title lines -->
  ${titleLines.map((line, i) => `
  <text x="${Math.round(width * 0.058)}" y="${Math.round(height * 0.42) + tagSize * 1.6 + i * (titleSize * 1.15)}" class="font-display" fill="#EFE8D8" font-size="${titleSize}">${line}</text>`).join("")}

  <!-- Author / site -->
  ${safeAuthor ? `
  <text x="${Math.round(width * 0.058)}" y="${height - Math.round(height * 0.052)}" class="font-mono" fill="#A9AFBC" font-size="${authorSize}" letter-spacing="0.03em">${safeAuthor}</text>` : ""}

  <!-- Dashed rule above author -->
  <line x1="${Math.round(width * 0.058)}" y1="${height - Math.round(height * 0.098)}" x2="${Math.round(width * 0.44)}" y2="${height - Math.round(height * 0.098)}" stroke="#3A4150" stroke-width="1" stroke-dasharray="4 4" />
</svg>`;
}

// ── Utilities ─────────────────────────────────────────────────────────────

/** Escape the five XML special characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Naive word-wrap at `maxChars` characters per line, returning ≤ maxLines lines */
function wrapText(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (lines.length >= maxLines) break;
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word.slice(0, maxChars);
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  // Trim last line with ellipsis if the title was too long
  if (text.length > lines.join(" ").length + 1) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxChars - 1) + "…";
  }

  return lines;
}
