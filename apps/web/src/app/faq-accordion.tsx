"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What is an Open Graph image?",
    a: "It's the preview image platforms like Twitter, LinkedIn and Discord show when a link is shared. Ogify generates these automatically from a title, template or URL.",
  },
  {
    q: "How is this different from Vercel OG or Satori?",
    a: "No JSX, no Vercel lock-in, and it also handles full URL screenshots — not just template rendering.",
  },
  {
    q: "Can I remove the watermark?",
    a: "Yes, on any paid plan.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — the current Free plan includes 100 renders per month.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign up and get an API key with no payment details required.",
  },
  {
    q: "How does billing work?",
    a: "Paddle handles everything, including taxes — you'll never deal with VAT or GST forms.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-[780px]">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="border-b border-line-dim">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-5 py-5 text-left font-body text-base font-medium text-paper"
            >
              {item.q}
              <span
                className={cn(
                  "shrink-0 font-mono text-lg text-cinnabar transition-transform",
                  isOpen && "rotate-45"
                )}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: isOpen ? "200px" : "0px" }}
            >
              <p className="max-w-[600px] pb-5 text-[14.5px] text-muted">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
