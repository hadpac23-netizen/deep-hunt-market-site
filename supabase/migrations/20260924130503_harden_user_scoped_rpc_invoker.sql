alter function public.is_admin_user() security invoker;
alter function public.create_post_draft(text,text,text,text[],jsonb,text,text,text,text) security invoker;

create policy "users read own drafts"
on public.posts
for select
to authenticated
using (
  author_id = (select auth.uid())
  and status = 'draft'
  and deleted_at is null
);

create policy "users read own recent deleted"
on public.posts
for select
to authenticated
using (
  author_id = (select auth.uid())
  and deleted_at is not null
  and deleted_at >= pg_catalog.clock_timestamp() - interval '10 minutes'
);

alter function public.get_my_drafts() security invoker;
alter function public.get_my_recent_deleted() security invoker;
