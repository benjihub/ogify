"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ───────────────────────────────────────────────────────────────

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Actions ───────────────────────────────────────────────────────────────

/**
 * Generates a new API key, stores a SHA-256 hash + preview in the DB,
 * and returns the raw key (shown to the user exactly once).
 *
 * The `api_keys` table needs a `key_preview` text column:
 *   ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_preview text;
 *   ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
 */
export async function generateApiKey(): Promise<{ key: string; id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { count, error: countError } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= 10) {
    throw new Error("You can have up to 10 active API keys. Revoke an old key before creating another.");
  }

  // 24 random bytes → 48-char hex string
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const rawKey = `ogfy_live_${hex}`;
  const keyHash = await sha256hex(rawKey);
  // Store the first 20 chars as a safe display preview (not enough to authenticate)
  const keyPreview = rawKey.slice(0, 20);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, key_hash: keyHash, key_preview: keyPreview })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return { key: rawKey, id: data.id };
}

/**
 * Soft-deletes an API key by setting revoked_at.
 * The user_id check ensures users can only revoke their own keys.
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

/** Signs the user out and redirects to /login. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
