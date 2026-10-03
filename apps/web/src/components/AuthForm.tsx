"use client";

import { useState, type FormEvent } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
  const isBusy = loading || success !== null || oauthLoading !== null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const redirectTo =
      new URLSearchParams(window.location.search).get("redirectTo") ??
      "/dashboard";

    const { data, error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup" && !data.session) {
      setSuccess("Account created. Check your email to confirm your account.");
      return;
    }

    setSuccess(
      mode === "login"
        ? "Signed in successfully. Loading dashboard..."
        : "Account created successfully. Loading dashboard..."
    );

    router.refresh();
    setTimeout(() => {
      router.replace(redirectTo);
    }, 650);
  }

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    setSuccess("Opening secure sign-in...");
    setOauthLoading(provider);

    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setSuccess(null);
      setOauthLoading(null);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="grid gap-3">
        <Button
          className="w-full justify-center"
          disabled={isBusy}
          onClick={() => handleOAuth("google")}
          type="button"
          variant="ghost"
        >
          <span className="inline-flex items-center justify-center gap-3">
            <GoogleIcon />
            <span>
              {oauthLoading === "google" ? "Opening Google..." : "Continue with Google"}
            </span>
          </span>
        </Button>
        <Button
          className="w-full justify-center"
          disabled={isBusy}
          onClick={() => handleOAuth("github")}
          type="button"
          variant="ghost"
        >
          <span className="inline-flex items-center justify-center gap-3">
            <GitHubIcon />
            <span>
              {oauthLoading === "github" ? "Opening GitHub..." : "Continue with GitHub"}
            </span>
          </span>
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line-dim" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-line">
          Or use email
        </span>
        <span className="h-px flex-1 bg-line-dim" />
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          disabled={isBusy}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          value={password}
          disabled={isBusy}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="mb-4 font-mono text-xs text-cinnabar">{error}</p>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-3 rounded border border-[#4ade80]/40 bg-[#4ade80]/10 px-3.5 py-3">
            <Spinner />
            <p className="font-mono text-xs leading-relaxed text-[#8ff0b2]">
              {success}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isBusy}
          className="w-full justify-center"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {loading || success ? <Spinner /> : null}
            <span>
              {loading || success
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </span>
          </span>
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-paper underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-paper underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[#8ff0b2]/30 border-t-[#8ff0b2]"
    />
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 fill-current"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21.8 12.23c0-.72-.06-1.4-.18-2.06H12v3.9h5.5a4.7 4.7 0 0 1-2.04 3.08v2.52h3.3c1.93-1.78 3.04-4.4 3.04-7.44Z" />
      <path d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.52c-.92.62-2.1.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2H2.9v2.6A10 10 0 0 0 12 22Z" />
      <path d="M6.3 13.8a6 6 0 0 1 0-3.6V7.6H2.9a10 10 0 0 0 0 8.8l3.4-2.6Z" />
      <path d="M12 6.02c1.5 0 2.85.52 3.91 1.53l2.91-2.91A9.75 9.75 0 0 0 12 2a10 10 0 0 0-9.1 5.6l3.4 2.6c.8-2.4 3.05-4.18 5.7-4.18Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 fill-current"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.36 6.84 9.7.5.1.66-.22.66-.48v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.2-1.12-1.52-1.12-1.52-.92-.65.07-.64.07-.64 1.02.08 1.56 1.07 1.56 1.07.9 1.58 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.14 9.14 0 0 1 5 0c1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.11 2.73.64.72 1.03 1.64 1.03 2.76 0 3.95-2.35 4.82-4.58 5.07.36.32.68.95.68 1.92v2.84c0 .27.16.59.67.48A10.27 10.27 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
