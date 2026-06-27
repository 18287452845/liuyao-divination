-- Assign the default application role when a Supabase Auth user creates a
-- matching public.users profile row.

create or replace function public.assign_default_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id text;
begin
  select id into default_role_id
  from public.roles
  where role_code = 'user' and status = 1
  limit 1;

  if default_role_id is not null then
    insert into public.user_roles (id, user_id, role_id)
    values (gen_random_uuid()::text, new.id, default_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.assign_default_user_role() from public;
revoke all on function public.assign_default_user_role() from anon;
revoke all on function public.assign_default_user_role() from authenticated;

drop trigger if exists trg_assign_default_user_role on public.users;

create trigger trg_assign_default_user_role
after insert on public.users
for each row
execute function public.assign_default_user_role();
