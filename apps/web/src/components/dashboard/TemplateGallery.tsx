"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  payload: Record<string, string>;
}

const TEMPLATES: Template[] = [
  {
    id: "blog",
    name: "Blog",
    description: "Article or tutorial share card",
    payload: {
      template: "blog",
      title: "Your Post Title",
      author: "Your Name · yoursite.com",
      tag: "Tutorial",
    },
  },
  {
    id: "product",
    name: "Product",
    description: "Launch or feature announcement",
    payload: {
      template: "product",
      title: "Introducing Your Feature",
      author: "Your Product · yourapp.com",
      tag: "New release",
    },
  },
  {
    id: "saas",
    name: "SaaS",
    description: "Changelog or metric card",
    payload: {
      template: "saas",
      title: "Now with Team Workspaces",
      author: "Your SaaS · yourapp.com",
      tag: "Changelog",
    },
  },
];

export function TemplateGallery() {
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(template: Template) {
    const json = JSON.stringify(template.payload, null, 2);
    await navigator.clipboard.writeText(json);
    setCopied(template.id);
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <section className="rounded border border-line-dim bg-ink-soft p-6">
      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-gold">
        Template gallery
      </div>
      <p className="mb-6 font-mono text-[11px] text-muted">
        Click any template to copy its JSON payload — paste straight into your
        API call or cURL command.
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleCopy(t)}
            className={cn(
              "group relative overflow-hidden rounded border text-left transition-all",
              copied === t.id
                ? "border-[#4ade80]"
                : "border-line-dim hover:border-cinnabar"
            )}
          >
            {/* Inline SVG preview — matches the real template visual */}
            <TemplateThumbnail id={t.id} />

            {/* Card footer */}
            <div className="border-t border-line-dim bg-ink px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[12px] text-fg">{t.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">
                    {t.description}
                  </div>
                </div>
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    copied === t.id ? "text-[#4ade80]" : "text-muted group-hover:text-cinnabar"
                  )}
                >
                  {copied === t.id ? "✓ Copied!" : "Copy JSON"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-5 font-mono text-[10.5px] text-line">
        Need a website-driven card? Use composite mode in Render Studio.
        <a href="/docs/api-reference/render-composite" className="ml-2 text-cinnabar hover:underline">
          Composite docs →
        </a>
      </p>
    </section>
  );
}

// ── Inline SVG thumbnails (scaled-down versions of real templates) ─────────

function TemplateThumbnail({ id }: { id: string }) {
  const thumbs: Record<string, React.ReactNode> = {
    blog: (
      <svg viewBox="0 0 400 210" className="w-full bg-[#171E26]" aria-hidden>
        {/* Grid lines */}
        <defs>
          <pattern id="g1" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.4" strokeOpacity="0.04"/>
          </pattern>
        </defs>
        <rect width="400" height="210" fill="url(#g1)"/>
        {/* Left accent bar */}
        <rect x="0" y="0" width="5" height="210" fill="#C73E1D"/>
        {/* Bottom strip */}
        <rect x="5" y="180" width="400" height="30" fill="#C73E1D" fillOpacity="0.12"/>
        {/* Postmark */}
        <circle cx="334" cy="62" r="46" fill="none" stroke="#C73E1D" strokeWidth="2.5"/>
        <circle cx="334" cy="62" r="38" fill="none" stroke="#C73E1D" strokeWidth="0.75" strokeOpacity="0.5"/>
        <text x="334" y="59" textAnchor="middle" fill="#C73E1D" fontSize="9" fontFamily="monospace" letterSpacing="2">OGIFY</text>
        <line x1="296" y1="62" x2="372" y2="62" stroke="#C73E1D" strokeWidth="0.75" strokeOpacity="0.5"/>
        <text x="334" y="74" textAnchor="middle" fill="#C73E1D" fontSize="8" fontFamily="monospace" letterSpacing="1.5">RENDERED</text>
        {/* Tag */}
        <text x="28" y="122" fill="#D4A12C" fontSize="9" fontFamily="monospace" letterSpacing="4">BLOG POST</text>
        {/* Title */}
        <text x="28" y="148" fill="#EFE8D8" fontSize="22" fontFamily="sans-serif" fontWeight="600">Your Post Title</text>
        {/* Author */}
        <text x="28" y="196" fill="#8B93A1" fontSize="10" fontFamily="monospace">by Your Name · site.com</text>
      </svg>
    ),

    product: (
      <svg viewBox="0 0 400 210" className="w-full bg-[#14181F]" aria-hidden>
        {/* Cross-hatch on left */}
        {Array.from({length:7},(_,i)=>(
          <line key={i} x1={20+i*32} y1="15" x2={i*32-30} y2="195" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.04"/>
        ))}
        {/* Paper panel */}
        <rect x="210" y="20" width="170" height="170" rx="4" fill="#EFE8D8"/>
        {/* Perf holes on paper panel */}
        {Array.from({length:9},(_,i)=>(
          <circle key={i} cx="210" cy={30+i*18} r="5" fill="#14181F"/>
        ))}
        {/* Stamp on paper */}
        <circle cx="295" cy="82" r="38" fill="none" stroke="#C73E1D" strokeWidth="2"/>
        <text x="295" y="79" textAnchor="middle" fill="#C73E1D" fontSize="8" fontFamily="monospace" letterSpacing="2">OGIFY</text>
        <line x1="261" y1="82" x2="329" y2="82" stroke="#C73E1D" strokeWidth="0.75" strokeOpacity="0.5"/>
        <text x="295" y="93" textAnchor="middle" fill="#C73E1D" fontSize="7" fontFamily="monospace" letterSpacing="1">RENDERED</text>
        {/* Left content */}
        <text x="20" y="110" fill="#D4A12C" fontSize="8" fontFamily="monospace" letterSpacing="3">NEW RELEASE</text>
        <text x="20" y="136" fill="#EFE8D8" fontSize="19" fontFamily="sans-serif" fontWeight="600">New Feature</text>
        <text x="20" y="157" fill="#EFE8D8" fontSize="19" fontFamily="sans-serif" fontWeight="600">Launch</text>
        <text x="20" y="196" fill="#8B93A1" fontSize="9" fontFamily="monospace">Product · site.com</text>
        {/* Bottom accent */}
        <rect x="0" y="205" width="205" height="5" fill="#C73E1D"/>
      </svg>
    ),

    saas: (
      <svg viewBox="0 0 400 210" className="w-full bg-[#1A2028]" aria-hidden>
        {/* Cinnabar tab */}
        <rect x="0" y="0" width="72" height="210" fill="#C73E1D"/>
        {/* Perf holes on tab edge */}
        {Array.from({length:11},(_,i)=>(
          <circle key={i} cx="72" cy={10+i*18} r="5" fill="#1A2028"/>
        ))}
        {/* Stamp on tab */}
        <circle cx="36" cy="88" r="28" fill="none" stroke="#EFE8D8" strokeWidth="2" strokeOpacity="0.7"/>
        <text x="36" y="93" textAnchor="middle" fill="#EFE8D8" fontSize="8" fontFamily="monospace" letterSpacing="2" transform="rotate(-90 36 88)">OGIFY</text>
        {/* Gold line */}
        <line x1="96" y1="110" x2="340" y2="110" stroke="#D4A12C" strokeWidth="1.5"/>
        {/* Tag */}
        <text x="96" y="104" fill="#D4A12C" fontSize="8" fontFamily="monospace" letterSpacing="3">CHANGELOG</text>
        {/* Title */}
        <text x="96" y="138" fill="#EFE8D8" fontSize="20" fontFamily="sans-serif" fontWeight="600">Team Workspaces</text>
        <text x="96" y="162" fill="#EFE8D8" fontSize="20" fontFamily="sans-serif" fontWeight="600">Now Available</text>
        {/* Author */}
        <text x="96" y="196" fill="#8B93A1" fontSize="9" fontFamily="monospace">Your SaaS · site.com</text>
      </svg>
    ),
  };

  return (
    <div className="aspect-[400/210] overflow-hidden">
      {thumbs[id] ?? null}
    </div>
  );
}
