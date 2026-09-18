-- BOOM F35 Internal Freshness Cron
-- Public official-source freshness only. Stores hashes/headers/status, never raw source content.
-- No Production, payment, order-routing, publishing, spend, provider, or supplier execution.

create extension if not exists pg_net;

alter table public.hunt_boom_f35_sources
  add column if not exists last_attempted_at timestamptz,
  add column if not exists last_http_status integer,
  add column if not exists last_content_hash text,
  add column if not exists last_etag text,
  add column if not exists last_modified text,
  add column if not exists last_error text,
  add column if not exists last_request_id bigint,
  add column if not exists consecutive_failures integer not null default 0 check (consecutive_failures >= 0);

create schema if not exists boom_internal;
revoke all on schema boom_internal from public, anon, authenticated;

create or replace function boom_internal.enqueue_f35_source_checks()
returns integer
language plpgsql
security invoker
set search_path = public, net, pg_temp
as $$
declare
  source_row record;
  request_id bigint;
  queued integer := 0;
begin
  for source_row in
    select id, canonical_url
    from public.hunt_boom_f35_sources
    where enabled = true and owner_approved = true
    order by priority desc, id
    limit 25
  loop
    begin
      request_id := net.http_get(
        url := source_row.canonical_url,
        headers := jsonb_build_object(
          'User-Agent','BOOM-F35-Radar/1.0 (+read-only freshness check)',
          'Accept','text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.5'
        ),
        timeout_milliseconds := 8000
      );

      update public.hunt_boom_f35_sources
      set last_request_id = request_id,
          last_attempted_at = now(),
          last_error = null,
          updated_at = now()
      where id = source_row.id;

      queued := queued + 1;
    exception when others then
      update public.hunt_boom_f35_sources
      set last_attempted_at = now(),
          last_error = left(sqlerrm,500),
          consecutive_failures = consecutive_failures + 1,
          updated_at = now()
      where id = source_row.id;
    end;
  end loop;
  return queued;
end;
$$;

create or replace function boom_internal.collect_f35_source_checks()
returns integer
language plpgsql
security invoker
set search_path = public, net, extensions, pg_temp
as $$
declare
  source_row record;
  response_row record;
  current_hash text;
  current_etag text;
  current_modified text;
  changed boolean;
  processed integer := 0;
begin
  for source_row in
    select id, source_key, display_name, canonical_url, last_request_id, last_content_hash
    from public.hunt_boom_f35_sources
    where enabled = true and last_request_id is not null
    order by id
  loop
    select r.status_code, r.headers, r.content, r.timed_out, r.error_msg
      into response_row
    from net._http_response r
    where r.id = source_row.last_request_id
    order by r.created desc
    limit 1;

    if not found then
      continue;
    end if;

    current_etag := coalesce(response_row.headers->>'etag', response_row.headers->>'ETag');
    current_modified := coalesce(response_row.headers->>'last-modified', response_row.headers->>'Last-Modified');

    if response_row.status_code between 200 and 299 and response_row.content is not null then
      current_hash := encode(extensions.digest(convert_to(response_row.content,'UTF8'),'sha256'),'hex');
      changed := source_row.last_content_hash is not null and source_row.last_content_hash <> current_hash;

      update public.hunt_boom_f35_sources
      set last_checked_at = now(),
          last_http_status = response_row.status_code,
          last_content_hash = current_hash,
          last_etag = current_etag,
          last_modified = current_modified,
          last_error = null,
          consecutive_failures = 0,
          last_request_id = null,
          last_changed_at = case when changed then now() else last_changed_at end,
          updated_at = now()
      where id = source_row.id;

      if changed then
        insert into public.hunt_boom_f35_findings
        (source_id,finding_key,observed_at,title,summary,evidence_url,impact_area,relevance_score,
         confidence,action_state,requires_owner_review,evidence)
        values
        (source_row.id,
         'source-change-'||source_row.id::text||'-'||left(current_hash,16),
         now(),
         source_row.display_name||' changed',
         'Official monitored source content changed. BOOM must review the delta before changing any Studio or Brain behavior.',
         source_row.canonical_url,
         'other',
         0.80,
         'review_required',
         'review',
         true,
         jsonb_build_object(
           'content_hash',current_hash,
           'etag',current_etag,
           'last_modified',current_modified,
           'auto_implement',false,
           'owner_gate',true
         ))
        on conflict (finding_key) do nothing;
      end if;
    else
      update public.hunt_boom_f35_sources
      set last_http_status = response_row.status_code,
          last_error = left(coalesce(response_row.error_msg,
            case when response_row.timed_out then 'timeout' else 'HTTP '||coalesce(response_row.status_code::text,'unknown') end),500),
          consecutive_failures = consecutive_failures + 1,
          last_request_id = null,
          updated_at = now()
      where id = source_row.id;
    end if;

    delete from net._http_response where id = source_row.last_request_id;
    processed := processed + 1;
  end loop;

  return processed;
end;
$$;

revoke all on function boom_internal.enqueue_f35_source_checks() from public, anon, authenticated;
revoke all on function boom_internal.collect_f35_source_checks() from public, anon, authenticated;

do $cron$
begin
  if exists(select 1 from cron.job where jobname='boom-f35-source-enqueue') then
    perform cron.unschedule('boom-f35-source-enqueue');
  end if;
  if exists(select 1 from cron.job where jobname='boom-f35-source-collect') then
    perform cron.unschedule('boom-f35-source-collect');
  end if;
  perform cron.schedule('boom-f35-source-enqueue','17 */6 * * *','select boom_internal.enqueue_f35_source_checks();');
  perform cron.schedule('boom-f35-source-collect','*/10 * * * *','select boom_internal.collect_f35_source_checks();');
end
$cron$;
