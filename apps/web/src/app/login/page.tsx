import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <main className="auth-page flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <Link
        href="/"
        aria-label="Back to Ogify home"
        className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-dim bg-ink-soft/80 text-muted transition hover:border-line hover:text-paper sm:left-6 sm:top-6"
      >
        <span aria-hidden="true" className="text-xl leading-none">←</span>
      </Link>

      <div className="w-full max-w-[440px]">
        <Link href="/" className="mx-auto flex w-fit items-center text-paper" aria-label="Ogify home">
          <Logo markClassName="h-9 w-9" textClassName="text-2xl" />
        </Link>

        <div className="auth-panel mt-8 p-5 sm:p-8">
          <div className="mb-7 text-center">
            <div className="eyebrow justify-center">Your workspace awaits</div>
            <h1 className="mt-3 text-3xl tracking-[-0.04em] text-paper">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sign in to manage your API keys, renders, and usage.
            </p>
          </div>
          <AuthForm mode="login" />
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Secure sign-in for your Ogify developer workspace.
        </p>
      </div>
    </main>
  );
}
