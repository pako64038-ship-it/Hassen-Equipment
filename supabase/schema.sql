-- Hassen Equipment · store + admin database
-- Paste this whole file in Supabase → SQL Editor → Run. Safe to run again.

create extension if not exists pgcrypto;

-- ============ Staff (admin & employees) ============
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  role text not null default 'pending' check (role in ('admin','employee','pending','disabled')),
  created_at timestamptz not null default now()
);

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid()
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','employee'), false)
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

-- First account becomes admin, every later account waits for approval.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.staff (user_id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''),
          case when exists (select 1 from public.staff where role = 'admin') then 'pending' else 'admin' end)
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- An admin cannot remove the last admin.
create or replace function public.keep_one_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
     and (select count(*) from public.staff where role = 'admin') <= 1 then
    raise exception 'لازم يبقى admin واحد على الأقل';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists staff_keep_admin on public.staff;
create trigger staff_keep_admin before update or delete on public.staff
  for each row execute function public.keep_one_admin();

-- ============ Store settings ============
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Hassen Equipment',
  tagline text default 'معدات المطاعم والسناك · Équipement CHR',
  hero_title text default 'جهّز المشروع تاعك من عندنا',
  hero_text text default 'معدات Fast Food، Pizzeria، Cafétéria، Pâtisserie وRestaurant. صمّم المحل تاعك بالـ3D واطلب Devis.',
  phone text default '0556 55 45 48',
  whatsapp text default '213556554548',
  email text default '',
  address text default '',
  facebook text default '',
  instagram text default '',
  logo_url text default '',
  accent text default '#EE8A2E',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ============ Catalogue ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name_ar text not null,
  name_fr text default '',
  project_types text[] not null default '{}',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text default '',
  project_types text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_models (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12,2),
  old_price numeric(12,2),
  stock int,
  width_m numeric(6,2) default 0.6,
  depth_m numeric(6,2) default 0.6,
  height_m numeric(6,2) default 0.9,
  on_counter boolean not null default false,
  images text[] not null default '{}',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description text default '',
  price numeric(12,2) not null default 0,
  project_types text[] not null default '{}',
  images text[] not null default '{}',
  featured boolean not null default true,
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists public.pack_items (
  pack_id uuid not null references public.packs(id) on delete cascade,
  model_id uuid not null references public.product_models(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  primary key (pack_id, model_id)
);

-- ============ Orders / devis ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated by default as identity,
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 30),
  city text default '' check (char_length(city) <= 80),
  project_type text default '',
  note text default '' check (char_length(note) <= 1000),
  items jsonb not null default '[]',
  total numeric(14,2) default 0,
  status text not null default 'new' check (status in ('new','contacted','confirmed','delivered','cancelled')),
  staff_note text default '',
  handled_by uuid references auth.users(id) on delete set null
);

-- ============ Row level security ============
alter table public.staff enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_models enable row level security;
alter table public.packs enable row level security;
alter table public.pack_items enable row level security;
alter table public.orders enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
    and tablename in ('staff','settings','categories','products','product_models','packs','pack_items','orders') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- staff
create policy staff_read on public.staff for select using (user_id = auth.uid() or public.is_admin());
create policy staff_admin_update on public.staff for update using (public.is_admin()) with check (public.is_admin());
create policy staff_admin_delete on public.staff for delete using (public.is_admin());

-- settings: everyone reads, admin edits
create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- catalogue: everyone reads active rows, staff manage everything
create policy categories_read on public.categories for select using (active or public.is_staff());
create policy categories_staff on public.categories for all using (public.is_staff()) with check (public.is_staff());
create policy products_read on public.products for select using (active or public.is_staff());
create policy products_staff on public.products for all using (public.is_staff()) with check (public.is_staff());
create policy models_read on public.product_models for select using (active or public.is_staff());
create policy models_staff on public.product_models for all using (public.is_staff()) with check (public.is_staff());
create policy packs_read on public.packs for select using (active or public.is_staff());
create policy packs_staff on public.packs for all using (public.is_staff()) with check (public.is_staff());
create policy pack_items_read on public.pack_items for select using (true);
create policy pack_items_staff on public.pack_items for all using (public.is_staff()) with check (public.is_staff());

-- orders: anyone can send a new request, only staff read and handle them
create policy orders_insert on public.orders for insert with check (status = 'new' and handled_by is null and staff_note = '');
create policy orders_staff_read on public.orders for select using (public.is_staff());
create policy orders_staff_update on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy orders_admin_delete on public.orders for delete using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.settings, public.categories, public.products, public.product_models, public.packs, public.pack_items to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ============ Image storage ============
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do update set public = true;
drop policy if exists media_read on storage.objects;
drop policy if exists media_staff_insert on storage.objects;
drop policy if exists media_staff_update on storage.objects;
drop policy if exists media_staff_delete on storage.objects;
create policy media_read on storage.objects for select using (bucket_id = 'media');
create policy media_staff_insert on storage.objects for insert with check (bucket_id = 'media' and public.is_staff());
create policy media_staff_update on storage.objects for update using (bucket_id = 'media' and public.is_staff());
create policy media_staff_delete on storage.objects for delete using (bucket_id = 'media' and public.is_staff());

-- ============ Starting catalogue ============
insert into public.categories (slug, name_ar, name_fr, project_types, sort) values
  ('cuisson','الطهي','Cuisson','{}',1),
  ('froid','التبريد','Froid','{}',2),
  ('prep','التحضير','Préparation','{}',3),
  ('pizza','البيتزا','Pizza','{pizzeria,restaurant}',4),
  ('boissons','القهوة والمشروبات','Café & Boissons','{cafeteria,fastfood,patisserie,creperie,restaurant}',5),
  ('patis','الحلويات والكريب','Pâtisserie & Crêpes','{patisserie,creperie,cafeteria}',6),
  ('service','الخدمة والأثاث','Service & Mobilier','{}',7),
  ('lavage','الغسيل والتخزين','Lavage & Rangement','{}',8)
on conflict (slug) do nothing;

do $$
declare pk uuid; cat_c uuid; cat_s uuid; cat_p uuid; p uuid; m uuid;
  base text := 'https://pako64038-ship-it.github.io/Hassen-Equipment/images/';
begin
  if exists (select 1 from public.packs where slug = 'pack-snack-6') then return; end if;
  select id into cat_c from public.categories where slug = 'cuisson';
  select id into cat_s from public.categories where slug = 'service';
  select id into cat_p from public.categories where slug = 'prep';
  insert into public.packs (slug, name, description, price, project_types, images, sort)
    values ('pack-snack-6', 'Pack Snack 6 pièces', 'Snack inox 2 m avec hotte + plaque chauffante gaz + friteuse électrique 11 L Comaf Star + égouttoir + coupe-frites + presse panini Comaf.',
            169000, '{fastfood}', array[base || 'snack2m.jpg'], 1)
    returning id into pk;

  insert into public.products (category_id, name, project_types, featured, sort) values (cat_s, 'Snack inox 2 m avec hotte', '{fastfood}', true, 1) returning id into p;
  insert into public.product_models (product_id, name, width_m, depth_m, height_m, images) values (p, '2 m', 2, 0.7, 2.1, array[base || 'snack2m.jpg']) returning id into m;
  insert into public.pack_items values (pk, m, 1);

  insert into public.products (category_id, name, project_types, sort) values (cat_c, 'Plaque chauffante gaz', '{fastfood}', 2) returning id into p;
  insert into public.product_models (product_id, name, width_m, depth_m, height_m, on_counter) values (p, 'Standard', 0.6, 0.5, 0.22, true) returning id into m;
  insert into public.pack_items values (pk, m, 1);

  insert into public.products (category_id, name, project_types, sort) values (cat_c, 'Friteuse électrique', '{fastfood}', 3) returning id into p;
  insert into public.product_models (product_id, name, width_m, depth_m, height_m, on_counter) values (p, 'Comaf Star 11 L', 0.32, 0.5, 0.32, true) returning id into m;
  insert into public.pack_items values (pk, m, 1);

  insert into public.products (category_id, name, project_types, sort) values (cat_c, 'Égouttoir à frites', '{fastfood}', 4) returning id into p;
  insert into public.product_models (product_id, name, width_m, depth_m, height_m, on_counter) values (p, 'Local', 0.4, 0.5, 0.3, true) returning id into m;
  insert into public.pack_items values (pk, m, 1);

  insert into public.products (category_id, name, project_types, sort) values (cat_p, 'Coupe-frites', '{fastfood}', 5) returning id into p;
  insert into public.product_models (product_id, name, width_m, depth_m, height_m, on_counter) values (p, 'Local', 0.22, 0.3, 0.5, true) returning id into m;
  insert into public.pack_items values (pk, m, 1);

  insert into public.products (category_id, name, project_types, featured, sort) values (cat_c, 'Presse panini', '{fastfood}', true, 6) returning id into p;
  insert into public.product_models (product_id, name, width_m, depth_m, height_m, on_counter, images) values (p, 'Comaf', 0.4, 0.42, 0.3, true, array[base || 'panini.jpg']) returning id into m;
  insert into public.pack_items values (pk, m, 1);
end $$;

select 'OK: Hassen Equipment database ready' as result;

-- ============ Delivery, payment and order alerts ============
alter table public.settings add column if not exists delivery_default numeric(12,2);
alter table public.settings add column if not exists delivery_prices jsonb not null default '{}';
alter table public.settings add column if not exists delivery_note text not null default '';
alter table public.settings add column if not exists pickup boolean not null default true;
alter table public.settings add column if not exists payments text[] not null default array['cod','ccp','baridimob','store'];
alter table public.settings add column if not exists ccp text not null default '';
alter table public.settings add column if not exists rip text not null default '';
alter table public.orders add column if not exists delivery_mode text not null default 'delivery' check (delivery_mode in ('delivery','pickup'));
alter table public.orders add column if not exists address text not null default '' check (char_length(address) <= 300);
alter table public.orders add column if not exists delivery_fee numeric(12,2);
alter table public.orders add column if not exists payment text not null default '' check (char_length(payment) <= 20);
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
alter table public.settings add column if not exists tiktok text not null default '';
