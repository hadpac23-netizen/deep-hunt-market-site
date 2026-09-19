insert into public.hunt_runtime_controls(key,enabled,owner_approved,note,updated_at)
values(
  'hunt_durable_event_identity',
  true,
  true,
  'Owner-approved M23/M24 durable event identity activation. Payments remain disabled.',
  now()
)
on conflict (key) do update
set enabled=true,
    owner_approved=true,
    note=excluded.note,
    updated_at=now();