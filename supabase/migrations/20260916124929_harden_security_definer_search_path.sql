-- Harden SECURITY DEFINER search paths without changing behavior.
-- QA only until explicitly approved for Production.

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce((
    select p.is_admin
    from public.profiles p
    where p.id = auth.uid()
  ), false);
$function$;

create or replace function public.admin_set_user_ban(target_user uuid, banned boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin_user() then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set is_banned = banned
  where id = target_user;
end;
$function$;

revoke execute on function public.is_admin_user() from public, anon;
revoke execute on function public.admin_set_user_ban(uuid, boolean) from public, anon;

grant execute on function public.is_admin_user() to authenticated, service_role;
grant execute on function public.admin_set_user_ban(uuid, boolean) to authenticated, service_role;
