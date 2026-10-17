import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
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
    <div className="dashboard-shell min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-line-dim/80 bg-ink/85 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/75">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center text-fg" aria-label="Ogify dashboard home">
            <Logo markClassName="h-8 w-8" textClassName="text-xl" />
          </Link>

          <DashboardNavigation />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle className="h-9 w-9 rounded-lg" />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex rounded-lg px-1.5 py-2 text-[11px] font-semibold text-muted transition hover:bg-ink-soft hover:text-paper sm:px-2 sm:text-xs"
              >
                <span className="sm:hidden">Out</span><span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cinnabar/30 bg-cinnabar/15 font-mono text-xs font-bold text-paper"
              title={user.email ?? "Signed-in account"}
              aria-label={`Signed in as ${user.email ?? "account"}`}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
