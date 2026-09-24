grant usage on schema private to authenticated, service_role;

create or replace function private.admin_set_user_ban_impl(target_user uuid, banned boolean)
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

revoke all on function private.admin_set_user_ban_impl(uuid,boolean) from public, anon;
grant execute on function private.admin_set_user_ban_impl(uuid,boolean) to authenticated, service_role;

create or replace function public.admin_set_user_ban(target_user uuid, banned boolean)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  perform private.admin_set_user_ban_impl(target_user,banned);
end;
$function$;

create or replace function private.publish_draft_impl(p_post_id uuid)
returns table(success boolean, code text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text; return;
  end if;
  select p.status, p.deleted_at into v_status, v_deleted_at
  from public.posts as p
  where p.id = p_post_id and p.author_id = v_uid
  for update;
  if not found then
    return query select false, 'NOT_FOUND_OR_NOT_OWNER'::text; return;
  end if;
  if v_deleted_at is not null or v_status <> 'draft' then
    return query select false, 'INVALID_STATE'::text; return;
  end if;
  update public.posts
  set status = 'published'
  where id = p_post_id and author_id = v_uid
    and status = 'draft' and deleted_at is null;
  if found then
    return query select true, 'SUCCESS'::text;
  else
    return query select false, 'INVALID_STATE'::text;
  end if;
end;
$function$;

revoke all on function private.publish_draft_impl(uuid) from public, anon;
grant execute on function private.publish_draft_impl(uuid) to authenticated, service_role;

create or replace function public.publish_draft(p_post_id uuid)
returns table(success boolean, code text)
language sql
security invoker
set search_path to ''
as $function$
  select * from private.publish_draft_impl(p_post_id);
$function$;

create or replace function private.soft_delete_post_impl(p_post_id uuid)
returns table(success boolean, code text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text; return;
  end if;
  select p.status, p.deleted_at into v_status, v_deleted_at
  from public.posts as p
  where p.id = p_post_id and p.author_id = v_uid
  for update;
  if not found then
    return query select false, 'NOT_FOUND_OR_NOT_OWNER'::text; return;
  end if;
  if v_deleted_at is not null then
    return query select false, 'INVALID_STATE'::text; return;
  end if;
  update public.posts
  set deleted_at = pg_catalog.clock_timestamp()
  where id = p_post_id and author_id = v_uid and deleted_at is null;
  if found then
    return query select true, 'SUCCESS'::text;
  else
    return query select false, 'INVALID_STATE'::text;
  end if;
end;
$function$;

revoke all on function private.soft_delete_post_impl(uuid) from public, anon;
grant execute on function private.soft_delete_post_impl(uuid) to authenticated, service_role;

create or replace function public.soft_delete_post(p_post_id uuid)
returns table(success boolean, code text)
language sql
security invoker
set search_path to ''
as $function$
  select * from private.soft_delete_post_impl(p_post_id);
$function$;

create or replace function private.undo_delete_post_impl(p_post_id uuid)
returns table(success boolean, code text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text; return;
  end if;
  select p.deleted_at into v_deleted_at
  from public.posts as p
  where p.id = p_post_id and p.author_id = v_uid
  for update;
  if not found then
    return query select false, 'NOT_FOUND_OR_NOT_OWNER'::text; return;
  end if;
  if v_deleted_at is null then
    return query select false, 'INVALID_STATE'::text; return;
  end if;
  if v_deleted_at < pg_catalog.clock_timestamp() - interval '10 minutes' then
    return query select false, 'EXPIRED_UNDO'::text; return;
  end if;
  update public.posts
  set deleted_at = null
  where id = p_post_id and author_id = v_uid and deleted_at = v_deleted_at;
  if found then
    return query select true, 'SUCCESS'::text;
  else
    return query select false, 'INVALID_STATE'::text;
  end if;
end;
$function$;

revoke all on function private.undo_delete_post_impl(uuid) from public, anon;
grant execute on function private.undo_delete_post_impl(uuid) to authenticated, service_role;

create or replace function public.undo_delete_post(p_post_id uuid)
returns table(success boolean, code text)
language sql
security invoker
set search_path to ''
as $function$
  select * from private.undo_delete_post_impl(p_post_id);
$function$;
