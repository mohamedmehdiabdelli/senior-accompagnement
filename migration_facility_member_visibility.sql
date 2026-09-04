-- Tamini — allow every member to display their facility name.
-- Run after migration_facility_ownership.sql.

drop policy if exists "Super admins read own facility" on public.facilities;
drop policy if exists "Facility members read their facility" on public.facilities;

create policy "Facility members read their facility" on public.facilities
  for select using (
    owner_id = auth.uid()
    or id = (select facility_id from public.profiles where id = auth.uid())
  );
