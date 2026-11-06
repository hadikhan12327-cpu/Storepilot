-- =====================================================================
-- StorePilot: Complete Supabase Production Schema
-- Multi-Tenant E-Commerce Platform with Row Level Security (RLS)
-- Incorporates Milestone 1 + Milestone 2/3 (Products, Orders, Customers, Inventory, Storefronts)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- 1. PLANS (Public, read-only) ----------
create table if not exists public.plans (
  code text primary key,
  name text not null,
  price_monthly numeric(8,2) not null default 0,
  max_stores integer not null check (max_stores > 0),
  features jsonb default '[]'::jsonb
);

insert into public.plans (code, name, price_monthly, max_stores, features) values
  ('free',         'Free',         0,  1, '["1 Online Store", "Up to 25 Products", "Standard Checkout", "Basic Analytics", "Community Support"]'::jsonb),
  ('starter',      'Starter',      9,  1, '["1 Online Store", "Unlimited Products", "Custom Domain Support", "Discount Coupons", "Standard Analytics", "Email Support"]'::jsonb),
  ('business',     'Business',    19,  3, '["3 Online Stores", "Unlimited Products", "Inventory Alerts", "Customer Accounts", "Automated Invoicing", "Priority Support"]'::jsonb),
  ('professional', 'Professional',39, 10, '["10 Online Stores", "Dedicated Account Manager", "Custom Themes & CSS", "Multi-Currency & Taxes", "Advanced Analytics", "24/7 Phone & Chat Support"]'::jsonb)
on conflict (code) do update
  set name = excluded.name,
      price_monthly = excluded.price_monthly,
      max_stores = excluded.max_stores,
      features = excluded.features;

-- ---------- 2. PROFILES (1 per auth user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan_code text not null default 'free' references public.plans(code),
  created_at timestamptz not null default now()
);

-- ---------- 3. SUPER ADMINS ----------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- 4. STORES (Tenants) ----------
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
create index if not exists stores_slug_idx on public.stores(slug);

-- ---------- 5. STORE SETTINGS & THEMES ----------
create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  theme_color text not null default '#4f46e5',
  font_family text not null default 'Inter',
  logo_url text,
  banner_url text,
  banner_heading text default 'Welcome to our store',
  banner_subheading text default 'Find handpicked quality products curated just for you.',
  announcement text default 'Free worldwide shipping on orders over $50!',
  show_announcement boolean not null default true,
  tax_rate numeric(5,2) not null default 5.00,
  shipping_flat_rate numeric(8,2) not null default 5.00,
  free_shipping_threshold numeric(8,2) not null default 50.00,
  social_instagram text,
  social_twitter text,
  social_facebook text,
  meta_title text,
  meta_description text,
  updated_at timestamptz not null default now()
);

-- ---------- 6. CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index if not exists categories_store_idx on public.categories(store_id);

-- ---------- 7. PRODUCTS ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price >= price or compare_at_price is null),
  cost_per_item numeric(10,2) default 0,
  sku text,
  barcode text,
  track_quantity boolean not null default true,
  quantity integer not null default 0 check (quantity >= 0),
  status text not null default 'active' check (status in ('active','draft','archived')),
  images text[] default '{}',
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index if not exists products_store_idx on public.products(store_id);
create index if not exists products_status_idx on public.products(store_id, status);

-- ---------- 8. PRODUCT VARIANTS ----------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  sku text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  quantity integer not null default 0,
  option1_name text,
  option1_value text,
  option2_name text,
  option2_value text,
  created_at timestamptz not null default now()
);
create index if not exists variants_product_idx on public.product_variants(product_id);

-- ---------- 9. CUSTOMERS ----------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  address jsonb default '{}'::jsonb,
  orders_count integer not null default 0,
  total_spent numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique(store_id, email)
);
create index if not exists customers_store_idx on public.customers(store_id);

-- ---------- 10. COUPONS / DISCOUNTS ----------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_amount numeric(10,2) not null default 0,
  usage_limit integer,
  times_used integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(store_id, code)
);
create index if not exists coupons_store_idx on public.coupons(store_id);

-- ---------- 11. ORDERS ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  shipping numeric(12,2) not null default 0 check (shipping >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency char(3) not null default 'USD',
  status text not null default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  payment_status text not null default 'paid' check (payment_status in ('unpaid','paid','refunded')),
  shipping_address jsonb not null default '{}'::jsonb,
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  unique(store_id, order_number)
);
create index if not exists orders_store_idx on public.orders(store_id);
create index if not exists orders_created_idx on public.orders(store_id, created_at desc);

-- ---------- 12. ORDER ITEMS ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  variant_title text,
  sku text,
  price numeric(10,2) not null check (price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  image_url text
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- 13. SECURITY FUNCTIONS & TRIGGERS ----------
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.platform_admins where user_id = auth.uid()) $$;

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

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- Enforce store count limit based on merchant's active plan
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

-- Auto-create store_settings row when a store is created
create or replace function public.handle_new_store() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.store_settings (store_id) values (new.id);
  return new;
end $$;

drop trigger if exists trg_new_store on public.stores;
create trigger trg_new_store after insert on public.stores
  for each row execute function public.handle_new_store();

-- Admin actions
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

-- ---------- 14. ROW LEVEL SECURITY (RLS) POLICIES ----------
alter table public.plans           enable row level security;
alter table public.profiles        enable row level security;
alter table public.platform_admins enable row level security;
alter table public.stores          enable row level security;
alter table public.store_settings   enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers       enable row level security;
alter table public.coupons         enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;

-- Plans: everyone can read
create policy plans_select on public.plans for select using (true);

-- Profiles: user or platform admin can select, user can update full_name
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Platform admins: user can check if they are admin
create policy admins_self on public.platform_admins for select
  using (user_id = auth.uid());

-- Stores:
-- Public can view active stores (for storefronts)
create policy stores_select_public on public.stores for select
  using (status = 'active' or owner_id = auth.uid() or public.is_platform_admin());
create policy stores_insert on public.stores for insert
  with check (owner_id = auth.uid());
create policy stores_update on public.stores for update
  using (owner_id = auth.uid() and status = 'active') with check (owner_id = auth.uid());
create policy stores_delete on public.stores for delete
  using (owner_id = auth.uid());

-- Store Settings:
create policy store_settings_select on public.store_settings for select
  using (true);
create policy store_settings_update on public.store_settings for update
  using (exists (select 1 from public.stores s where s.id = store_settings.store_id and s.owner_id = auth.uid()));

-- Categories:
create policy categories_select on public.categories for select
  using (true);
create policy categories_write on public.categories for all
  using (exists (select 1 from public.stores s where s.id = categories.store_id and s.owner_id = auth.uid()));

-- Products:
-- Public storefronts can view active products of active stores
create policy products_select on public.products for select
  using (status = 'active' or exists (select 1 from public.stores s where s.id = products.store_id and (s.owner_id = auth.uid() or public.is_platform_admin())));
create policy products_write on public.products for all
  using (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = auth.uid()));

-- Product Variants:
create policy variants_select on public.product_variants for select
  using (true);
create policy variants_write on public.product_variants for all
  using (exists (select 1 from public.stores s where s.id = product_variants.store_id and s.owner_id = auth.uid()));

-- Customers:
create policy customers_merchant on public.customers for all
  using (exists (select 1 from public.stores s where s.id = customers.store_id and s.owner_id = auth.uid()));

-- Coupons:
create policy coupons_select on public.coupons for select
  using (is_active = true or exists (select 1 from public.stores s where s.id = coupons.store_id and s.owner_id = auth.uid()));
create policy coupons_write on public.coupons for all
  using (exists (select 1 from public.stores s where s.id = coupons.store_id and s.owner_id = auth.uid()));

-- Orders:
-- Merchant can view & manage their store orders
create policy orders_merchant on public.orders for all
  using (exists (select 1 from public.stores s where s.id = orders.store_id and s.owner_id = auth.uid()));
-- Public/Customer can create order via checkout
create policy orders_insert_public on public.orders for insert
  with check (exists (select 1 from public.stores s where s.id = orders.store_id and s.status = 'active'));

-- Order Items:
create policy order_items_merchant on public.order_items for all
  using (exists (select 1 from public.stores s where s.id = order_items.store_id and s.owner_id = auth.uid()));
create policy order_items_insert_public on public.order_items for insert
  with check (exists (select 1 from public.stores s where s.id = order_items.store_id and s.status = 'active'));

-- ---------- 15. STORAGE BUCKET ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists store_assets_insert on storage.objects;
create policy store_assets_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'store-assets' and exists (
    select 1 from public.stores s
     where s.id::text = (storage.foldername(name))[1] and s.owner_id = auth.uid() and s.status = 'active'));

drop policy if exists store_assets_select on storage.objects;
create policy store_assets_select on storage.objects for select
  using (bucket_id = 'store-assets');
