export interface CompositeSvgOptions {
  screenshot: Uint8Array;
  title: string;
  author?: string;
  tag?: string;
  brand?: string;
  accentColor?: string;
  backgroundColor?: string;
  width: number;
  height: number;
  showOgifyMark: boolean;
}

export function renderCompositeSvg({
  screenshot,
  title,
  author = "",
  tag = "Website preview",
  brand = "",
  accentColor = "#C73E1D",
  backgroundColor = "#14181F",
  width,
  height,
  showOgifyMark,
}: CompositeSvgOptions): string {
  const safeTitle = escapeXml(title.slice(0, 90));
  const safeAuthor = escapeXml(author.slice(0, 70));
  const safeTag = escapeXml(tag.slice(0, 40).toUpperCase());
  const safeBrand = escapeXml(brand.slice(0, 28));
  const mark = showOgifyMark ? "OGIFY" : safeBrand || "PREVIEW";
  const titleLines = wrapText(safeTitle, 38, 2);
  const pngData = `data:image/png;base64,${bytesToBase64(screenshot)}`;

  const pad = Math.round(width * 0.045);
  const textW = Math.round(width * 0.35);
  const shotX = Math.round(width * 0.44);
  const shotY = Math.round(height * 0.09);
  const shotW = width - shotX - pad;
  const shotH = Math.round(height * 0.82);
  const titleSize = Math.round(height * 0.065);
  const small = Math.round(height * 0.022);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .display { font-family: Inter; font-weight: 600; }
      .mono { font-family: 'JetBrains Mono'; }
    </style>
    <clipPath id="shot"><rect x="${shotX}" y="${shotY}" width="${shotW}" height="${shotH}" rx="18"/></clipPath>
    <filter id="shadow"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  <rect x="0" y="0" width="${Math.max(8, Math.round(width * 0.008))}" height="${height}" fill="${accentColor}"/>
  <circle cx="${Math.round(width * 0.08)}" cy="${Math.round(height * 0.14)}" r="${Math.round(height * 0.035)}" fill="none" stroke="${accentColor}" stroke-width="3"/>
  <text x="${pad}" y="${Math.round(height * 0.28)}" class="mono" fill="${accentColor}" font-size="${small}" letter-spacing="0.12em">${safeTag}</text>
  ${titleLines.map((line, i) => `<text x="${pad}" y="${Math.round(height * 0.39) + i * titleSize * 1.15}" class="display" fill="#F2EBDD" font-size="${titleSize}">${line}</text>`).join("")}
  ${safeAuthor ? `<text x="${pad}" y="${Math.round(height * 0.77)}" class="mono" fill="#A9AFBC" font-size="${small}">${safeAuthor}</text>` : ""}
  <text x="${pad}" y="${Math.round(height * 0.9)}" class="mono" fill="#6F7886" font-size="${Math.round(small * 0.85)}" letter-spacing="0.08em">${mark}</text>
  <rect x="${shotX - 2}" y="${shotY - 2}" width="${shotW + 4}" height="${shotH + 4}" rx="20" fill="#222A34" filter="url(#shadow)"/>
  <image href="${pngData}" x="${shotX}" y="${shotY}" width="${shotW}" height="${shotH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#shot)"/>
  <rect x="${shotX}" y="${shotY}" width="${shotW}" height="${shotH}" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.12"/>
  <line x1="${pad}" y1="${Math.round(height * 0.83)}" x2="${pad + textW}" y2="${Math.round(height * 0.83)}" stroke="#ffffff" stroke-opacity="0.08"/>
</svg>`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = candidate.slice(0, maxChars);
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (!lines.length) lines.push(text.slice(0, maxChars));
  if (text.length > lines.join(" ").length) {
    const i = lines.length - 1;
    lines[i] = `${lines[i].slice(0, Math.max(0, maxChars - 1))}…`;
  }
  return lines;
}
