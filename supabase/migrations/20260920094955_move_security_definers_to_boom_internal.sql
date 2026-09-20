-- Move privileged implementations out of the exposed public schema.
-- Public RPC signatures stay unchanged and become SECURITY INVOKER wrappers.
-- The privileged implementations remain SECURITY DEFINER with search_path=''
-- and explicit auth.uid()/ownership/admin checks.

create schema if not exists boom_internal authorization postgres;

revoke all on schema boom_internal from public;
revoke all on schema boom_internal from anon;
grant usage on schema boom_internal to authenticated, service_role;

alter default privileges for role postgres in schema boom_internal
  revoke execute on functions from public;

create or replace function boom_internal.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce((
    select p.is_admin
    from public.profiles as p
    where p.id = auth.uid()
  ), false);
$function$;

create or replace function boom_internal.admin_set_user_ban(
  target_user uuid,
  banned boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not boom_internal.is_admin_user() then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set is_banned = banned
  where id = target_user;
end;
$function$;

create or replace function boom_internal.create_post_draft(
  p_content_type text,
  p_caption text default null::text,
  p_media_url text default null::text,
  p_media_urls text[] default null::text[],
  p_poll_data jsonb default null::jsonb,
  p_context_type text default null::text,
  p_context_ref text default null::text,
  p_routed_to text default 'manual'::text,
  p_audience text default 'private'::text
)
returns table(success boolean, code text, post_id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_post_id uuid;
  v_error_message text;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text, null::uuid;
    return;
  end if;

  if p_audience is null or p_audience not in ('public', 'private') then
    return query select false, 'INVALID_AUDIENCE'::text, null::uuid;
    return;
  end if;

  if p_content_type is null or p_content_type not in (
    'post', 'photo', 'video', 'reel', 'story', 'live_clip'
  ) then
    return query select false, 'INVALID_CONTENT'::text, null::uuid;
    return;
  end if;

  if p_routed_to is null or p_routed_to not in (
    'friends', 'business', 'trends', 'ai', 'manual'
  ) then
    return query select false, 'INVALID_CONTENT'::text, null::uuid;
    return;
  end if;

  begin
    insert into public.posts (
      author_id, content_type, caption, media_url, media_urls, poll_data,
      context_type, context_ref, routed_to, status, audience
    ) values (
      v_uid, p_content_type, p_caption, p_media_url, p_media_urls, p_poll_data,
      p_context_type, p_context_ref, p_routed_to, 'draft', p_audience
    ) returning id into v_post_id;
  exception
    when raise_exception then
      get stacked diagnostics v_error_message = message_text;
      if v_error_message = 'post rate limit exceeded' then
        return query select false, 'RATE_LIMITED'::text, null::uuid;
      else
        return query select false, 'CREATE_FAILED'::text, null::uuid;
      end if;
      return;
    when check_violation or not_null_violation or foreign_key_violation or data_exception then
      return query select false, 'INVALID_CONTENT'::text, null::uuid;
      return;
    when others then
      return query select false, 'CREATE_FAILED'::text, null::uuid;
      return;
  end;

  if v_post_id is null then
    return query select false, 'CREATE_FAILED'::text, null::uuid;
    return;
  end if;

  return query select true, 'SUCCESS'::text, v_post_id;
end;
$function$;

create or replace function boom_internal.get_my_drafts()
returns setof public.posts
language sql
stable
security definer
set search_path = ''
as $function$
  select p.*
  from public.posts as p
  where p.author_id = auth.uid()
    and p.status = 'draft'
    and p.deleted_at is null
  order by p.created_at desc;
$function$;

create or replace function boom_internal.get_my_recent_deleted()
returns setof public.posts
language sql
stable
security definer
set search_path = ''
as $function$
  select p.*
  from public.posts as p
  where p.author_id = auth.uid()
    and p.deleted_at is not null
    and p.deleted_at >= pg_catalog.clock_timestamp() - interval '10 minutes'
  order by p.deleted_at desc;
$function$;

create or replace function boom_internal.publish_draft(p_post_id uuid)
returns table(success boolean, code text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text;
    return;
  end if;

  select p.status, p.deleted_at
  into v_status, v_deleted_at
  from public.posts as p
  where p.id = p_post_id
    and p.author_id = v_uid
  for update;

  if not found then
    return query select false, 'NOT_FOUND_OR_NOT_OWNER'::text;
    return;
  end if;

  if v_deleted_at is not null or v_status <> 'draft' then
    return query select false, 'INVALID_STATE'::text;
    return;
  end if;

  update public.posts
  set status = 'published'
  where id = p_post_id
    and author_id = v_uid
    and status = 'draft'
    and deleted_at is null;

  if found then
    return query select true, 'SUCCESS'::text;
  else
    return query select false, 'INVALID_STATE'::text;
  end if;
end;
$function$;

create or replace function boom_internal.soft_delete_post(p_post_id uuid)
returns table(success boolean, code text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text;
    return;
  end if;

  select p.status, p.deleted_at
  into v_status, v_deleted_at
  from public.posts as p
  where p.id = p_post_id
    and p.author_id = v_uid
  for update;

  if not found then
    return query select false, 'NOT_FOUND_OR_NOT_OWNER'::text;
    return;
  end if;

  if v_deleted_at is not null then
    return query select false, 'INVALID_STATE'::text;
    return;
  end if;

  update public.posts
  set deleted_at = pg_catalog.clock_timestamp()
  where id = p_post_id
    and author_id = v_uid
    and deleted_at is null;

  if found then
    return query select true, 'SUCCESS'::text;
  else
    return query select false, 'INVALID_STATE'::text;
  end if;
end;
$function$;

create or replace function boom_internal.undo_delete_post(p_post_id uuid)
returns table(success boolean, code text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    return query select false, 'UNAUTHENTICATED'::text;
    return;
  end if;

  select p.deleted_at
  into v_deleted_at
  from public.posts as p
  where p.id = p_post_id
    and p.author_id = v_uid
  for update;

  if not found then
    return query select false, 'NOT_FOUND_OR_NOT_OWNER'::text;
    return;
  end if;

  if v_deleted_at is null then
    return query select false, 'INVALID_STATE'::text;
    return;
  end if;

  if v_deleted_at < pg_catalog.clock_timestamp() - interval '10 minutes' then
    return query select false, 'EXPIRED_UNDO'::text;
    return;
  end if;

  update public.posts
  set deleted_at = null
  where id = p_post_id
    and author_id = v_uid
    and deleted_at = v_deleted_at;

  if found then
    return query select true, 'SUCCESS'::text;
  else
    return query select false, 'INVALID_STATE'::text;
  end if;
end;
$function$;

-- Private implementations: never executable by PUBLIC/anon.
revoke all on function boom_internal.is_admin_user() from public, anon;
revoke all on function boom_internal.admin_set_user_ban(uuid,boolean) from public, anon;
revoke all on function boom_internal.create_post_draft(text,text,text,text[],jsonb,text,text,text,text) from public, anon;
revoke all on function boom_internal.get_my_drafts() from public, anon;
revoke all on function boom_internal.get_my_recent_deleted() from public, anon;
revoke all on function boom_internal.publish_draft(uuid) from public, anon;
revoke all on function boom_internal.soft_delete_post(uuid) from public, anon;
revoke all on function boom_internal.undo_delete_post(uuid) from public, anon;

grant execute on function boom_internal.is_admin_user() to authenticated, service_role;
grant execute on function boom_internal.admin_set_user_ban(uuid,boolean) to authenticated, service_role;
grant execute on function boom_internal.create_post_draft(text,text,text,text[],jsonb,text,text,text,text) to authenticated, service_role;
grant execute on function boom_internal.get_my_drafts() to authenticated, service_role;
grant execute on function boom_internal.get_my_recent_deleted() to authenticated, service_role;
grant execute on function boom_internal.publish_draft(uuid) to authenticated, service_role;
grant execute on function boom_internal.soft_delete_post(uuid) to authenticated, service_role;
grant execute on function boom_internal.undo_delete_post(uuid) to authenticated, service_role;

-- Public RPC wrappers preserve signatures while dropping SECURITY DEFINER.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select boom_internal.is_admin_user();
$function$;

create or replace function public.admin_set_user_ban(
  target_user uuid,
  banned boolean
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select boom_internal.admin_set_user_ban(target_user, banned);
$function$;

create or replace function public.create_post_draft(
  p_content_type text,
  p_caption text default null::text,
  p_media_url text default null::text,
  p_media_urls text[] default null::text[],
  p_poll_data jsonb default null::jsonb,
  p_context_type text default null::text,
  p_context_ref text default null::text,
  p_routed_to text default 'manual'::text,
  p_audience text default 'private'::text
)
returns table(success boolean, code text, post_id uuid)
language sql
security invoker
set search_path = ''
as $function$
  select *
  from boom_internal.create_post_draft(
    p_content_type, p_caption, p_media_url, p_media_urls, p_poll_data,
    p_context_type, p_context_ref, p_routed_to, p_audience
  );
$function$;

create or replace function public.get_my_drafts()
returns setof public.posts
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from boom_internal.get_my_drafts();
$function$;

create or replace function public.get_my_recent_deleted()
returns setof public.posts
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from boom_internal.get_my_recent_deleted();
$function$;

create or replace function public.publish_draft(p_post_id uuid)
returns table(success boolean, code text)
language sql
security invoker
set search_path = ''
as $function$
  select * from boom_internal.publish_draft(p_post_id);
$function$;

create or replace function public.soft_delete_post(p_post_id uuid)
returns table(success boolean, code text)
language sql
security invoker
set search_path = ''
as $function$
  select * from boom_internal.soft_delete_post(p_post_id);
$function$;

create or replace function public.undo_delete_post(p_post_id uuid)
returns table(success boolean, code text)
language sql
security invoker
set search_path = ''
as $function$
  select * from boom_internal.undo_delete_post(p_post_id);
$function$;

-- Exposed wrappers: authenticated/service only, never anon/PUBLIC.
revoke all on function public.is_admin_user() from public, anon;
revoke all on function public.admin_set_user_ban(uuid,boolean) from public, anon;
revoke all on function public.create_post_draft(text,text,text,text[],jsonb,text,text,text,text) from public, anon;
revoke all on function public.get_my_drafts() from public, anon;
revoke all on function public.get_my_recent_deleted() from public, anon;
revoke all on function public.publish_draft(uuid) from public, anon;
revoke all on function public.soft_delete_post(uuid) from public, anon;
revoke all on function public.undo_delete_post(uuid) from public, anon;

grant execute on function public.is_admin_user() to authenticated, service_role;
grant execute on function public.admin_set_user_ban(uuid,boolean) to authenticated, service_role;
grant execute on function public.create_post_draft(text,text,text,text[],jsonb,text,text,text,text) to authenticated, service_role;
grant execute on function public.get_my_drafts() to authenticated, service_role;
grant execute on function public.get_my_recent_deleted() to authenticated, service_role;
grant execute on function public.publish_draft(uuid) to authenticated, service_role;
grant execute on function public.soft_delete_post(uuid) to authenticated, service_role;
grant execute on function public.undo_delete_post(uuid) to authenticated, service_role;

comment on schema boom_internal is
  'Unexposed BOOM privileged database implementations. Public RPCs must use SECURITY INVOKER wrappers.';

comment on function public.is_admin_user() is
  'SECURITY INVOKER RPC wrapper over boom_internal.is_admin_user().';
comment on function public.admin_set_user_ban(uuid,boolean) is
  'SECURITY INVOKER RPC wrapper; privileged admin mutation remains in boom_internal.';
comment on function public.create_post_draft(text,text,text,text[],jsonb,text,text,text,text) is
  'SECURITY INVOKER RPC wrapper; privileged own-user draft creation remains in boom_internal.';
comment on function public.get_my_drafts() is
  'SECURITY INVOKER RPC wrapper; own-user draft read remains in boom_internal.';
comment on function public.get_my_recent_deleted() is
  'SECURITY INVOKER RPC wrapper; own-user deleted-post read remains in boom_internal.';
comment on function public.publish_draft(uuid) is
  'SECURITY INVOKER RPC wrapper; own-user publish transition remains in boom_internal.';
comment on function public.soft_delete_post(uuid) is
  'SECURITY INVOKER RPC wrapper; own-user soft delete remains in boom_internal.';
comment on function public.undo_delete_post(uuid) is
  'SECURITY INVOKER RPC wrapper; own-user undo remains in boom_internal.';


-- Fail the migration if the privilege boundary is not exactly what we expect.
do $assert$
declare
  v_public_definers integer;
  v_internal_definers integer;
  v_anon_execute integer;
  v_authenticated_wrappers integer;
begin
  select count(*)
  into v_public_definers
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'admin_set_user_ban','create_post_draft','get_my_drafts','get_my_recent_deleted',
      'is_admin_user','publish_draft','soft_delete_post','undo_delete_post'
    )
    and p.prosecdef = true;

  if v_public_definers <> 0 then
    raise exception 'SECURITY_HARDENING_FAILED: % public SECURITY DEFINER functions remain', v_public_definers;
  end if;

  select count(*)
  into v_internal_definers
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'boom_internal'
    and p.proname in (
      'admin_set_user_ban','create_post_draft','get_my_drafts','get_my_recent_deleted',
      'is_admin_user','publish_draft','soft_delete_post','undo_delete_post'
    )
    and p.prosecdef = true;

  if v_internal_definers <> 8 then
    raise exception 'SECURITY_HARDENING_FAILED: expected 8 internal SECURITY DEFINER functions, found %', v_internal_definers;
  end if;

  select count(*)
  into v_anon_execute
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname in ('public','boom_internal')
    and p.proname in (
      'admin_set_user_ban','create_post_draft','get_my_drafts','get_my_recent_deleted',
      'is_admin_user','publish_draft','soft_delete_post','undo_delete_post'
    )
    and has_function_privilege('anon', p.oid, 'EXECUTE');

  if v_anon_execute <> 0 then
    raise exception 'SECURITY_HARDENING_FAILED: anon can execute % protected functions', v_anon_execute;
  end if;

  select count(*)
  into v_authenticated_wrappers
  from pg_catalog.pg_proc as p
  join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'admin_set_user_ban','create_post_draft','get_my_drafts','get_my_recent_deleted',
      'is_admin_user','publish_draft','soft_delete_post','undo_delete_post'
    )
    and p.prosecdef = false
    and has_function_privilege('authenticated', p.oid, 'EXECUTE');

  if v_authenticated_wrappers <> 8 then
    raise exception 'SECURITY_HARDENING_FAILED: expected 8 authenticated public wrappers, found %', v_authenticated_wrappers;
  end if;
end
$assert$;
