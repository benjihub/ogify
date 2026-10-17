"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickstartProps {
  isNewUser: boolean;
  keyPreview: string | null;
}

type Lang = "curl" | "node" | "python";
const DISPLAY_KEY = "ogfy_live_YOUR_KEY";

export function Quickstart({ isNewUser, keyPreview }: QuickstartProps) {
  const [open, setOpen] = useState(isNewUser);
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const keyNote = keyPreview
    ? `# Replace the key below with your full key (starts with ${keyPreview}...)`
    : "";

  const snippets: Record<Lang, string> = {
    curl: `${keyNote ? keyNote + "\n" : ""}curl -X POST https://api.ogify.online/v1/render/template \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${DISPLAY_KEY}" \\
  -d '{"template":"blog","title":"My Post","author":"You"}'`,

    node: `${keyNote ? "// " + keyNote.replace("# ", "") + "\n" : ""}const res = await fetch("https://api.ogify.online/v1/render/template", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${DISPLAY_KEY}",
  },
  body: JSON.stringify({ template: "blog", title: "My Post", author: "You" }),
});

const { image_url } = await res.json();
console.log(image_url); // use this in og:image`,

    python: `${keyNote ? "# " + keyNote.replace("# ", "") + "\n" : ""}import requests

response = requests.post(
    "https://api.ogify.online/v1/render/template",
    headers={"x-api-key": "${DISPLAY_KEY}"},
    json={"template": "blog", "title": "My Post", "author": "You"},
)

print(response.json()["image_url"])  # use this in og:image`,
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line-dim bg-ink-soft/80 shadow-sm">
      <button type="button" aria-expanded={open} aria-controls="quickstart-panel" onClick={() => setOpen((v) => !v)} className="flex min-h-14 w-full items-center justify-between px-4 py-4 text-left transition hover:bg-ink/40 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-paper">Quickstart</span>
          {!isNewUser && <span className="rounded-full bg-cinnabar/10 px-2 py-0.5 font-mono text-[10px] text-cinnabar">Returning user</span>}
        </div>
        <span className="font-mono text-sm text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div id="quickstart-panel" className="border-t border-line-dim">
          <div className="flex gap-1 border-b border-line-dim px-4 pt-3 sm:px-5">
            {(["curl", "node", "python"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={cn("rounded-t-lg px-3 py-2 text-xs font-semibold transition", lang === l ? "bg-stampInk text-[#CFE8D9]" : "text-muted hover:bg-ink-soft hover:text-fg")}>
                {l === "node" ? "Node.js" : l}
              </button>
            ))}
          </div>

          <div className="relative bg-stampInk px-4 py-4 sm:px-5">
            <pre className="overflow-x-auto font-mono text-[12.5px] leading-relaxed text-[#CFE8D9]">{snippets[lang]}</pre>
            <button onClick={handleCopy} className="absolute right-3 top-3 rounded-lg border border-[#3A4150] bg-[#1D232C] px-3 py-1.5 text-xs font-semibold text-[#A9AFBC] transition hover:text-[#CFE8D9]">{copied ? "Copied!" : "Copy"}</button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="text-xs leading-5 text-muted">
              {keyPreview ? `Replace ${DISPLAY_KEY} with your full key. The response contains a crawler-safe public image URL.` : "Generate an API key below, then paste it in."}
            </p>
            <Link href="/docs/quickstart" className="text-xs font-semibold text-cinnabar hover:underline">Full quickstart →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
