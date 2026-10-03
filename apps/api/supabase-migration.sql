-- ============================================================
-- Ogify — Supabase schema migration
-- Run this once in the Supabase SQL editor (or via supabase db push)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ── api_keys ─────────────────────────────────────────────────────────────
-- Stores SHA-256 hashes of the raw API keys issued to users.
-- The raw key is NEVER stored — only the hash.

create table if not exists public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key_hash    text not null unique,           -- SHA-256 hex of the raw key
  key_preview text,                           -- safe prefix shown in dashboard
  label       text,                           -- optional human label ("prod key")
  last_used_at timestamptz,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz                     -- null = active
);

alter table public.api_keys
  add column if not exists key_preview text,
  add column if not exists last_used_at timestamptz;

create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);

-- ── subscriptions ─────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  plan                    text not null default 'free'
                            check (plan in ('free', 'starter', 'pro', 'business', 'lifetime')),
  renders_limit           int  not null default 100,
  paddle_subscription_id  text,
  paddle_customer_id      text,
  status                  text not null default 'active'
                            check (status in ('active', 'cancelled', 'paused')),
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_paddle_sub_idx on public.subscriptions(paddle_subscription_id);

-- ── usage ─────────────────────────────────────────────────────────────────
-- One row per user per calendar month (period = 'YYYY-MM').

create table if not exists public.usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  period        text not null,               -- e.g. '2024-11'
  renders_used  int  not null default 0,
  unique (user_id, period)
);

create index if not exists usage_user_period_idx on public.usage(user_id, period);

-- ── render_logs ───────────────────────────────────────────────────────────
-- Optional dashboard history. The API can write here after renders are wired.

create table if not exists public.render_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('template', 'url')),
  template_id text,
  status      text not null check (status in ('success', 'error', 'rate_limited')),
  duration_ms int,
  created_at  timestamptz not null default now()
);

create index if not exists render_logs_user_created_idx
  on public.render_logs(user_id, created_at desc);

-- ── RPC: increment_usage ──────────────────────────────────────────────────
-- Called from the Worker after every successful render.
-- Upserts so the first render of the month auto-creates the row.
create or replace function public.increment_usage(
  p_user_id uuid,
  p_period  text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usage (user_id, period, renders_used)
  values (p_user_id, p_period, 1)
  on conflict (user_id, period)
  do update
    set renders_used = public.usage.renders_used + 1;
end;
$$;

-- Only the backend Worker/service role should increment usage.
revoke execute on function public.increment_usage(uuid, text) from public;
revoke execute on function public.increment_usage(uuid, text) from anon;
revoke execute on function public.increment_usage(uuid, text) from authenticated;
grant execute on function public.increment_usage(uuid, text) to service_role;


── RLS policies ──────────────────────────────────────────────────────────
-- The Worker uses the SERVICE ROLE key, which bypasses RLS entirely.
-- These policies protect data when using the anon key from the browser
-- (e.g. in the Next.js dashboard).

alter table public.api_keys      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage         enable row level security;
alter table public.render_logs   enable row level security;

-- api_keys: users can only see / manage their own keys
create policy "api_keys: owner read"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "api_keys: owner insert"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "api_keys: owner update"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- subscriptions: users can only read their own subscription
create policy "subscriptions: owner read"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- usage: users can only read their own usage
create policy "usage: owner read"
  on public.usage for select
  using (auth.uid() = user_id);

-- render_logs: users can only read their own render history
create policy "render_logs: owner read"
  on public.render_logs for select
  using (auth.uid() = user_id);
