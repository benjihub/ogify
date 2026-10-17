"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/login", label: "Login", match: "/login" },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const authLink = user
    ? { href: "/dashboard", label: "Dashboard", match: "/dashboard" }
    : { href: "/login", label: "Login", match: "/login" };
  const navLinks = [...NAV_LINKS.slice(0, -1), authLink];

  return (
    <header className="sticky top-0 z-50 border-b border-line-dim bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-7">
        <Link
          href="/"
          className="flex items-center text-paper"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.match === "/"
                ? pathname === "/"
                : pathname === link.match || pathname.startsWith(`${link.match}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-medium text-muted transition hover:text-paper",
                  isActive && "font-bold text-paper"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href={user ? "/dashboard" : "/signup"}>
            <Button variant="primary" size="sm">
              {user ? "Dashboard" : "Get started free"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
