create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid())::text
      and r.role_code = 'admin'
      and r.status = 1
  );
$$;

revoke all on function public.is_app_admin() from public;
revoke all on function public.is_app_admin() from anon;
revoke all on function public.is_app_admin() from authenticated;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "admin users read" on public.users;
drop policy if exists "admin users update" on public.users;
drop policy if exists "admin roles write" on public.roles;
drop policy if exists "admin permissions write" on public.permissions;
drop policy if exists "admin user roles read" on public.user_roles;
drop policy if exists "admin role permissions read" on public.role_permissions;
drop policy if exists "admin invite codes all" on public.invite_codes;
drop policy if exists "admin login logs read" on public.login_logs;
drop policy if exists "admin operation logs read" on public.operation_logs;
drop policy if exists "admin audit logs read" on public.audit_logs;

create policy "admin users read" on public.users
for select to authenticated
using (public.is_app_admin());

create policy "admin users update" on public.users
for update to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "admin roles write" on public.roles
for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "admin permissions write" on public.permissions
for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "admin user roles read" on public.user_roles
for select to authenticated
using (public.is_app_admin());

create policy "admin role permissions read" on public.role_permissions
for select to authenticated
using (public.is_app_admin());

create policy "admin invite codes all" on public.invite_codes
for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "admin login logs read" on public.login_logs
for select to authenticated
using (public.is_app_admin());

create policy "admin operation logs read" on public.operation_logs
for select to authenticated
using (public.is_app_admin());

create policy "admin audit logs read" on public.audit_logs
for select to authenticated
using (public.is_app_admin());
