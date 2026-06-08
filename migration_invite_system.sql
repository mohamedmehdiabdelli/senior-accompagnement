-- =====================================================
-- Top-Down Staff Invitation / Allowed Staff Whitelist
-- =====================================================

-- 1. Allowed Staff table
create table if not exists allowed_staff (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null unique,
  role        text        not null check (role in ('admin', 'caregiver')),
  facility_id uuid        not null references facilities(id) on delete cascade,
  created_at  timestamptz default now()
);

create index if not exists idx_allowed_staff_email on allowed_staff (lower(email));

-- 2. Row Level Security
alter table allowed_staff enable row level security;

-- Only super_admin can manage the whitelist
create policy "Super admins can select allowed_staff"
  on allowed_staff for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
  );

create policy "Super admins can insert allowed_staff"
  on allowed_staff for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
  );

create policy "Super admins can delete allowed_staff"
  on allowed_staff for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
  );

-- 3. Helper function: check if an email is whitelisted
create or replace function get_allowed_staff(p_email text)
returns table (
  out_email       text,
  out_role        text,
  out_facility_id uuid
)
language sql
stable
as $$
  select lower(email)::text, role, facility_id
  from allowed_staff
  where lower(email) = lower(p_email)
  limit 1;
$$;

-- 4. Trigger: auto-create profile from allowed_staff when a new auth user signs up
--    This is a safety net even if the application code fails to check.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  whitelist_row record;
begin
  -- Check if the new user's email is in allowed_staff
  select role, facility_id into whitelist_row
  from allowed_staff
  where lower(email) = lower(new.email);

  if found then
    -- Staff member: insert profile with pre-assigned role and facility
    insert into public.profiles (id, email, role, full_name, facility_id)
    values (
      new.id,
      new.email,
      whitelist_row.role,
      new.raw_user_meta_data ->> 'full_name',
      whitelist_row.facility_id
    );
    -- Remove from whitelist after use (optional, prevents re-use)
    delete from allowed_staff where lower(email) = lower(new.email);
  else
    -- Regular family user: insert profile with family role
    insert into public.profiles (id, email, role, full_name, facility_id)
    values (
      new.id,
      new.email,
      'family',
      new.raw_user_meta_data ->> 'full_name',
      null
    );
  end if;

  return new;
end;
$$;

-- Drop any existing trigger before creating (handles re-runs)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Note: After this migration, the application-level signUp function in
-- AuthContext.tsx will also check allowed_staff before creating the auth user.
-- The trigger acts as a guaranteed fallback.
