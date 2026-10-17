"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/renders", label: "Renders" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/projects", label: "Projects & keys" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Plans" },
];

export function DashboardNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Dashboard navigation" className="hidden items-center gap-1 lg:flex">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active(link.href, link.exact) ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-[13px] font-medium transition",
              active(link.href, link.exact)
                ? "bg-cinnabar/10 text-paper"
                : "text-muted hover:bg-ink-soft hover:text-paper"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        aria-label={open ? "Close dashboard navigation" : "Open dashboard navigation"}
        aria-expanded={open}
        aria-controls="dashboard-mobile-navigation"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line-dim bg-ink-soft text-paper lg:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <nav
          id="dashboard-mobile-navigation"
          aria-label="Mobile dashboard navigation"
          className="absolute left-3 right-3 top-[calc(100%+0.55rem)] z-50 grid gap-1 rounded-2xl border border-line-dim bg-ink-soft p-2 shadow-2xl lg:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active(link.href, link.exact) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-xl px-3.5 text-sm font-medium transition",
                active(link.href, link.exact)
                  ? "bg-cinnabar/10 text-paper"
                  : "text-muted hover:bg-ink hover:text-paper"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
