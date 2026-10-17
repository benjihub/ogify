export interface SaasTemplateInput {
  title: string;
  author?: string;
  tag?: string;
  width: number;
  height: number;
}

/**
 * SaaS / changelog card.
 * Horizontal ticket layout: a cinnabar tear-off tab on the left,
 * main content on the right. The postmark is on the tab.
 */
export function saasTemplate({
  title,
  author = "",
  tag = "Changelog",
  width,
  height,
}: SaasTemplateInput): string {
  const safeTitle = escapeXml(title.slice(0, 80));
  const safeAuthor = escapeXml(author.slice(0, 60));
  const safeTag = escapeXml(tag.slice(0, 40).toUpperCase());
  const titleLines = wrapText(safeTitle, 34);

  const tagSize = Math.round(height * 0.022);
  const titleSize = Math.round(height * 0.072);
  const authorSize = Math.round(height * 0.026);

  const tabW = Math.round(width * 0.18);
  const padding = Math.round(width * 0.065);
  const contentX = tabW + padding;

  // Stamp on the cinnabar tab
  const stampCx = Math.round(tabW * 0.5);
  const stampCy = Math.round(height * 0.38);
  const stampR = Math.round(Math.min(tabW, height) * 0.24);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .font-display { font-family: 'Lato'; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em; }
      .font-mono    { font-family: 'Liberation Mono'; }
    </style>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#1A2028" />
      <stop offset="100%" stop-color="#14181F" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg3)" />

  <!-- Subtle dot pattern on main area -->
  <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff" fill-opacity="0.03" />
  </pattern>
  <rect x="${tabW}" y="0" width="${width - tabW}" height="${height}" fill="url(#dots)" />

  <!-- Cinnabar left tab -->
  <rect x="0" y="0" width="${tabW}" height="${height}" fill="#C73E1D" />

  <!-- Perforated right edge of tab (tear-off perforation) -->
  ${Array.from({ length: Math.floor(height / 20) }, (_, i) => {
    const cy = 10 + i * 20;
    return `<circle cx="${tabW}" cy="${cy}" r="6" fill="#14181F" />`;
  }).join("")}

  <!-- Stamp on the cinnabar tab -->
  <circle cx="${stampCx}" cy="${stampCy}" r="${stampR}" fill="none" stroke="#EFE8D8" stroke-width="2" stroke-opacity="0.7" />
  <circle cx="${stampCx}" cy="${stampCy}" r="${stampR - 5}" fill="none" stroke="#EFE8D8" stroke-width="0.75" stroke-opacity="0.4" />

  <!-- Vertical OGIFY text on tab -->
  <text x="${stampCx}" y="${stampCy}" text-anchor="middle" dominant-baseline="middle" class="font-mono" fill="#EFE8D8" font-size="${Math.round(height * 0.026)}" letter-spacing="0.14em" transform="rotate(-90, ${stampCx}, ${stampCy})">OGIFY</text>

  <!-- Tab label at bottom -->
  <text x="${stampCx}" y="${height - Math.round(height * 0.055)}" text-anchor="middle" class="font-mono" fill="#EFE8D8" font-size="${Math.round(height * 0.019)}" letter-spacing="0.08em" fill-opacity="0.7">RENDERED</text>

  <!-- Gold accent line under eyebrow tag -->
  <line x1="${contentX}" y1="${Math.round(height * 0.415)}" x2="${contentX + Math.round(width * 0.36)}" y2="${Math.round(height * 0.415)}" stroke="#D4A12C" stroke-width="1.5" />

  <!-- Eyebrow tag -->
  <text x="${contentX}" y="${Math.round(height * 0.395)}" class="font-mono" fill="#D4A12C" font-size="${tagSize}" letter-spacing="0.14em">${safeTag}</text>

  <!-- Title -->
  ${titleLines.map((line, i) => `
  <text x="${contentX}" y="${Math.round(height * 0.415) + tagSize * 1.1 + i * (titleSize * 1.15) + titleSize}" class="font-display" fill="#EFE8D8" font-size="${titleSize}">${line}</text>`).join("")}

  <!-- Author -->
  ${safeAuthor ? `
  <text x="${contentX}" y="${height - Math.round(height * 0.055)}" class="font-mono" fill="#8B93A1" font-size="${authorSize}" letter-spacing="0.03em">${safeAuthor}</text>` : ""}
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
