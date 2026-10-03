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
    curl: `${keyNote ? keyNote + "\n" : ""}curl -X POST https://api.ogify.online/render/template \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${DISPLAY_KEY}" \\
  -d '{"template":"blog","title":"My Post","author":"You"}' \\
  --output social.png`,

    node: `${keyNote ? "// " + keyNote.replace("# ", "") + "\n" : ""}const res = await fetch("https://api.ogify.online/render/template", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${DISPLAY_KEY}",
  },
  body: JSON.stringify({
    template: "blog",
    title: "My Post",
    author: "You",
  }),
});

const png = await res.arrayBuffer();
fs.writeFileSync("social.png", Buffer.from(png));`,

    python: `${keyNote ? "# " + keyNote.replace("# ", "") + "\n" : ""}import requests

response = requests.post(
    "https://api.ogify.online/render/template",
    headers={"x-api-key": "${DISPLAY_KEY}"},
    json={"template": "blog", "title": "My Post", "author": "You"},
)

with open("social.png", "wb") as f:
    f.write(response.content)`,
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded border border-line-dim bg-ink-soft">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
            Quickstart
          </span>
          {!isNewUser && (
            <span className="rounded-full bg-cinnabar/10 px-2 py-0.5 font-mono text-[10px] text-cinnabar">
              Returning user
            </span>
          )}
        </div>
        <span className="font-mono text-sm text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-line-dim">
          {/* Language tabs */}
          <div className="flex gap-1 border-b border-line-dim px-5 pt-3">
            {(["curl", "node", "python"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-t-sm px-3 py-1.5 font-mono text-xs uppercase tracking-wide",
                  lang === l
                    ? "bg-stampInk text-[#CFE8D9]"
                    : "text-muted hover:text-fg"
                )}
              >
                {l === "node" ? "Node.js" : l}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div className="relative bg-stampInk px-5 py-4">
            <pre className="overflow-x-auto font-mono text-[12.5px] leading-relaxed text-[#CFE8D9]">
              {snippets[lang]}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-4 top-4 rounded border border-[#3A4150] bg-[#1D232C] px-2.5 py-1 font-mono text-[10.5px] text-[#A9AFBC] hover:text-[#CFE8D9]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3">
            <p className="font-mono text-[11px] text-muted">
              {keyPreview
                ? `Replace ${DISPLAY_KEY} with your full key from the API Keys section below.`
                : "Generate an API key below, then paste it in."}
            </p>
            <Link
              href="/docs"
              className="font-mono text-[11px] text-cinnabar hover:underline"
            >
              Full docs →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
