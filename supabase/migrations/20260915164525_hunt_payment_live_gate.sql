insert into public.hunt_runtime_controls(key,enabled,owner_approved,note,updated_at)
values (
  'hunt_payment_live',
  false,
  false,
  'Master kill switch for real payment session creation. Must remain OFF until explicit launch approval, live merchant account validation, callback verification, finance ledger settlement handling and supplier fulfillment gates are proven.',
  now()
)
on conflict(key) do update set
  note=excluded.note,
  updated_at=now();