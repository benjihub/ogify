import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "./actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initials = (user.email?.split("@")[0] ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-line-dim bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-7">
          <Link
            href="/"
            className="flex items-center text-fg"
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <Link href="/dashboard" className="hover:text-fg">Dashboard</Link>
            <Link href="/dashboard/renders" className="hover:text-fg">Renders</Link>
            <Link href="/docs" className="hover:text-fg">Docs</Link>
            <Link href="/pricing" className="hover:text-fg">Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="font-mono text-xs text-muted hover:text-fg"
              >
                Sign out
              </button>
            </form>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cinnabar font-mono text-xs font-bold text-paper">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-7 py-10">{children}</main>
    </div>
  );
}
