import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../supabase/functions/hunt-storefront/eprolo-shelves.ts', import.meta.url), 'utf8');

test('EPROLO canonical shelves quarantine obvious non-apparel school-related products from Kids Schoolwear', () => {
  assert.match(source, /d===\"kids\"&&s===\"kids-schoolwear\"/, 'schoolwear semantic guard must remain scoped to Kids Schoolwear');
  assert.match(source, /NON_APPAREL_IN_KIDS_SCHOOLWEAR/, 'schoolwear guard must emit an auditable quarantine reason');

  for (const phrase of ['watercolor', 'drawing book', 'art kit', 'microscope', 'pencil case', 'stationery box', 'parachute toy', 'gymnastics equipment', 'science toy', 'art supplies']) {
    assert.ok(source.includes(phrase), `schoolwear guard must cover ${phrase}`);
  }
});
