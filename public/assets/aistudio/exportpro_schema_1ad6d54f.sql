-- =====================================================================
-- ExportPro ERP : Supabase / PostgreSQL schema  (Phase 1)
-- Run in the Supabase SQL editor. NOT yet executed against a live DB.
--
-- DESIGN RULES (these prevent double counting):
--  1. COSTS are recognised once, when incurred (purchase, stitching job,
--     expense, shipment). They are stored in the company BASE currency.
--  2. PAYMENTS (to suppliers / from customers) are cash movements only.
--     They never enter profit. Supplier "paid" = SUM(supplier_payments).
--  3. Customer advances are rows in customer_payments (kind='advance').
--     They reduce receivable but are never revenue.
--  4. Revenue = SUM(order_items.qty * rate) in ORDER currency; converted
--     with orders.fx_to_base.
--  5. Every table carries company_id; RLS isolates companies.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
create type user_role      as enum ('admin','staff');
create type order_status   as enum ('inquiry','quotation_sent','confirmed','material_purchasing',
  'cutting','stitching','printing','embroidery','finishing','quality_checking','packing',
  'ready_to_ship','shipped','delivered','completed');
create type vendor_type    as enum ('fabric','accessories','stitcher','printer','embroidery',
  'shipping','other');
create type stock_unit     as enum ('kg','meter','piece','yard','box');
create type stock_kind     as enum ('fabric','accessory','finished_goods','packing_material');
create type accessory_cat  as enum ('zipper','button','label','tag','poly_bag','carton','thread',
  'elastic','drawstring','other');
create type expense_cat    as enum ('cutting','printing','embroidery','washing','finishing','ironing',
  'quality_control','packing','labor','electricity','transport','other');
create type ship_method    as enum ('air','sea','courier');
create type pay_method     as enum ('bank_transfer','cash','cheque','lc','card','other');
create type cust_pay_kind  as enum ('advance','payment');

-- ---------- TENANCY / AUTH ----------
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text, address text, whatsapp text, email text,
  base_currency char(3) not null default 'USD',
  tax_percent numeric(5,2) default 0,
  invoice_template jsonb default '{}', quotation_template jsonb default '{}',
  created_at timestamptz default now()
);

create table profiles (               -- one row per auth user
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  full_name text, role user_role not null default 'staff',
  created_at timestamptz default now()
);

create function current_company_id() returns uuid
language sql stable security definer set search_path = public as
$$ select company_id from profiles where id = auth.uid() $$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role = 'admin' from profiles where id = auth.uid()), false) $$;

-- ---------- MASTER DATA ----------
create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null, company_name text, country text, email text, whatsapp text, address text,
  currency char(3) not null default 'USD', reference_no text,
  created_at timestamptz default now()
);

create table vendors (                -- suppliers, stitchers, printers, shippers...
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null, type vendor_type not null,
  phone text, email text, address text,
  created_at timestamptz default now()
);

-- ---------- ORDERS ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_no text not null,             -- human-readable unique ID, e.g. EP-2026-0001
  customer_id uuid not null references customers(id),
  order_date date not null default current_date,
  delivery_date date,
  currency char(3) not null,
  fx_to_base numeric(18,6) not null default 1,   -- 1 order-ccy = x base-ccy
  status order_status not null default 'inquiry',
  notes text,
  created_at timestamptz default now(),
  unique (company_id, order_no)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_name text not null, description text, style_no text,
  fabric_type text, color text,
  size_breakdown jsonb default '{}',  -- {"S":100,"M":200}
  quantity integer not null check (quantity > 0),
  rate numeric(14,4) not null check (rate >= 0),  -- selling rate, order currency
  image_urls text[] default '{}',
  line_total numeric(16,2) generated always as (quantity * rate) stored
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null, changed_by uuid, changed_at timestamptz default now()
);

-- ---------- INVENTORY ----------
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind stock_kind not null, name text not null, unit stock_unit not null,
  gsm integer, color text,
  qty_on_hand numeric(16,3) not null default 0,   -- maintained by trigger ONLY
  created_at timestamptz default now()
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  item_id uuid not null references inventory_items(id),
  order_id uuid references orders(id),
  qty numeric(16,3) not null,         -- + in, - out
  reason text not null,               -- purchase | consumption | production_output | adjustment
  ref_table text, ref_id uuid,
  moved_at timestamptz default now()
);

create function apply_stock_movement() returns trigger language plpgsql as $$
begin
  update inventory_items set qty_on_hand = qty_on_hand + new.qty where id = new.item_id;
  if (select qty_on_hand from inventory_items where id = new.item_id) < 0 then
    raise exception 'Insufficient stock for item %', new.item_id;
  end if;
  return new;
end $$;
create trigger trg_stock after insert on stock_movements
  for each row execute function apply_stock_movement();

-- ---------- PURCHASES (cost recognised here) ----------
create table fabric_purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid not null references orders(id),
  vendor_id uuid not null references vendors(id),
  item_id uuid not null references inventory_items(id),
  purchase_date date not null default current_date,
  invoice_no text,
  quantity numeric(16,3) not null check (quantity > 0),   -- kg or meters (item unit)
  rate numeric(14,4) not null check (rate >= 0),
  transport_charges numeric(14,2) not null default 0,
  fabric_waste numeric(16,3) default 0,
  consumption_per_piece numeric(10,4),
  total_cost numeric(16,2) generated always as (quantity * rate + transport_charges) stored
);

create table accessory_purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid references orders(id),
  vendor_id uuid not null references vendors(id),
  item_id uuid not null references inventory_items(id),
  category accessory_cat not null,
  purchase_date date not null default current_date,
  quantity numeric(16,3) not null check (quantity > 0),
  rate numeric(14,4) not null check (rate >= 0),
  total_cost numeric(16,2) generated always as (quantity * rate) stored
);

-- stock IN on purchase
create function purchase_to_stock() returns trigger language plpgsql as $$
begin
  insert into stock_movements(company_id,item_id,order_id,qty,reason,ref_table,ref_id)
  values (new.company_id,new.item_id,new.order_id,new.quantity,'purchase',tg_table_name,new.id);
  return new;
end $$;
create trigger trg_fabric_stock after insert on fabric_purchases
  for each row execute function purchase_to_stock();
create trigger trg_acc_stock after insert on accessory_purchases
  for each row execute function purchase_to_stock();

-- ---------- PRODUCTION ----------
create table stitching_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid not null references orders(id),
  vendor_id uuid not null references vendors(id),       -- type = stitcher
  order_item_id uuid references order_items(id),
  qty_given integer not null check (qty_given > 0),
  qty_completed integer not null default 0,
  rate_per_piece numeric(12,4) not null,
  date_given date not null default current_date,
  completion_date date,
  check (qty_completed <= qty_given),
  qty_pending integer generated always as (qty_given - qty_completed) stored,
  total_cost numeric(16,2) generated always as (qty_completed * rate_per_piece) stored
);

create table expenses (               -- cutting, printing, embroidery, washing, packing...
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid references orders(id),      -- null = general overhead
  vendor_id uuid references vendors(id),
  category expense_cat not null,
  expense_date date not null default current_date,
  description text,
  amount numeric(16,2) not null check (amount >= 0)   -- base currency
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid not null references orders(id),
  vendor_id uuid references vendors(id),    -- shipping company / forwarder
  method ship_method not null, country text, tracking_no text,
  cartons integer, total_pieces integer,
  gross_weight numeric(12,3), net_weight numeric(12,3),
  shipping_cost numeric(14,2) not null default 0,
  customs_cost numeric(14,2) not null default 0,
  insurance numeric(14,2) not null default 0,
  ship_date date, expected_delivery date, actual_delivery date,
  total_expense numeric(16,2) generated always as
    (shipping_cost + customs_cost + insurance) stored
);

-- ---------- MONEY (cash movements only) ----------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_id uuid not null references orders(id),
  invoice_no text not null, invoice_date date not null default current_date,
  amount numeric(16,2) not null,            -- order currency
  unique (company_id, invoice_no)
);

create table customer_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid not null references customers(id),
  order_id uuid references orders(id),      -- null = unallocated advance
  invoice_id uuid references invoices(id),
  kind cust_pay_kind not null default 'payment',
  pay_date date not null default current_date, method pay_method default 'bank_transfer',
  currency char(3) not null, amount numeric(16,2) not null check (amount > 0),
  rate_to_order numeric(18,6) not null default 1,   -- payment ccy -> order ccy
  applied_amount numeric(16,2) generated always as (amount * rate_to_order) stored,
  bank_charges_base numeric(14,2) not null default 0,   -- base ccy, counted as cost
  reference text
);

create table supplier_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  vendor_id uuid not null references vendors(id),
  order_id uuid references orders(id),
  pay_date date not null default current_date, method pay_method default 'bank_transfer',
  amount numeric(16,2) not null check (amount > 0),     -- base currency
  reference text
);

create table quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  quote_no text not null, customer_id uuid not null references customers(id),
  quote_date date default current_date, currency char(3) not null,
  delivery_terms text, payment_terms text, converted_order_id uuid references orders(id),
  unique (company_id, quote_no)
);
create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  quotation_id uuid not null references quotations(id) on delete cascade,
  product_name text not null, quantity integer not null, rate numeric(14,4) not null,
  line_total numeric(16,2) generated always as (quantity * rate) stored
);

-- ---------- AUDIT LOG ----------
create table audit_logs (
  id bigint generated always as identity primary key,
  company_id uuid, user_id uuid default auth.uid(),
  table_name text, row_id uuid, action text, old_data jsonb, new_data jsonb,
  at timestamptz default now()
);
create function audit() returns trigger language plpgsql security definer as $$
begin
  insert into audit_logs(company_id,table_name,row_id,action,old_data,new_data)
  values (coalesce(new.company_id, old.company_id), tg_table_name,
          coalesce(new.id, old.id), tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['customer_payments','supplier_payments','invoices','expenses',
    'fabric_purchases','accessory_purchases','stitching_jobs','shipments','orders'] loop
    execute format('create trigger trg_audit_%1$s after insert or update or delete on %1$s
      for each row execute function audit()', t);
  end loop;
end $$;

-- ---------- ROW LEVEL SECURITY (data isolation + roles) ----------
do $$ declare t text; begin
  foreach t in array array['customers','vendors','orders','order_items','order_status_history',
    'inventory_items','stock_movements','fabric_purchases','accessory_purchases','stitching_jobs',
    'expenses','shipments','invoices','customer_payments','supplier_payments','quotations',
    'quotation_items'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy co_select on %I for select using (company_id = current_company_id())', t);
    execute format('create policy co_insert on %I for insert with check (company_id = current_company_id())', t);
    execute format('create policy co_update on %I for update using (company_id = current_company_id())', t);
    -- only admins may delete
    execute format('create policy co_delete on %I for delete using (company_id = current_company_id() and is_admin())', t);
  end loop;
end $$;
alter table companies  enable row level security;
alter table profiles   enable row level security;
alter table audit_logs enable row level security;
create policy own_company  on companies  for select using (id = current_company_id());
create policy admin_update on companies  for update using (id = current_company_id() and is_admin());
create policy same_company on profiles   for select using (company_id = current_company_id());
create policy admin_manage on profiles   for all    using (company_id = current_company_id() and is_admin());
create policy admin_audit  on audit_logs for select using (company_id = current_company_id() and is_admin());

-- ---------- PROFIT ENGINE ----------
-- Scalar subqueries per cost bucket => no join fan-out => no double counting.
create view order_profit with (security_invoker = true) as
select
  o.id as order_id, o.company_id, o.order_no, o.customer_id, o.currency, o.fx_to_base, o.status,
  q.pieces,
  r.revenue                                              as revenue_order_ccy,
  r.revenue * o.fx_to_base                               as revenue_base,
  c.fabric, c.accessories, c.stitching, c.printing, c.embroidery, c.washing, c.packing,
  c.other_exp, c.shipping, bc.bank_charges,
  (c.fabric + c.accessories + c.stitching + c.printing + c.embroidery + c.washing
    + c.packing + c.other_exp + c.shipping + bc.bank_charges)               as total_cost_base,
  r.revenue * o.fx_to_base
    - (c.fabric + c.accessories + c.stitching + c.printing + c.embroidery + c.washing
       + c.packing + c.other_exp + c.shipping + bc.bank_charges)            as net_profit_base,
  (r.revenue * o.fx_to_base
    - (c.fabric + c.accessories + c.stitching + c.printing + c.embroidery + c.washing
       + c.packing + c.other_exp + c.shipping + bc.bank_charges)) / nullif(o.fx_to_base,0)
                                                                            as net_profit_order_ccy,
  (r.revenue * o.fx_to_base
    - (c.fabric + c.accessories + c.stitching + c.printing + c.embroidery + c.washing
       + c.packing + c.other_exp + c.shipping + bc.bank_charges)) / nullif(q.pieces,0)
                                                                            as profit_per_piece_base,
  100 * (r.revenue * o.fx_to_base
    - (c.fabric + c.accessories + c.stitching + c.printing + c.embroidery + c.washing
       + c.packing + c.other_exp + c.shipping + bc.bank_charges)) / nullif(r.revenue * o.fx_to_base,0)
                                                                            as margin_pct,
  r.revenue - p.received                                 as customer_receivable_order_ccy
from orders o
cross join lateral (select coalesce(sum(line_total),0) revenue from order_items where order_id=o.id) r
cross join lateral (select coalesce(sum(quantity),0) pieces from order_items where order_id=o.id) q
cross join lateral (select coalesce(sum(applied_amount),0) received
                    from customer_payments where order_id=o.id) p
cross join lateral (select coalesce(sum(bank_charges_base),0) bank_charges
                    from customer_payments where order_id=o.id) bc
cross join lateral (select
  (select coalesce(sum(total_cost),0) from fabric_purchases    where order_id=o.id) fabric,
  (select coalesce(sum(total_cost),0) from accessory_purchases where order_id=o.id) accessories,
  (select coalesce(sum(total_cost),0) from stitching_jobs      where order_id=o.id) stitching,
  (select coalesce(sum(amount),0) from expenses where order_id=o.id and category='printing')   printing,
  (select coalesce(sum(amount),0) from expenses where order_id=o.id and category='embroidery') embroidery,
  (select coalesce(sum(amount),0) from expenses where order_id=o.id and category='washing')    washing,
  (select coalesce(sum(amount),0) from expenses where order_id=o.id and category='packing')    packing,
  (select coalesce(sum(amount),0) from expenses where order_id=o.id
     and category not in ('printing','embroidery','washing','packing'))                        other_exp,
  (select coalesce(sum(total_expense),0) from shipments where order_id=o.id)                  shipping
) c;

-- Vendor ledger: purchases/work done minus payments made
create view vendor_balances with (security_invoker = true) as
select v.id as vendor_id, v.company_id, v.name, v.type,
       b.billed, coalesce(p.paid,0) as paid, b.billed - coalesce(p.paid,0) as payable
from vendors v
cross join lateral (select
    (select coalesce(sum(total_cost),0) from fabric_purchases    where vendor_id=v.id)
  + (select coalesce(sum(total_cost),0) from accessory_purchases where vendor_id=v.id)
  + (select coalesce(sum(total_cost),0) from stitching_jobs      where vendor_id=v.id)
  + (select coalesce(sum(amount),0)     from expenses            where vendor_id=v.id)
  + (select coalesce(sum(total_expense),0) from shipments        where vendor_id=v.id) as billed) b
left join lateral (select sum(amount) paid from supplier_payments where vendor_id=v.id) p on true;

-- Customer ledger summary
create view customer_balances with (security_invoker = true) as
select c.id as customer_id, c.company_id, c.name, c.currency,
       coalesce(sum(op.revenue_order_ccy),0) as total_sales,
       coalesce(sum(op.revenue_order_ccy - op.customer_receivable_order_ccy),0) as total_received,
       coalesce(sum(op.customer_receivable_order_ccy),0) as balance
from customers c left join order_profit op on op.customer_id = c.id
group by c.id;

-- Fast-lookup indexes
create index on orders(company_id, status);
create index on order_items(order_id);
create index on fabric_purchases(order_id);   create index on fabric_purchases(vendor_id);
create index on accessory_purchases(order_id);create index on accessory_purchases(vendor_id);
create index on stitching_jobs(order_id);     create index on stitching_jobs(vendor_id);
create index on expenses(order_id);           create index on expenses(vendor_id);
create index on shipments(order_id);
create index on customer_payments(order_id);  create index on customer_payments(customer_id);
create index on supplier_payments(vendor_id);

-- ---------- DEMO DATA + WORKFLOW TEST ----------
-- Usage:  select seed_demo_data('<your company uuid>');
--         select order_no, revenue_base, total_cost_base, net_profit_base, margin_pct
--         from order_profit;
-- Expected for the demo order: revenue 12,000 USD; costs 2,200+300+1,500+400+450+600+250 = 5,700
-- (incl. 50 bank charges) -> net profit 6,300... see comments below.
create function seed_demo_data(cid uuid) returns void language plpgsql as $$
declare cu uuid; vf uuid; vs uuid; vsh uuid; o uuid; fab uuid;
begin
  insert into customers(company_id,name,company_name,country,currency)
    values (cid,'John Miller','Miller Apparel','USA','USD') returning id into cu;
  insert into vendors(company_id,name,type) values (cid,'Lahore Fabrics','fabric') returning id into vf;
  insert into vendors(company_id,name,type) values (cid,'Ali Stitching','stitcher') returning id into vs;
  insert into vendors(company_id,name,type) values (cid,'DHL Express','shipping') returning id into vsh;
  insert into inventory_items(company_id,kind,name,unit,gsm,color)
    values (cid,'fabric','Fleece','kg',280,'Navy') returning id into fab;

  insert into orders(company_id,order_no,customer_id,currency,fx_to_base,status)
    values (cid,'EP-DEMO-0001',cu,'USD',1,'confirmed') returning id into o;
  insert into order_items(company_id,order_id,product_name,style_no,quantity,rate)
    values (cid,o,'Fleece Hoodie','HD-100',1000,12.00);              -- revenue 12,000

  insert into fabric_purchases(company_id,order_id,vendor_id,item_id,quantity,rate,transport_charges)
    values (cid,o,vf,fab,500,4.00,100);                              -- 2,100
  insert into stitching_jobs(company_id,order_id,vendor_id,qty_given,qty_completed,rate_per_piece)
    values (cid,o,vs,1000,1000,1.50);                                -- 1,500
  insert into expenses(company_id,order_id,category,amount) values
    (cid,o,'printing',400),(cid,o,'packing',250),(cid,o,'cutting',150);
  insert into shipments(company_id,order_id,vendor_id,method,shipping_cost,customs_cost,insurance)
    values (cid,o,vsh,'air',800,100,50);                             -- 950
  insert into customer_payments(company_id,customer_id,order_id,kind,currency,amount,bank_charges_base)
    values (cid,cu,o,'advance','USD',4000,25);
  insert into supplier_payments(company_id,vendor_id,order_id,amount) values (cid,vf,o,1000);
  -- Costs: 2100+1500+400+250+150+950+25 = 5,375
  -- Net profit = 12,000 - 5,375 = 6,625 ; margin 55.21% ; per piece 6.625
  -- Receivable = 12,000 - 4,000 = 8,000 (advance is NOT profit)
  -- Fabric payable (Lahore Fabrics) = 2,100 - 1,000 = 1,100 ; stock left = 500 kg
end $$;
