-- Prefer stable HTTP validators for F35 change detection.
-- Fall back to content hash only when ETag/Last-Modified are unavailable.

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
  change_basis text;
  processed integer := 0;
begin
  for source_row in
    select id, source_key, display_name, canonical_url,
           last_request_id, last_content_hash, last_etag, last_modified
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

      if source_row.last_etag is not null and current_etag is not null then
        changed := source_row.last_etag <> current_etag;
        change_basis := 'etag';
      elsif source_row.last_modified is not null and current_modified is not null then
        changed := source_row.last_modified <> current_modified;
        change_basis := 'last_modified';
      else
        changed := source_row.last_content_hash is not null and source_row.last_content_hash <> current_hash;
        change_basis := 'content_hash';
      end if;

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
         'Official monitored source changed according to its stable freshness signal. BOOM must review the delta before changing any Studio or Brain behavior.',
         source_row.canonical_url,
         'other',
         0.80,
         'review_required',
         'review',
         true,
         jsonb_build_object(
           'change_basis',change_basis,
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

    processed := processed + 1;
  end loop;

  return processed;
end;
$$;

revoke all on function boom_internal.collect_f35_source_checks() from public, anon, authenticated;
