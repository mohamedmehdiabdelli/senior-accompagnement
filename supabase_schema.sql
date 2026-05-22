-- ============================================================
-- Tamini — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── USER PROFILES ──────────────────────────────────────────
-- Stores extended user info, linked 1-1 with auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('elderly','nursing_home')),
  full_name text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'elderly'),
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ─── REMINDERS ──────────────────────────────────────────────
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'local',
  type text not null check (type in ('medicine','meal','appointment','prayer','other')),
  title text not null,
  time text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz default now()
);

-- ─── SENIORS ────────────────────────────────────────────────
create table if not exists seniors (
  id uuid primary key default gen_random_uuid(),
  caregiver_id text not null default 'local',
  name text not null,
  age integer not null,
  condition text not null default '',
  image_url text default '',
  created_at timestamptz default now()
);

-- ─── MEDICINES ──────────────────────────────────────────────
create table if not exists medicines (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid references seniors(id) on delete cascade,
  name text not null,
  dosage text not null default '',
  time_of_day text not null check (time_of_day in ('Matin','Midi','Soir','Nuit')),
  taken boolean not null default false,
  date date not null default current_date
);

-- ─── VITALS ─────────────────────────────────────────────────
create table if not exists vitals (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid references seniors(id) on delete cascade,
  date date not null default current_date,
  heart_rate integer not null,
  blood_pressure_sys integer not null,
  blood_pressure_dia integer not null,
  blood_sugar numeric(5,2) not null,
  temperature numeric(4,1) not null,
  created_at timestamptz default now()
);

-- ─── CARE LOGS ──────────────────────────────────────────────
create table if not exists care_logs (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid references seniors(id) on delete cascade,
  time_label text not null default '',
  text text not null,
  author text not null,
  mood text not null check (mood in ('Souriant','Calme','Fatigué','Agité')),
  appetite text not null check (appetite in ('Excellent','Moyen','Faible')),
  sleep text not null check (sleep in ('Bon','Agité','Mauvais')),
  created_at timestamptz default now()
);

-- ─── CLOTHING ITEMS ────────────────────────────────────────
create table if not exists clothing_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  resident_name text not null,
  name text not null,
  category text not null check (category in ('Chemise','Pantalon','Robe','Pyjama','Veste','T-shirt')),
  size text not null check (size in ('XS','S','M','L','XL','XXL')),
  color text not null check (color in ('Blanc','Bleu','Gris','Beige','Noir','Rose')),
  type text not null check (type in ('Jour','Nuit','Hiver','Été','Sortie')),
  image_url text default '',
  location text not null default '',
  created_at timestamptz default now()
);

-- ─── HEALTH PRODUCTS ────────────────────────────────────────
create table if not exists health_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  price text not null default '',
  image_url text default '',
  description text default '',
  contact text default '',
  type text not null check (type in ('buy','don','sell')),
  created_at timestamptz default now()
);

-- ─── SEED DEFAULT DATA ──────────────────────────────────────
insert into health_products (name, category, price, image_url, description, contact, type) values
  ('Chaise roulante pliable', 'Mobilité', '152 Dt', 'https://images.unsplash.com/photo-1544216717-3bbf52512659?auto=format&fit=crop&q=80&w=800', 'Légère, pliable et robuste.', '29 636 686', 'buy'),
  ('Béquilles ergonomiques', 'Mobilité', '11 Dt', 'https://images.unsplash.com/photo-1579684453423-f84349ef1afb?auto=format&fit=crop&q=80&w=800', 'Réglables et confortables.', '29 636 686', 'buy'),
  ('Ceinture lombaire', 'Santé', '37 Dt', 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=800', 'Soutien du dos ergonomique.', '29 636 686', 'buy'),
  ('Attelle bras complet', 'Santé', '32 Dt', 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=800', 'Immobilisation complète du bras.', '29 636 686', 'buy')
on conflict do nothing;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
alter table profiles enable row level security;
alter table reminders enable row level security;
alter table seniors enable row level security;
alter table medicines enable row level security;
alter table vitals enable row level security;
alter table care_logs enable row level security;
alter table health_products enable row level security;

-- Profiles: users can read/write only their own row
create policy "Users read own profile"      on profiles for select using (auth.uid() = id);
create policy "Users insert own profile"    on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile"    on profiles for update using (auth.uid() = id);

-- Other tables: allow all for authenticated users (prototype mode).
-- For production, tighten per-user where appropriate.
create policy "Auth access reminders"        on reminders        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Auth access seniors"          on seniors          for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Auth access medicines"        on medicines        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Auth access vitals"           on vitals           for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Auth access care_logs"        on care_logs        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Public read health_products"  on health_products  for select using (true);
create policy "Auth write health_products"   on health_products  for insert with check (auth.role() = 'authenticated');
create policy "Auth update health_products"  on health_products  for update using (auth.role() = 'authenticated');
create policy "Auth delete health_products"  on health_products  for delete using (auth.role() = 'authenticated');

alter table clothing_items enable row level security;

create policy "Users can read own clothing items"   on clothing_items for select using (owner_id = auth.uid());
create policy "Users can insert own clothing items" on clothing_items for insert with check (owner_id = auth.uid());
create policy "Users can update own clothing items" on clothing_items for update using (owner_id = auth.uid());
create policy "Users can delete own clothing items" on clothing_items for delete using (owner_id = auth.uid());
