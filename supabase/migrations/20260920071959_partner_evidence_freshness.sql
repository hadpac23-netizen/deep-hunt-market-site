-- Source-track persisted supplier evidence timestamps used by BOOM confidence decay.
-- Existing verified values are preserved; this migration never fabricates verification.
alter table public.hunt_partner_matrix
  add column if not exists terms_verified_at timestamptz,
  add column if not exists media_rights_verified_at timestamptz;

comment on column public.hunt_partner_matrix.terms_verified_at
  is 'Timestamp of the latest verified supplier/program terms evidence; null means unverified.';
comment on column public.hunt_partner_matrix.media_rights_verified_at
  is 'Timestamp of the latest verified commercial/media rights evidence; null means unverified.';