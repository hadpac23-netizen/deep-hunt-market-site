const fs=require("fs"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-hunt-cinematic-stylist-integration-contract.json","utf8"));
const s=JSON.parse(fs.readFileSync("evidence/HUNT-CINEMATIC-STYLIST-SHELF-SHADOW-2026-09-22.json","utf8"));
const q=JSON.parse(fs.readFileSync("evidence/HUNT-CINEMATIC-STYLIST-INTEGRATION-QA-2026-09-22.json","utf8"));
const academy=JSON.parse(fs.readFileSync("boom-stylist-academy-contract.json","utf8"));
const html=fs.readFileSync("boom-hunt-cinematic-stylist-shadow-v1.html","utf8");
const studio=fs.readFileSync("boom-brain-studio.js","utf8");

assert.equal(c.mode,"SHADOW_INTEGRATION");
assert.equal(c.production_effect,false);
assert(c.baseline_rule.includes("Cinematic first"));
assert.equal(c.current_state.verified_products,40);
assert.equal(c.current_state.commercial_hero_ready,0);
assert.equal(c.current_state.production_authority,false);

assert.equal(s.mode,"SHADOW_ONLY");
assert.equal(s.production_effect,false);
assert.equal(s.scenes.length,5);
assert.equal(s.summary.visual_hero_scenes,5);
assert.equal(s.summary.commercial_hero_ready,0);
assert.equal(s.summary.exact_artwork_pending,5);
assert.equal(s.summary.production_authority,false);
for(const scene of s.scenes){
  assert(scene.hero,"scene hero missing");
  assert.equal(scene.rail.length,4);
  assert.equal(scene.gates.product_truth,"PASS");
  assert.equal(scene.gates.style_fit,"PASS");
  assert.equal(scene.gates.display_light,"PASS");
  assert.equal(scene.gates.display_dark,"PASS");
  assert.equal(scene.gates.owner_gate,"REQUIRED");
  assert.equal(scene.production_authority,false);
}

assert.equal(q.production_effect,false);
assert.equal(q.results.light.stage,"PASS");
assert.equal(q.results.dark.stage,"PASS");
assert.equal(q.results.light.layout_mode,"CINEMATIC_SCENE_NOT_GRID");
assert.equal(q.results.dark.layout_mode,"CINEMATIC_SCENE_NOT_GRID");
assert.equal(q.gate_state.visual_scenes_ready,5);
assert.equal(q.gate_state.commercial_hero_ready,0);
assert.equal(q.gate_state.exact_printful_artwork,"PENDING");
assert.equal(q.gate_state.owner_gate,"REQUIRED");
assert.equal(q.gate_state.mastery_change,false);

assert.equal(academy.version,"BOOM-STYLIST-ACADEMY-V5");
assert.equal(academy.current_state.cinematic_shelf_integration,"PASS_SHADOW_SCENE_RENDER");
assert.equal(academy.current_state.cinematic_visual_scenes,5);
assert.equal(academy.current_state.cinematic_commercial_hero_ready,0);
assert.equal(academy.current_state.production_shelf_authority,false);
assert.equal(academy.current_state.mastery_level,0);

assert(html.includes("A shopping world that reveals products like scenes, not rows."));
assert(html.includes('class="hero"'));
assert(html.includes('class="rail"'));
assert(!html.includes('class="grid"'));
assert(html.includes("SHADOW · BOOM STYLIST · PRODUCTION OFF"));
assert(studio.includes("Cinematic Shelf Integration"));
assert(studio.includes("HUNT-CINEMATIC-STYLIST-INTEGRATION-QA-2026-09-22.json"));
console.log("PASS boom-hunt-cinematic-stylist-integration");
