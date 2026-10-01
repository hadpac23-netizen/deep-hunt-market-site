import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../supabase/functions/hunt-storefront/eprolo-shelves.ts', import.meta.url), 'utf8');

test('EPROLO canonical shelves quarantine obvious non-apparel swimming accessories from kids swimwear', () => {
  assert.match(source, /d===\"kids\"&&s===\"kids-swimwear\"/, 'kids-swimwear semantic guard must remain scoped to the kids canonical shelf');
  assert.match(source, /NON_APPAREL_IN_KIDS_SWIMWEAR/, 'kids-swimwear guard must emit an auditable quarantine reason');
  for (const phrase of ['inflatable', 'seat ring', 'swim(?:ming)? ring', 'snorkel', 'mask', 'nose clip', 'swim belt', 'pool toy']) {
    assert.ok(source.includes(phrase), `kids-swimwear guard must cover ${phrase}`);
  }
});
