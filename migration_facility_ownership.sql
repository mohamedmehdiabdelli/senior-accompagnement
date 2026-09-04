-- Tamini: explicit facility ownership and scoped staff invitations.
-- Run after migration_v2.sql and migration_invite_system.sql.

alter table public.facilities
  add column if not exists owner_id uuid references public.profiles(id) on delete restrict;

create unique index if not exists facilities_one_owner_idx
  on public.facilities(owner_id)
  where owner_id is not null;

create or replace function public.create_facility_for_owner(facility_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
  new_facility_id uuid;
begin
  select * into current_profile from public.profiles where id = auth.uid();
  if current_profile.id is null or current_profile.role <> 'super_admin' then
    raise exception 'Only a super admin can create a facility';
  end if;
  if current_profile.facility_id is not null then
    raise exception 'This super admin already belongs to a facility';
  end if;
  if nullif(trim(facility_name), '') is null then
    raise exception 'Facility name is required';
  end if;

  insert into public.facilities (name, owner_id)
  values (trim(facility_name), current_profile.id)
  returning id into new_facility_id;

  update public.profiles set facility_id = new_facility_id where id = current_profile.id;
  return new_facility_id;
end;
$$;

create or replace function public.invite_staff_for_my_facility(
  invited_email text,
  invited_role text
)
returns public.allowed_staff
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
  invitation public.allowed_staff;
begin
  select * into current_profile from public.profiles where id = auth.uid();
  if current_profile.id is null or current_profile.role <> 'super_admin' then
    raise exception 'Only a super admin can invite staff';
  end if;
  if current_profile.facility_id is null then
    raise exception 'The super admin has no facility';
  end if;
  if invited_role not in ('admin', 'caregiver') then
    raise exception 'Only admin and caregiver roles can be invited';
  end if;
  if nullif(trim(invited_email), '') is null then
    raise exception 'Email is required';
  end if;

  insert into public.allowed_staff (email, role, facility_id)
  values (lower(trim(invited_email)), invited_role, current_profile.facility_id)
  returning * into invitation;
  return invitation;
end;
$$;

alter table public.facilities enable row level security;
drop policy if exists "Facility members read their facility" on public.facilities;
create policy "Facility members read their facility" on public.facilities
  for select using (
    owner_id = auth.uid()
    or id = (select facility_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Super admins manage own invitations" on public.allowed_staff;
create policy "Super admins manage own invitations" on public.allowed_staff
  for all
  using (
    facility_id = (select facility_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'super_admin'
  )
  with check (
    facility_id = (select facility_id from public.profiles where id = auth.uid())
    and (select role from public.profiles where id = auth.uid()) = 'super_admin'
  );

-- Review legacy facilities before assigning owners:
-- select id, name, owner_id from public.facilities order by created_at;
