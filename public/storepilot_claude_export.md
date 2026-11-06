# StorePilot — Complete Claude Project Context & Codebase Export

**Project Name**: StorePilot  
**Tagline**: Build your online store. Grow your business.  
**Architecture**: React 19 + TypeScript + Tailwind CSS + Supabase PostgreSQL (Row Level Security) + Multi-Tenant SaaS  
**Version**: 1.0.0 (Milestones 1, 2, & 3 Completed)  

---

## 1. Project Overview & Tenancy Model

StorePilot is an international multi-tenant e-commerce platform similar to Shopify.
- **Tenancy**: Each merchant account can create multiple isolated online stores according to their subscription plan limit.
- **Security**: PostgreSQL Row Level Security (RLS) ensures complete tenant data isolation. The browser frontend only uses the public `anon` key; the `service_role` key is never exposed.
- **Database Engine**: Fully integrated with Supabase PostgreSQL and Storage, with a reactive local persistence engine fallback for offline and preview testing.

### Subscription Plans:
* **Free**: $0/mo — 1 Online Store, up to 25 products, standard checkout, community support.
* **Starter**: $9/mo — 1 Online Store, unlimited products, discount coupons, email support.
* **Business**: $19/mo — 3 Online Stores, inventory alerts, customer CRM, automated invoices, priority support.
* **Professional**: $39/mo — 10 Online Stores, custom themes, multi-currency & tax engine, 24/7 priority support.

---

## 2. Complete Database Schema (`public/schema_full.sql`)

```sql
-- =====================================================================
-- StorePilot: Complete Supabase Production Schema
-- Multi-Tenant E-Commerce Platform with Row Level Security (RLS)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- 1. PLANS ----------
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
  set name = excluded.name, price_monthly = excluded.price_monthly, max_stores = excluded.max_stores, features = excluded.features;

-- ---------- 2. PROFILES ----------
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

-- ---------- 4. STORES (TENANTS) ----------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
    check (slug <> all (array['www','admin','api','app','dashboard','login','signup','auth','support','help','billing','static','assets','storepilot','mail','blog','docs','status'])),
  description text check (char_length(description) <= 500),
  currency char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  country text check (char_length(country) <= 60),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stores_owner_idx on public.stores(owner_id);
create index if not exists stores_slug_idx on public.stores(slug);

-- ---------- 5. STORE SETTINGS ----------
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

-- ---------- 10. COUPONS ----------
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

-- ---------- 13. RLS POLICIES & TRIGGERS ----------
alter table public.plans           enable row level security;
alter table public.profiles        enable row level security;
alter table public.platform_admins enable row level security;
alter table public.stores          enable row level security;
alter table public.store_settings  enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers       enable row level security;
alter table public.coupons         enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;

create policy plans_select on public.plans for select using (true);
create policy profiles_select on public.profiles for select using (id = auth.uid() or exists (select 1 from public.platform_admins where user_id = auth.uid()));
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy admins_self on public.platform_admins for select using (user_id = auth.uid());

create policy stores_select_public on public.stores for select using (status = 'active' or owner_id = auth.uid() or exists (select 1 from public.platform_admins where user_id = auth.uid()));
create policy stores_insert on public.stores for insert with check (owner_id = auth.uid());
create policy stores_update on public.stores for update using (owner_id = auth.uid() and status = 'active') with check (owner_id = auth.uid());
create policy stores_delete on public.stores for delete using (owner_id = auth.uid());

create policy store_settings_select on public.store_settings for select using (true);
create policy store_settings_update on public.store_settings for update using (exists (select 1 from public.stores s where s.id = store_settings.store_id and s.owner_id = auth.uid()));

create policy categories_select on public.categories for select using (true);
create policy categories_write on public.categories for all using (exists (select 1 from public.stores s where s.id = categories.store_id and s.owner_id = auth.uid()));

create policy products_select on public.products for select using (status = 'active' or exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = auth.uid()));
create policy products_write on public.products for all using (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = auth.uid()));

create policy variants_select on public.product_variants for select using (true);
create policy variants_write on public.product_variants for all using (exists (select 1 from public.stores s where s.id = product_variants.store_id and s.owner_id = auth.uid()));

create policy customers_merchant on public.customers for all using (exists (select 1 from public.stores s where s.id = customers.store_id and s.owner_id = auth.uid()));
create policy coupons_select on public.coupons for select using (is_active = true or exists (select 1 from public.stores s where s.id = coupons.store_id and s.owner_id = auth.uid()));
create policy coupons_write on public.coupons for all using (exists (select 1 from public.stores s where s.id = coupons.store_id and s.owner_id = auth.uid()));

create policy orders_merchant on public.orders for all using (exists (select 1 from public.stores s where s.id = orders.store_id and s.owner_id = auth.uid()));
create policy orders_insert_public on public.orders for insert with check (exists (select 1 from public.stores s where s.id = orders.store_id and s.status = 'active'));

create policy order_items_merchant on public.order_items for all using (exists (select 1 from public.stores s where s.id = order_items.store_id and s.owner_id = auth.uid()));
create policy order_items_insert_public on public.order_items for insert with check (exists (select 1 from public.stores s where s.id = order_items.store_id and s.status = 'active'));
```

---

## 3. TypeScript Domain Types (`src/types/storepilot.ts`)

```typescript
export type PlanCode = 'free' | 'starter' | 'business' | 'professional';

export interface Plan {
  code: PlanCode;
  name: string;
  price_monthly: number;
  max_stores: number;
  features: string[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  plan_code: PlanCode;
  created_at: string;
  is_admin?: boolean;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  currency: string;
  country?: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  store_id: string;
  theme_color: string;
  font_family: string;
  logo_url?: string;
  banner_url?: string;
  banner_heading: string;
  banner_subheading: string;
  announcement: string;
  show_announcement: boolean;
  tax_rate: number;
  shipping_flat_rate: number;
  free_shipping_threshold: number;
  social_instagram?: string;
  social_twitter?: string;
  social_facebook?: string;
  meta_title?: string;
  meta_description?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  store_id: string;
  title: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku?: string;
  barcode?: string;
  track_quantity: boolean;
  quantity: number;
  status: 'active' | 'draft' | 'archived';
  images: string[];
  tags: string[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  orders_count: number;
  total_spent: number;
  notes?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id?: string;
  product_title: string;
  variant_title?: string;
  sku?: string;
  price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
}

export interface Order {
  id: string;
  store_id: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  tracking_number?: string;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}
```

---

## 4. Supabase Client with URL Sanitation (`src/lib/supabase.ts`)

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const sanitizeSupabaseUrl = (input: string): string => {
  if (!input) return '';
  let trimmed = input.trim();
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
};

const getEnvCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('storepilot_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('storepilot_supabase_key') : null;

  const rawUrl = storedUrl || envUrl || '';
  const url = sanitizeSupabaseUrl(rawUrl);
  const key = (storedKey || envKey || '').trim();

  const isConfigured = Boolean(
    url && key && 
    (url.includes('.supabase.co') || url.includes('localhost') || url.includes('127.0.0.1')) && 
    key.length > 20
  );

  return { url, key, isConfigured };
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getEnvCredentials();
  if (!isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return clientInstance;
};

export const saveSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('storepilot_supabase_url', sanitizeSupabaseUrl(url));
    localStorage.setItem('storepilot_supabase_key', key.trim());
    clientInstance = null;
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('storepilot_supabase_url');
    localStorage.removeItem('storepilot_supabase_key');
    clientInstance = null;
  }
};

export const getSupabaseStatus = () => {
  const { url, key, isConfigured } = getEnvCredentials();
  return {
    isConfigured,
    url: url ? url.replace(/(https?:\/\/)(.{4}).+(.{4}\.supabase\.co)/, '$1$2***$3') : '',
    rawUrl: url,
    hasKey: Boolean(key),
  };
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const { url, isConfigured } = getEnvCredentials();
  if (!isConfigured) {
    return { success: false, message: 'Supabase credentials are not configured or are incomplete.' };
  }
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Could not create client.' };

  try {
    const { error } = await client.from('plans').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: 'Connected, but tables not yet created! Run schema_full.sql in Supabase SQL Editor.' };
      }
      return { success: false, message: `Supabase returned: ${error.message}` };
    }
    return { success: true, message: 'Successfully connected to your Supabase PostgreSQL database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.' };
  }
};
```

---

## 5. UI Components Breakdown

1. **`src/App.tsx`**: Top-level coordinator routing between `website`, `dashboard`, `storefront`, and `superadmin` views.
2. **`src/components/Navbar.tsx`**: Top navigation with view switcher, active store dropdown, Supabase status badge, and profile selector.
3. **`src/components/PublicWebsite.tsx`**: Landing page, features matrix, live template showcase, pricing table ($0, $9, $19, $39), about, contact, and auth.
4. **`src/components/MerchantDashboard.tsx`**:
   - Multi-store switcher & creation with plan limit checks
   - Analytics (MRR, GMV, AOV, order volume)
   - Product catalog (CRUD, images, categories, tags, pricing)
   - Inventory manager (quantities, track quantity, quick adjust +/- buttons)
   - Order fulfillment (status transitions, tracking codes, invoice modal)
   - Customer CRM (orders placed, gross lifetime spend)
   - Promotions (percentage / fixed discount codes)
   - Store settings & customizer (theme color, announcement bar, hero banners, shipping rates, taxes, SEO metadata)
   - Dedicated **Supabase & API Keys** dashboard tab
5. **`src/components/Storefront.tsx`**:
   - Customer-facing responsive online storefront
   - Category filtering & search
   - Product quick-view modal
   - Slide-over shopping bag drawer with live coupon discounts
   - Checkout with tax, shipping, simulated payment, and confetti
   - Order tracking and printable receipts
6. **`src/components/SuperAdminDashboard.tsx`**:
   - Platform GMV, MRR, active merchants, and stores
   - Merchant plan overrides
   - Store suspension/reactivation
   - Platform database health check
7. **`src/components/InvoiceModal.tsx`**: PDF-ready printable invoice receipt.
8. **`src/components/CreateStoreModal.tsx`**: Multi-tenant store creator enforcing plan limits.
9. **`src/components/SupabaseModal.tsx`**: Modal for testing credentials and copying `schema_full.sql`.

---

## 6. How Claude Can Continue Development
This file contains the complete specification, SQL schema, types, and logic of StorePilot. You can upload this file directly into your Claude chat to:
1. Extend payment gateways (Stripe, PayPal, Lemonsqueezy).
2. Add custom domain DNS verification logic.
3. Implement automated email webhooks (Resend, SendGrid) for order confirmations.
4. Add CSV bulk product import and export.
5. Enhance multi-currency conversions using live forex rates.
