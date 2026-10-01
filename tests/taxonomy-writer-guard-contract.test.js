import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(
  new URL('../supabase/migrations/20261001013000_hunt_taxonomy_writer_guard_v3.sql', import.meta.url),
  'utf8'
);

test('CJ mass-fill merges source payload instead of replacing canonical taxonomy', () => {
  assert.match(
    migration,
    /source_payload\s*=\s*coalesce\(public\.hunt_shelf_candidates\.source_payload\s*,\s*'\{\}'::jsonb\)\s*\|\|\s*excluded\.source_payload/i
  );
  assert.doesNotMatch(
    migration,
    /source_payload\s*=\s*excluded\.source_payload\s*[,;]/i,
    'mass-fill must never replace the full source_payload on conflict'
  );
});

test('shadow taxonomy guard blocks both deletion and silent remap of canonical taxonomy', () => {
  assert.match(migration, /old\.production_effect\s*=\s*false/i);
  assert.match(migration, /new_gate\s+is\s+null/i);
  assert.match(migration, /new_shelf\s*=\s*''/i);
  assert.match(migration, /new_shelf\s+is\s+distinct\s+from\s+old_shelf/i);
  assert.match(migration, /new_department\s+is\s+distinct\s+from\s+old_department/i);
  assert.match(migration, /jsonb_set\([\s\S]*?'\{taxonomy_gate_v2\}'[\s\S]*?old_gate[\s\S]*?true[\s\S]*?\)/i);
});

test('taxonomy guard pins an empty search_path', () => {
  assert.match(
    migration,
    /create\s+or\s+replace\s+function\s+public\.hunt_preserve_shadow_taxonomy_gate_v2\(\)[\s\S]*?language\s+plpgsql[\s\S]*?set\s+search_path\s*=\s*''[\s\S]*?as\s+\$function\$/i
  );
});

test('taxonomy writer patch stays shadow-only and does not activate commerce paths', () => {
  assert.doesNotMatch(migration, /hunt_payment_live/i);
  assert.doesNotMatch(migration, /hunt_payplus_callback_accept_paid/i);
  assert.doesNotMatch(migration, /supplier_live_order/i);
  assert.doesNotMatch(migration, /sellable\s*=\s*true/i);
  assert.doesNotMatch(migration, /production_effect\s*=\s*true/i);
});
