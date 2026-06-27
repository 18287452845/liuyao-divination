-- Policies needed while migrating the app from the Express API to direct
-- Supabase Auth + Data API access from the Vite frontend.

grant select, insert, update on public.users to authenticated;
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.role_permissions to authenticated;

drop policy if exists "own user profile read" on public.users;
drop policy if exists "own user profile insert" on public.users;
drop policy if exists "own user profile update" on public.users;
drop policy if exists "authenticated role read" on public.roles;
drop policy if exists "authenticated permission read" on public.permissions;
drop policy if exists "own user roles read" on public.user_roles;
drop policy if exists "authenticated role permissions read" on public.role_permissions;

create policy "own user profile read" on public.users
for select to authenticated
using ((select auth.uid())::text = id);

create policy "own user profile insert" on public.users
for insert to authenticated
with check ((select auth.uid())::text = id);

create policy "own user profile update" on public.users
for update to authenticated
using ((select auth.uid())::text = id)
with check ((select auth.uid())::text = id);

create policy "authenticated role read" on public.roles
for select to authenticated
using (status = 1);

create policy "authenticated permission read" on public.permissions
for select to authenticated
using (status = 1);

create policy "own user roles read" on public.user_roles
for select to authenticated
using ((select auth.uid())::text = user_id);

create policy "authenticated role permissions read" on public.role_permissions
for select to authenticated
using (true);
