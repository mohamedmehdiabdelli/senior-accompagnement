-- ============================================================
-- Tamini — Multi-Tenant B2B SaaS Migration (Phase 1)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- This migration upgrades the prototype schema to a strict
-- multi-tenant hierarchy:
--   Super Admin  (owns the facility)
--   Admin        (appointed by Super Admin)
--   Caregiver    (staff, scoped to facility)
--   Family       (external family member, scoped by profile)
--
-- Order of execution is carefully sequenced to respect FK deps.
-- ============================================================

-- ============================================================
-- STEP 1 — Facilities (new root table for multi-tenancy)
-- ============================================================
create table if not exists facilities (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  address     text        not null default '',
  created_at  timestamptz default now()
);

comment on table  facilities       is 'Root multi-tenant entity — a retirement home / nursing facility';
comment on column facilities.name   is 'Display name of the retirement home';
comment on column facilities.address is 'Physical address of the facility';

-- ============================================================
-- STEP 2 — Profiles (extend for multi-tenancy + new roles)
-- ============================================================

-- 2a. Add facility_id FK (nullable so orphan profiles can exist briefly)
alter table profiles
  add column facility_id uuid references facilities(id) on delete set null;

-- 2b. Drop the old role check constraint
alter table profiles
  drop constraint if exists profiles_role_check;

-- 2c. Add the new role check constraint
alter table profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'caregiver', 'family'));

comment on column profiles.role        is 'super_admin | admin | caregiver | family';
comment on column profiles.facility_id is 'FK to facilities — null only for system-level accounts';

-- 2d. Rebuild the auto-signup trigger for the new role set
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name, facility_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'caregiver'),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    (new.raw_user_meta_data->>'facility_id')::uuid
  )
  on conflict (id) do update set
    email       = excluded.email,
    role        = excluded.role,
    full_name   = excluded.full_name,
    facility_id = coalesce(excluded.facility_id, profiles.facility_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STEP 3 — Seniors (bind to facility + fix caregiver_id)
-- ============================================================

-- 3a. Add facility_id
alter table seniors
  add column facility_id uuid references facilities(id) on delete cascade;

-- 3b. Drop the text default so existing 'local' values don't poison the FK
alter table seniors
  alter column caregiver_id drop default;

-- 3c. Cast caregiver_id from text → uuid; invalid values become NULL.
--     NOTE: Existing rows with caregiver_id = 'local' will be set to NULL.
--     After migration, an admin should reassign these rows to a real profile.
alter table seniors
  alter column caregiver_id type uuid
  using (
    case
      when caregiver_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then caregiver_id::uuid
      else null
    end
  );

-- 3d. Add FK to profiles
alter table seniors
  add constraint seniors_caregiver_id_fkey
  foreign key (caregiver_id) references profiles(id) on delete cascade;

comment on column seniors.facility_id   is 'FK to facilities — scopes the senior to a retirement home';
comment on column seniors.caregiver_id  is 'FK to profiles — the caregiver responsible for this senior';

-- ============================================================
-- STEP 4 — Clothing Items (add senior_id + facility_id)
-- ============================================================

alter table clothing_items
  add column facility_id uuid references facilities(id) on delete cascade;

alter table clothing_items
  add column senior_id uuid references seniors(id) on delete set null;

comment on column clothing_items.facility_id is 'FK to facilities — scopes the garment to a retirement home';
comment on column clothing_items.senior_id    is 'FK to seniors — which resident this garment belongs to';

-- ============================================================
-- STEP 5 — Doctors (new table, inferred from src/lib/db.ts)
-- ============================================================
create table if not exists doctors (
  id            uuid        primary key default gen_random_uuid(),
  facility_id   uuid        not null references facilities(id) on delete cascade,
  name          text        not null,
  specialty     text        not null default '',
  image_url     text        default '',
  availability  text        not null default '',
  phone         text        not null default '',
  price         text        not null default '',
  rating        numeric(2,1) default 0.0,
  active        boolean     not null default true,
  created_at    timestamptz default now()
);

comment on table  doctors          is 'Directory of doctors available to a facility';
comment on column doctors.facility_id is 'FK to facilities — each facility manages its own doctor list';

-- ============================================================
-- STEP 6 — Psychologists (new table, inferred from src/lib/db.ts)
-- ============================================================
create table if not exists psychologists (
  id            uuid        primary key default gen_random_uuid(),
  facility_id   uuid        not null references facilities(id) on delete cascade,
  name          text        not null,
  specialty     text        not null default '',
  image_url     text        default '',
  availability  text        not null default '',
  phone         text        not null default '',
  price         text        not null default '',
  active        boolean     not null default true,
  created_at    timestamptz default now()
);

comment on table  psychologists          is 'Directory of psychologists available to a facility';
comment on column psychologists.facility_id is 'FK to facilities — each facility manages its own psychologist list';

-- ============================================================
-- STEP 7 — Family Contacts (new table, inferred from types)
-- ============================================================
create table if not exists family_contacts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  name        text        not null,
  relation    text        not null default '',
  phone       text        not null default '',
  image_url   text        default '',
  created_at  timestamptz default now()
);

comment on table  family_contacts    is 'Emergency contacts linked to a user profile';
comment on column family_contacts.user_id is 'FK to profiles — the profile this contact belongs to';

-- ============================================================
-- STEP 8 — Reminders (fix user_id type to uuid FK)
-- ============================================================

-- 8a. Drop default to prevent 'local' from poisoning new rows
alter table reminders
  alter column user_id drop default;

-- 8b. Cast text → uuid; invalid values (e.g. 'local') become NULL.
--     NOTE: Existing 'local' rows will have NULL user_id and must be reassigned.
alter table reminders
  alter column user_id type uuid
  using (
    case
      when user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then user_id::uuid
      else null
    end
  );

-- 8c. Add FK to profiles
alter table reminders
  add constraint reminders_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- 8d. Add facility_id for tenant scoping
alter table reminders
  add column facility_id uuid references facilities(id) on delete cascade;

comment on column reminders.user_id     is 'FK to profiles — owner of this reminder';
comment on column reminders.facility_id is 'FK to facilities — scopes reminders to a retirement home';

-- ============================================================
-- STEP 9 — Indexes (B-Tree for performance)
-- ============================================================

-- 9a. facility_id indexes on all tenant-scoped tables
create index if not exists idx_profiles_facility_id       on profiles (facility_id);
create index if not exists idx_seniors_facility_id        on seniors (facility_id);
create index if not exists idx_clothing_items_facility_id on clothing_items (facility_id);
create index if not exists idx_reminders_facility_id      on reminders (facility_id);
create index if not exists idx_doctors_facility_id        on doctors (facility_id);
create index if not exists idx_psychologists_facility_id  on psychologists (facility_id);

-- 9b. senior_id + date indexes on the care module tables
create index if not exists idx_medicines_senior_date  on medicines (senior_id, date);
create index if not exists idx_vitals_senior_date     on vitals (senior_id, date);
create index if not exists idx_care_logs_senior_date  on care_logs (senior_id, created_at desc);

-- 9c. FK index for family_contacts
create index if not exists idx_family_contacts_user_id on family_contacts (user_id);

-- ============================================================
-- STEP 10 — Notify / Summary
-- ============================================================
do $$
begin
  raise notice '============================================================';
  raise notice 'Migration v2 complete.';
  raise notice '============================================================';
  raise notice 'Tables created : facilities, doctors, psychologists, family_contacts';
  raise notice 'Tables altered : profiles, seniors, clothing_items, reminders';
  raise notice '';
  raise notice '⚠️  Existing rows with text-based user_id/caregiver_id';
  raise notice '   (e.g. ''local'') have been set to NULL. An admin must';
  raise notice '   reassign these rows to real profile UUIDs before the app';
  raise notice '   can use them.';
  raise notice '============================================================';
end;
$$;

-- ============================================================
-- END OF MIGRATION — Phase 2 will add RLS policies.
-- ============================================================
