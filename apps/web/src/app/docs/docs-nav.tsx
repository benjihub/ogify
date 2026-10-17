"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type DocLink = {
  href: string;
  label: string;
};

export function DocsNav({ links }: { links: DocLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
        <Link
          href="/docs"
          className={cn(
            "text-base font-semibold tracking-tight text-paper",
            pathname === "/docs" && "text-cinnabar"
          )}
        >
          Documentation
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="docs-navigation-list"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-line-dim bg-ink-soft px-3 text-xs font-semibold text-muted transition hover:border-line hover:text-paper lg:hidden"
        >
          {open ? "Hide topics" : "Browse topics"}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </div>

      <nav
        id="docs-navigation-list"
        aria-label="Documentation topics"
        className={cn(
          "grid max-h-[55vh] gap-1 overflow-y-auto rounded-xl border border-line-dim bg-ink-soft/70 p-2 lg:max-h-[calc(100vh-8rem)] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:pl-2",
          open ? "grid" : "hidden lg:grid"
        )}
      >
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm leading-5 transition",
                isActive
                  ? "bg-cinnabar/10 font-semibold text-paper"
                  : "text-muted hover:bg-ink-soft hover:text-paper"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
