-- Runtime migration-history parity only.
-- Accidental tool probe on 2026-10-01 executed SELECT 1 and made no schema/data/permission change.
select 1;
