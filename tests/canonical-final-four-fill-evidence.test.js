const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const evidence=JSON.parse(fs.readFileSync(path.join(root,'ops/hunt-canonical-final-four-fill-evidence-2026-09-30.json'),'utf8'));

const canonical=['kids-underwear','men-loungewear','men-nightwear','men-swimwear'];

test('final-four evidence covers each remaining canonical shelf without claiming launch readiness',()=>{
  assert.equal(evidence.summary.target_shelves,4);
  assert.equal(evidence.summary.shelves_with_verified_catalog_path,4);
  assert.equal(evidence.summary.launch_ready_shelves,0);
  assert.deepEqual(Object.keys(evidence.shelves).sort(),canonical.slice().sort());
  for(const slug of canonical){
    const shelf=evidence.shelves[slug];
    assert.ok(shelf);
    assert.equal(shelf.purchasable,false);
    assert.ok(Array.isArray(shelf.verified_candidates));
    assert.ok(shelf.verified_candidates.length>=1);
    assert.ok(Array.isArray(shelf.blockers));
    assert.ok(shelf.blockers.length>=1);
  }
});

test('EPROLO fill candidates keep positive IL shadow economics and no production effect',()=>{
  for(const slug of ['kids-underwear','men-loungewear']){
    for(const row of evidence.shelves[slug].verified_candidates){
      assert.equal(row.shipping_country,'IL');
      assert.equal(row.profit_gate,'PASS');
      assert.ok(row.supplier_cost_usd>0);
      assert.ok(row.shipping_usd>=0);
      assert.ok(row.shadow_retail_floor_usd>0);
      assert.ok(row.contribution_usd>0);
      assert.ok(row.margin>0);
      assert.equal(row.production_effect,false);
    }
  }
});

test('commercially-held providers remain explicitly non-retail-ready',()=>{
  for(const row of evidence.shelves['men-nightwear'].verified_candidates){
    assert.equal(row.availability_verified,true);
    assert.equal(row.retail_price_verified,false);
    assert.equal(row.checkout_status,'MATTERHORN_ACCOUNT_TERMS_PENDING');
    assert.equal(row.production_effect,false);
  }
  for(const row of evidence.shelves['men-swimwear'].verified_candidates){
    assert.equal(row.availability_verified,true);
    assert.equal(row.retail_price_verified,false);
    assert.equal(row.checkout_status,'PRINTFUL_APPROVAL_REQUIRED');
    assert.ok(row.variant_count>=1);
    assert.equal(row.production_effect,false);
  }
});

test('stale CJ inventory discoveries are rejected rather than promoted',()=>{
  const rejected=new Map(evidence.red_team_rejections.map(x=>[x.item_id,x]));
  for(const itemId of ['2506110754311601900','2506050801591602700']){
    const row=rejected.get(itemId);
    assert.ok(row);
    assert.equal(row.action,'REJECT');
    assert.equal(row.reason,'LIVE_PRODUCT_DETAIL_ZERO_STOCKED_VARIANTS');
  }
});

test('owner gates remain closed',()=>{
  assert.equal(evidence.production_effect,false);
  assert.equal(evidence.payment_live,false);
  assert.equal(evidence.supplier_live_order,false);
  assert.equal(evidence.owner_gate.merge,false);
  assert.equal(evidence.owner_gate.production_deploy,false);
  assert.equal(evidence.owner_gate.payment_live,false);
  assert.equal(evidence.owner_gate.supplier_live_order,false);
});
