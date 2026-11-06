-- =====================================================================
-- StorePilot : Supabase schema, milestone 1  (run once in the SQL Editor)
--
-- SECURITY MODEL
--  * Every table has Row Level Security (RLS) ON. The browser only ever uses
--    the public anon key; the service-role key is never used anywhere.
--  * A merchant can only read/write rows where owner_id = auth.uid().
--  * Sensitive columns (plan, store status, owner) cannot be written by users:
--    column-level grants + security-definer functions guard them.
--  * Super admins are listed in platform_admins, which NO API call can modify
--    (add them here in the SQL editor only).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- PLANS (public, read-only) ----------
create table if not exists public.plans (
  code text primary key,
  name text not null,
  price_monthly numeric(8,2) not null default 0,
  max_stores integer not null check (max_stores > 0)
);
insert into public.plans (code, name, price_monthly, max_stores) values
  ('free',         'Free',         0,  1),
  ('starter',      'Starter',      9,  1),
  ('business',     'Business',    19,  3),
  ('professional', 'Professional',39, 10)
on conflict (code) do update
  set name = excluded.name, price_monthly = excluded.price_monthly, max_stores = excluded.max_stores;

-- ---------- PROFILES (one per auth user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan_code text not null default 'free' references public.plans(code),
  created_at timestamptz not null default now()
);

-- ---------- SUPER ADMINS ----------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- STORES (tenants) ----------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
    check (slug <> all (array['www','admin','api','app','dashboard','login','signup','auth','support',
                              'help','billing','static','assets','storepilot','mail','blog','docs','status'])),
  description text check (char_length(description) <= 500),
  currency char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  country text check (char_length(country) <= 60),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stores_owner_idx on public.stores(owner_id);

-- ---------- HELPER FUNCTIONS ----------
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.platform_admins where user_id = auth.uid()) $$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_stores_updated on public.stores;
create trigger trg_stores_updated before update on public.stores
  for each row execute function public.set_updated_at();

-- Plan limit: enforced in the database, so it cannot be bypassed from the browser.
create or replace function public.enforce_store_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim integer; cnt integer;
begin
  select p.max_stores into lim
    from public.profiles pr join public.plans p on p.code = pr.plan_code
   where pr.id = new.owner_id;
  select count(*) into cnt from public.stores where owner_id = new.owner_id;
  if cnt >= coalesce(lim, 1) then
    raise exception 'Store limit reached for your plan';
  end if;
  return new;
end $$;
drop trigger if exists trg_store_limit on public.stores;
create trigger trg_store_limit before insert on public.stores
  for each row execute function public.enforce_store_limit();

-- Super-admin actions (checked inside the function, never trusting the caller)
create or replace function public.admin_set_store_status(p_store_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Not allowed'; end if;
  if p_status not in ('active','suspended') then raise exception 'Invalid status'; end if;
  update public.stores set status = p_status where id = p_store_id;
end $$;

create or replace function public.admin_set_plan(p_user_id uuid, p_plan text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Not allowed'; end if;
  if not exists (select 1 from public.plans where code = p_plan) then raise exception 'Unknown plan'; end if;
  update public.profiles set plan_code = p_plan where id = p_user_id;
end $$;

revoke all on function public.admin_set_store_status(uuid, text) from public, anon;
revoke all on function public.admin_set_plan(uuid, text) from public, anon;
grant execute on function public.admin_set_store_status(uuid, text) to authenticated;
grant execute on function public.admin_set_plan(uuid, text) to authenticated;

-- ---------- TABLE PRIVILEGES (least privilege) ----------
revoke all on public.plans, public.profiles, public.platform_admins, public.stores from anon, authenticated;
grant select on public.plans to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;           -- plan_code/email NOT writable
grant select on public.platform_admins to authenticated;                 -- read-only, own row (see policy)
grant select on public.stores to authenticated;
grant insert (name, slug, description, currency, country) on public.stores to authenticated;
grant update (name, description, currency, country) on public.stores to authenticated;  -- owner_id/status/slug NOT writable
grant delete on public.stores to authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.plans           enable row level security;
alter table public.profiles        enable row level security;
alter table public.platform_admins enable row level security;
alter table public.stores          enable row level security;

drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to anon, authenticated using (true);

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists admins_self on public.platform_admins;
create policy admins_self on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores for select to authenticated
  using (owner_id = auth.uid() or public.is_platform_admin());
drop policy if exists stores_insert on public.stores;
create policy stores_insert on public.stores for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores for update to authenticated
  using (owner_id = auth.uid() and status = 'active') with check (owner_id = auth.uid());
drop policy if exists stores_delete on public.stores;
create policy stores_delete on public.stores for delete to authenticated
  using (owner_id = auth.uid());

-- ---------- STORAGE (ready for store logos in the next milestone) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Files live in  store-assets/<store_id>/<file>.  Only that store's active owner may write.
drop policy if exists store_assets_insert on storage.objects;
create policy store_assets_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'store-assets' and exists (
    select 1 from public.stores s
     where s.id::text = (storage.foldername(name))[1] and s.owner_id = auth.uid() and s.status = 'active'));
drop policy if exists store_assets_update on storage.objects;
create policy store_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'store-assets' and exists (
    select 1 from public.stores s
     where s.id::text = (storage.foldername(name))[1] and s.owner_id = auth.uid() and s.status = 'active'));
drop policy if exists store_assets_delete on storage.objects;
create policy store_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'store-assets' and exists (
    select 1 from public.stores s
     where s.id::text = (storage.foldername(name))[1] and s.owner_id = auth.uid()));
drop policy if exists store_assets_select_own on storage.objects;
create policy store_assets_select_own on storage.objects for select to authenticated
  using (bucket_id = 'store-assets' and exists (
    select 1 from public.stores s
     where s.id::text = (storage.foldername(name))[1] and s.owner_id = auth.uid()));

-- ---------- AFTER YOU SIGN UP: make yourself the super admin (edit the email, run once) ----------
-- insert into public.platform_admins (user_id) select id from auth.users where email = 'YOU@EXAMPLE.COM';

-- ---------- OPTIONAL ISOLATION TEST (paste user ids from Authentication > Users) ----------
-- begin;
--   set local role authenticated;
--   select set_config('request.jwt.claims', '{"sub":"USER-A-UUID","role":"authenticated"}', true);
--   select id, name, owner_id from public.stores;      -- must show ONLY user A's stores
--   select * from public.profiles;                      -- must show ONLY user A
-- rollback;
