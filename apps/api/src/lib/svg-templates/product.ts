export interface ProductTemplateInput {
  title: string;
  author?: string;
  tag?: string;
  width: number;
  height: number;
}

/**
 * Product / launch card.
 * Uses a warm cream paper foreground panel sitting on the dark ink background —
 * the stamp-sheet aesthetic to complement the blog template.
 */
export function productTemplate({
  title,
  author = "",
  tag = "New release",
  width,
  height,
}: ProductTemplateInput): string {
  const safeTitle = escapeXml(title.slice(0, 80));
  const safeAuthor = escapeXml(author.slice(0, 60));
  const safeTag = escapeXml(tag.slice(0, 40).toUpperCase());
  const titleLines = wrapText(safeTitle, 32);

  const tagSize = Math.round(height * 0.022);
  const titleSize = Math.round(height * 0.072);
  const authorSize = Math.round(height * 0.026);

  // Paper panel dimensions
  const panelX = Math.round(width * 0.52);
  const panelY = Math.round(height * 0.1);
  const panelW = Math.round(width * 0.42);
  const panelH = Math.round(height * 0.8);

  // Stamp on the paper panel
  const stampCx = panelX + Math.round(panelW * 0.5);
  const stampCy = panelY + Math.round(panelH * 0.22);
  const stampR = Math.round(height * 0.13);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .font-display { font-family: 'Lato'; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em; }
      .font-mono    { font-family: 'Liberation Mono'; }
    </style>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#14181F" />
      <stop offset="100%" stop-color="#1D232C" />
    </linearGradient>
    <clipPath id="panel-clip">
      <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="4" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg2)" />

  <!-- Decorative cross-hatch on left half -->
  ${Array.from({ length: 14 }, (_, i) => {
    const x = Math.round(width * 0.04) + i * 34;
    return `<line x1="${x}" y1="${Math.round(height * 0.08)}" x2="${x - 80}" y2="${Math.round(height * 0.92)}" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.04" />`;
  }).join("")}

  <!-- Paper panel (right side) -->
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="4" fill="#EFE8D8" />

  <!-- Perforated left edge of panel (stamp-sheet motif) -->
  ${Array.from({ length: Math.floor(panelH / 18) }, (_, i) => {
    const cy = panelY + 10 + i * 18;
    return `<circle cx="${panelX}" cy="${cy}" r="5" fill="#14181F" />`;
  }).join("")}

  <!-- Postmark on paper panel -->
  <circle cx="${stampCx}" cy="${stampCy}" r="${stampR}" fill="none" stroke="#C73E1D" stroke-width="2.5" />
  <circle cx="${stampCx}" cy="${stampCy}" r="${stampR - 6}" fill="none" stroke="#C73E1D" stroke-width="0.75" stroke-opacity="0.5" />
  <text x="${stampCx}" y="${stampCy - 8}" text-anchor="middle" class="font-mono" fill="#C73E1D" font-size="${Math.round(height * 0.019)}" letter-spacing="0.12em">OGIFY</text>
  <line x1="${stampCx - stampR + 10}" y1="${stampCy}" x2="${stampCx + stampR - 10}" y2="${stampCy}" stroke="#C73E1D" stroke-width="0.75" stroke-opacity="0.5" />
  <text x="${stampCx}" y="${stampCy + 14}" text-anchor="middle" class="font-mono" fill="#C73E1D" font-size="${Math.round(height * 0.017)}" letter-spacing="0.1em">RENDERED</text>

  <!-- Left-side content -->
  <text x="${Math.round(width * 0.055)}" y="${Math.round(height * 0.38)}" class="font-mono" fill="#D4A12C" font-size="${tagSize}" letter-spacing="0.14em">${safeTag}</text>

  ${titleLines.map((line, i) => `
  <text x="${Math.round(width * 0.055)}" y="${Math.round(height * 0.38) + tagSize * 1.6 + i * (titleSize * 1.15)}" class="font-display" fill="#EFE8D8" font-size="${titleSize}">${line}</text>`).join("")}

  ${safeAuthor ? `
  <text x="${Math.round(width * 0.055)}" y="${height - Math.round(height * 0.065)}" class="font-mono" fill="#8B93A1" font-size="${authorSize}" letter-spacing="0.03em">${safeAuthor}</text>` : ""}

  <!-- Cinnabar bottom accent on left side -->
  <rect x="0" y="${height - Math.round(height * 0.018)}" width="${Math.round(width * 0.5)}" height="${Math.round(height * 0.018)}" fill="#C73E1D" />
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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

  if (text.length > lines.join(" ").length + 1) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxChars - 1) + "…";
  }
  return lines;
}
