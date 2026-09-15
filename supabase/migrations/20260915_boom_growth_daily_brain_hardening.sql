drop policy if exists "Admins manage HUNT growth daily briefs" on public.hunt_growth_daily_briefs;
create policy "Admins manage HUNT growth daily briefs"
on public.hunt_growth_daily_briefs
for all
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.is_admin
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.is_admin
));

drop policy if exists "Admins manage HUNT distribution drafts" on public.hunt_distribution_drafts;
create policy "Admins manage HUNT distribution drafts"
on public.hunt_distribution_drafts
for all
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.is_admin
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.is_admin
));

create index if not exists hunt_distribution_drafts_approved_by_idx
on public.hunt_distribution_drafts(approved_by)
where approved_by is not null;

create index if not exists hunt_distribution_drafts_day_status_idx
on public.hunt_distribution_drafts(day desc, status);

create index if not exists hunt_growth_daily_briefs_generated_at_idx
on public.hunt_growth_daily_briefs(generated_at desc);
