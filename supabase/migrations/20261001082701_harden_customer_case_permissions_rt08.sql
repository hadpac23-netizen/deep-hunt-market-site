begin;

alter table public.hunt_payment_sessions
  add column if not exists guest_owner_token_hash text;

comment on column public.hunt_payment_sessions.guest_owner_token_hash is
  'SHA-256 proof for guest session ownership; raw token is returned once and never stored.';

create schema if not exists private;

create or replace function private.hunt_customer_owns_case_links(
  p_user_id uuid,
  p_payment_session_id uuid default null,
  p_order_id uuid default null,
  p_fulfillment_order_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id is not null
    and p_user_id = (select auth.uid())
    and (
      p_payment_session_id is null
      or exists (
        select 1
        from public.hunt_payment_sessions ps
        where ps.id = p_payment_session_id
          and ps.user_id = p_user_id
      )
    )
    and (
      p_order_id is null
      or exists (
        select 1
        from public.hunt_orders o
        where o.id = p_order_id
          and o.user_id = p_user_id
      )
    )
    and (
      p_fulfillment_order_id is null
      or exists (
        select 1
        from public.hunt_fulfillment_orders f
        join public.hunt_orders o on o.id = f.order_id
        where f.id = p_fulfillment_order_id
          and o.user_id = p_user_id
      )
    );
$$;

revoke all on function private.hunt_customer_owns_case_links(uuid,uuid,uuid,uuid) from public;
revoke all on function private.hunt_customer_owns_case_links(uuid,uuid,uuid,uuid) from anon;
grant usage on schema private to authenticated;
grant execute on function private.hunt_customer_owns_case_links(uuid,uuid,uuid,uuid) to authenticated;

alter table public.hunt_support_tickets enable row level security;
alter table public.hunt_return_requests enable row level security;

revoke all on table public.hunt_support_tickets from anon, authenticated;
revoke all on table public.hunt_return_requests from anon, authenticated;

grant select (
  id,user_id,customer_email,payment_session_id,order_id,category,subject,message,
  priority,status,created_at,updated_at
) on table public.hunt_support_tickets to authenticated;
grant insert (
  user_id,customer_email,payment_session_id,order_id,category,subject,message,priority
) on table public.hunt_support_tickets to authenticated;
grant update (
  customer_email,category,subject,message,priority
) on table public.hunt_support_tickets to authenticated;

grant select (
  id,user_id,payment_session_id,fulfillment_order_id,order_id,reason_code,reason_detail,
  requested_items,status,customer_resolution,return_tracking_number,return_tracking_url,
  requested_at,updated_at
) on table public.hunt_return_requests to authenticated;
grant insert (
  user_id,payment_session_id,fulfillment_order_id,order_id,reason_code,reason_detail,requested_items
) on table public.hunt_return_requests to authenticated;

drop policy if exists hunt_support_owner_insert on public.hunt_support_tickets;
drop policy if exists hunt_support_owner_select on public.hunt_support_tickets;
drop policy if exists hunt_support_owner_update on public.hunt_support_tickets;

create policy hunt_support_owner_select
on public.hunt_support_tickets for select to authenticated
using ((select auth.uid()) = user_id);

create policy hunt_support_owner_insert
on public.hunt_support_tickets for insert to authenticated
with check (
  private.hunt_customer_owns_case_links(user_id,payment_session_id,order_id,null)
  and status = 'open'
  and internal_notes is null
  and resolved_at is null
);

create policy hunt_support_owner_update
on public.hunt_support_tickets for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  private.hunt_customer_owns_case_links(user_id,payment_session_id,order_id,null)
  and status in ('open','waiting_customer','closed')
  and internal_notes is null
);

drop policy if exists hunt_returns_owner_insert on public.hunt_return_requests;
drop policy if exists hunt_returns_owner_select on public.hunt_return_requests;

create policy hunt_returns_owner_select
on public.hunt_return_requests for select to authenticated
using ((select auth.uid()) = user_id);

create policy hunt_returns_owner_insert
on public.hunt_return_requests for insert to authenticated
with check (
  private.hunt_customer_owns_case_links(user_id,payment_session_id,order_id,fulfillment_order_id)
  and status = 'requested'
  and internal_notes is null
  and approved_at is null
  and received_at is null
  and completed_at is null
);

commit;
