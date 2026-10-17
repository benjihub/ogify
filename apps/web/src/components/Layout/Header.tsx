"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "Features", match: "/" },
  { href: "/pricing", label: "Pricing", match: "/pricing" },
  { href: "/examples", label: "Examples", match: "/examples" },
  { href: "/docs", label: "Docs", match: "/docs" },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const authLink = user
    ? { href: "/dashboard", label: "Dashboard", match: "/dashboard" }
    : { href: "/login", label: "Log in", match: "/login" };
  const navLinks = [...NAV_LINKS, authLink];

  useEffect(() => setMenuOpen(false), [pathname]);

  function isActive(match: string) {
    return match === "/"
      ? pathname === "/"
      : pathname === match || pathname.startsWith(`${match}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line-dim/80 bg-ink/85 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/75">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center text-paper" aria-label="Ogify home">
          <Logo markClassName="h-8 w-8" textClassName="text-xl" />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.match) ? "page" : undefined}
              className="nav-link"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle className="h-9 w-9 rounded-lg" />
          <Button asChild href={user ? "/dashboard" : "/signup"} size="sm" className="hidden sm:inline-flex">
            {user ? "Open dashboard" : "Get started free"}
          </Button>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line-dim bg-ink-soft text-paper transition hover:border-line md:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-main-navigation"
            aria-label="Mobile navigation"
            className="absolute left-3 right-3 top-[calc(100%+0.55rem)] z-50 grid gap-1 rounded-2xl border border-line-dim bg-ink-soft p-2 shadow-2xl md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.match) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3.5 text-sm font-medium transition",
                  isActive(link.match)
                    ? "bg-cinnabar/10 text-paper"
                    : "text-muted hover:bg-ink hover:text-paper"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild href={user ? "/dashboard" : "/signup"} className="mt-1 w-full sm:hidden">
              {user ? "Open dashboard" : "Get started free"}
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
