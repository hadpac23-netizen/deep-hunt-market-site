const assert=require("node:assert/strict");
const Mirror=require("./boom-mirror-core.js");

const consent=Mirror.createConsent({
  accepted:true,
  photo_preview:true,
  retention:"none",
  share_allowed:false
});
assert.equal(Mirror.validateConsent(consent).valid,true);

const session=Mirror.createSession({consent,inputMode:"upload"});
assert.equal(session.created,true);
assert.equal(session.persistent_source_photo,false);
assert.equal(session.generated_avatar_persistence,false);

const necklace=Mirror.focusPlan("necklace");
assert.equal(necklace.valid,true);
assert.equal(necklace.anchor,"neckline_region");
assert.deepEqual(necklace.frames,["detail","portrait","full_look"]);

const ring=Mirror.focusPlan("ring",{reducedMotion:true});
assert.equal(ring.transition,"instant");
assert.equal(ring.autoplay,false);

const product={
  provider:"HyperSKU",
  item_id:"hs-1",
  variant_id:"v1",
  image_verified:true,
  truth_status:"live_verified"
};
const decision=Mirror.renderDecision({
  productType:"sunglasses",
  product,
  confidence:.9
});
assert.equal(decision.can_render,true);
assert.equal(decision.exact_fit_claim,false);
assert.equal(decision.body_scoring,false);
assert.equal(decision.attractiveness_scoring,false);
assert.equal(decision.sensitive_attribute_inference,false);

const low=Mirror.renderDecision({productType:"hat",product,confidence:.4});
assert.equal(low.can_render,false);
assert.equal(low.fallback,"SIMPLIFIED_PREVIEW");

const badTruth=Mirror.renderDecision({
  productType:"earrings",
  product:{provider:"CJdropshipping",item_id:"cj-1",variant_id:"v2",image_verified:false,truth_status:"RECHECK_REQUIRED"},
  confidence:.9
});
assert.equal(badTruth.can_render,false);
assert.equal(badTruth.fallback,"PRODUCT_IMAGE_ONLY");

const memory=Mirror.sessionMemoryRecord({
  session,
  product,
  productType:"sunglasses",
  lookId:"look-1"
});
assert.equal(memory.type,"try_on");
assert.equal(memory.stores_source_photo,false);

console.log("BOOM Mirror Core tests: PASS");
