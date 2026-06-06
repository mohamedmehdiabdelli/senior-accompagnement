-- ============================================================
-- Tamini — Multi-Tenant RLS Policies (Phase 2)
-- Run this AFTER migration_v2.sql has been applied.
-- ============================================================
-- Implements strict Row-Level Security based on the hierarchy:
--   super_admin  → full CRUD within their facility
--   admin        → full CRUD within their facility
--   caregiver    → SELECT / INSERT / UPDATE (NO DELETE)
--   family       → SELECT only
--
-- DESIGN NOTES:
--   • Helper functions use SECURITY DEFINER to bypass RLS on
--     the profiles table — this eliminates infinite recursion.
--   • All policies rely on these helpers rather than raw joins
--     to profiles, keeping policy expressions fast and safe.
--   • Tables without a direct facility_id column (medicines,
--     vitals, care_logs) inherit the facility through the
--     seniors.senior_id → seniors.facility_id chain.
-- ============================================================

-- ============================================================
-- STEP 0 — Drop ALL existing policies to avoid conflicts
-- ============================================================
do $$ begin
  -- profiles
  drop policy if exists "Users read own profile"       on profiles;
  drop policy if exists "Users insert own profile"     on profiles;
  drop policy if exists "Users update own profile"     on profiles;

  -- reminders
  drop policy if exists "Auth access reminders"        on reminders;

  -- seniors
  drop policy if exists "Auth access seniors"          on seniors;

  -- medicines
  drop policy if exists "Auth access medicines"        on medicines;

  -- vitals
  drop policy if exists "Auth access vitals"           on vitals;

  -- care_logs
  drop policy if exists "Auth access care_logs"        on care_logs;

  -- health_products
  drop policy if exists "Public read health_products"  on health_products;
  drop policy if exists "Auth write health_products"   on health_products;
  drop policy if exists "Auth update health_products"  on health_products;
  drop policy if exists "Auth delete health_products"  on health_products;

  -- clothing_items
  drop policy if exists "Users can read own clothing items"   on clothing_items;
  drop policy if exists "Users can insert own clothing items" on clothing_items;
  drop policy if exists "Users can update own clothing items" on clothing_items;
  drop policy if exists "Users can delete own clothing items" on clothing_items;

  -- family_contacts (may have been created by migration_v2 without policies)
  drop policy if exists "family_contacts_select"       on family_contacts;

  raise notice 'All existing policies dropped.';
end $$;

-- ============================================================
-- STEP 1 — Secure helper functions (bypass RLS on profiles)
-- ============================================================

-- Returns the facility_id of the currently authenticated user.
-- Uses SECURITY DEFINER so the query runs with owner privileges,
-- avoiding infinite recursion when profiles RLS is active.
create or replace function get_my_facility_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select facility_id
  from public.profiles
  where id = auth.uid();
$$;

comment on function get_my_facility_id is 'Returns the current user''s facility_id. SECURITY DEFINER to avoid RLS recursion on profiles.';

-- Returns the role of the currently authenticated user.
-- Same SECURITY DEFINER pattern as get_my_facility_id().
create or replace function get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

comment on function get_my_role is 'Returns the current user''s role. SECURITY DEFINER to avoid RLS recursion on profiles.';

-- ============================================================
-- STEP 2 ── Enable RLS on EVERY user-facing table
-- ============================================================
-- (Some may already be enabled from the legacy schema; this is
--  idempotent — ALTER TABLE … ENABLE ROW LEVEL SECURITY does
--  not error if already enabled.)
-- ============================================================
alter table profiles          enable row level security;
alter table seniors           enable row level security;
alter table medicines         enable row level security;
alter table vitals            enable row level security;
alter table care_logs         enable row level security;
alter table clothing_items    enable row level security;
alter table reminders         enable row level security;
alter table doctors           enable row level security;
alter table psychologists     enable row level security;
alter table family_contacts   enable row level security;
alter table health_products   enable row level security;

-- ============================================================
-- STEP 3 — PROFILES
-- ============================================================
-- Rules:
--   super_admin / admin  → full access to profiles in their facility
--   caregiver            → SELECT only on profiles in their facility
--   family               → SELECT only on their own profile
--   all users            → INSERT / UPDATE on their own row
-- ============================================================

-- super_admin & admin: full CRUD on profiles within their facility
create policy "profiles_all_admin"
  on profiles
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  );

-- caregiver: read-only on profiles within their facility
create policy "profiles_select_caregiver"
  on profiles
  for select
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

-- family: read-only on their own profile
create policy "profiles_select_family"
  on profiles
  for select
  using (
    get_my_role() = 'family'
    and id = auth.uid()
  );

-- everyone: can insert their own row (signup flow)
create policy "profiles_insert_self"
  on profiles
  for insert
  with check (
    id = auth.uid()
  );

-- everyone: can update their own row (but NOT role or facility_id)
create policy "profiles_update_self"
  on profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      -- Prevent users from promoting themselves or switching facilities
      role = (select role from public.profiles where id = auth.uid())
      and facility_id is not distinct from (select facility_id from public.profiles where id = auth.uid())
    )
  );

-- ============================================================
-- STEP 4 — SENIORS
-- ============================================================
-- Rules:
--   super_admin / admin  → ALL
--   caregiver            → SELECT / INSERT / UPDATE (no DELETE)
--   family               → SELECT only
-- ============================================================

create policy "seniors_all_admin"
  on seniors
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  );

create policy "seniors_select_caregiver"
  on seniors
  for select
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "seniors_insert_caregiver"
  on seniors
  for insert
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "seniors_update_caregiver"
  on seniors
  for update
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

-- NOTE: No DELETE policy for caregiver — they cannot delete seniors.

create policy "seniors_select_family"
  on seniors
  for select
  using (
    get_my_role() = 'family'
    and facility_id = get_my_facility_id()
  );

-- ============================================================
-- STEP 5 — MEDICINES (facility inherited via seniors)
-- ============================================================
-- These tables lack a direct facility_id; access is mediated
-- through the senior_id → seniors.facility_id chain.
-- ============================================================

create policy "medicines_all_admin"
  on medicines
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "medicines_select_caregiver"
  on medicines
  for select
  using (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "medicines_insert_caregiver"
  on medicines
  for insert
  with check (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "medicines_update_caregiver"
  on medicines
  for update
  using (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

-- NOTE: No DELETE policy for caregiver.

create policy "medicines_select_family"
  on medicines
  for select
  using (
    get_my_role() = 'family'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

-- ============================================================
-- STEP 6 — VITALS (same pattern as medicines)
-- ============================================================

create policy "vitals_all_admin"
  on vitals
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "vitals_select_caregiver"
  on vitals
  for select
  using (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "vitals_insert_caregiver"
  on vitals
  for insert
  with check (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "vitals_update_caregiver"
  on vitals
  for update
  using (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

-- NOTE: No DELETE policy for caregiver.

create policy "vitals_select_family"
  on vitals
  for select
  using (
    get_my_role() = 'family'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

-- ============================================================
-- STEP 7 — CARE LOGS (same pattern as medicines)
-- ============================================================

create policy "care_logs_all_admin"
  on care_logs
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "care_logs_select_caregiver"
  on care_logs
  for select
  using (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "care_logs_insert_caregiver"
  on care_logs
  for insert
  with check (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

create policy "care_logs_update_caregiver"
  on care_logs
  for update
  using (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() = 'caregiver'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

-- NOTE: No DELETE policy for caregiver.

create policy "care_logs_select_family"
  on care_logs
  for select
  using (
    get_my_role() = 'family'
    and senior_id in (
      select id from seniors where facility_id = get_my_facility_id()
    )
  );

-- ============================================================
-- STEP 8 — CLOTHING ITEMS
-- ============================================================
-- Has its own facility_id column (added in migration_v2).
-- Rules mirror seniors: admins get ALL, caregivers get
-- SELECT/INSERT/UPDATE, family gets SELECT.
-- ============================================================

create policy "clothing_items_all_admin"
  on clothing_items
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  );

create policy "clothing_items_select_caregiver"
  on clothing_items
  for select
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "clothing_items_insert_caregiver"
  on clothing_items
  for insert
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "clothing_items_update_caregiver"
  on clothing_items
  for update
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

-- NOTE: No DELETE policy for caregiver.

create policy "clothing_items_select_family"
  on clothing_items
  for select
  using (
    get_my_role() = 'family'
    and facility_id = get_my_facility_id()
  );

-- ============================================================
-- STEP 9 — REMINDERS
-- ============================================================
-- Has its own facility_id column. Same rule set as clothing_items.
-- ============================================================

create policy "reminders_all_admin"
  on reminders
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  );

create policy "reminders_select_caregiver"
  on reminders
  for select
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "reminders_insert_caregiver"
  on reminders
  for insert
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "reminders_update_caregiver"
  on reminders
  for update
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

-- NOTE: No DELETE policy for caregiver.

create policy "reminders_select_family"
  on reminders
  for select
  using (
    get_my_role() = 'family'
    and facility_id = get_my_facility_id()
  );

-- ============================================================
-- STEP 10 — DOCTORS
-- ============================================================
-- Has facility_id (NOT NULL). Same rule set.
-- ============================================================

create policy "doctors_all_admin"
  on doctors
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  );

create policy "doctors_select_caregiver"
  on doctors
  for select
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "doctors_insert_caregiver"
  on doctors
  for insert
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "doctors_update_caregiver"
  on doctors
  for update
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

-- NOTE: No DELETE policy for caregiver.

create policy "doctors_select_family"
  on doctors
  for select
  using (
    get_my_role() = 'family'
    and facility_id = get_my_facility_id()
  );

-- ============================================================
-- STEP 11 — PSYCHOLOGISTS
-- ============================================================
-- Has facility_id (NOT NULL). Same rule set.
-- ============================================================

create policy "psychologists_all_admin"
  on psychologists
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and facility_id = get_my_facility_id()
  );

create policy "psychologists_select_caregiver"
  on psychologists
  for select
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "psychologists_insert_caregiver"
  on psychologists
  for insert
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

create policy "psychologists_update_caregiver"
  on psychologists
  for update
  using (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  )
  with check (
    get_my_role() = 'caregiver'
    and facility_id = get_my_facility_id()
  );

-- NOTE: No DELETE policy for caregiver.

create policy "psychologists_select_family"
  on psychologists
  for select
  using (
    get_my_role() = 'family'
    and facility_id = get_my_facility_id()
  );

-- ============================================================
-- STEP 12 — FAMILY CONTACTS
-- ============================================================
-- No facility_id. Linked directly via user_id → profiles(id).
--
-- Rules:
--   super_admin / admin  → full CRUD on contacts where the
--                          linked profile shares their facility
--   caregiver            → SELECT / INSERT / UPDATE on contacts
--                          linked to profiles in their facility
--   family               → SELECT / INSERT / UPDATE / DELETE on
--                          their OWN contacts only
-- ============================================================

create policy "family_contacts_all_admin"
  on family_contacts
  for all
  using (
    get_my_role() in ('super_admin', 'admin')
    and user_id in (
      select id from profiles where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() in ('super_admin', 'admin')
    and user_id in (
      select id from profiles where facility_id = get_my_facility_id()
    )
  );

create policy "family_contacts_select_caregiver"
  on family_contacts
  for select
  using (
    get_my_role() = 'caregiver'
    and user_id in (
      select id from profiles where facility_id = get_my_facility_id()
    )
  );

create policy "family_contacts_insert_caregiver"
  on family_contacts
  for insert
  with check (
    get_my_role() = 'caregiver'
    and user_id in (
      select id from profiles where facility_id = get_my_facility_id()
    )
  );

create policy "family_contacts_update_caregiver"
  on family_contacts
  for update
  using (
    get_my_role() = 'caregiver'
    and user_id in (
      select id from profiles where facility_id = get_my_facility_id()
    )
  )
  with check (
    get_my_role() = 'caregiver'
    and user_id in (
      select id from profiles where facility_id = get_my_facility_id()
    )
  );

-- NOTE: No DELETE policy for caregiver on family_contacts.

-- family: full control over their own contacts (their emergency contacts)
create policy "family_contacts_own_family"
  on family_contacts
  for all
  using (
    get_my_role() = 'family'
    and user_id = auth.uid()
  )
  with check (
    get_my_role() = 'family'
    and user_id = auth.uid()
  );

-- ============================================================
-- STEP 13 — HEALTH PRODUCTS (public marketplace, no facility)
-- ============================================================
-- This is a global table with no tenant isolation.
-- Anyone can read; any authenticated user can write.
-- ============================================================

create policy "health_products_select_public"
  on health_products
  for select
  using (true);

create policy "health_products_insert_auth"
  on health_products
  for insert
  with check (auth.role() = 'authenticated');

create policy "health_products_update_auth"
  on health_products
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "health_products_delete_auth"
  on health_products
  for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- STEP 14 — Verification
-- ============================================================
do $$
declare
  rec record;
  total int := 0;
begin
  raise notice '============================================================';
  raise notice 'Phase 2 RLS migration complete.';
  raise notice '============================================================';

  for rec in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
    order by tablename, policyname
  loop
    raise notice '  POLICY: %.%  %', rec.tablename, rec.policyname, '-';
    total := total + 1;
  end loop;

  raise notice '============================================================';
  raise notice 'Total policies created: %', total;
  raise notice '============================================================';
  raise notice '';
  raise notice 'Guardrails active:';
  raise notice '  • super_admin / admin → full CRUD within facility';
  raise notice '  • caregiver           → SELECT / INSERT / UPDATE (no DELETE)';
  raise notice '  • family              → SELECT only';
  raise notice '  • Self-update guard   → users cannot change own role/facility';
  raise notice '============================================================';
end;
$$;

-- ============================================================
-- END OF PHASE 2 RLS MIGRATION
-- ============================================================
