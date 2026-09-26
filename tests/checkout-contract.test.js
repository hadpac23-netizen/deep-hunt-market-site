const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("checkout UI contains the required shipping fields",()=>{
  const html=read("checkout.html");
  for(const id of ["hd-ship-name","hd-ship-email","hd-ship-address1","hd-ship-city","hd-ship-province","hd-ship-postal","hd-ship-phone"]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
});

test("quote sends shipping snapshot and runs order preview",()=>{
  const js=read("checkout.js");
  assert.match(js,/shipping_address:\s*address\.value/);
  assert.match(js,/hunt-order-preview/);
  assert.match(js,/runOrderPreview/);
});

test("payment session persists shipping snapshot",()=>{
  const src=read("supabase/functions/hunt-payment-session/index.ts");
  assert.match(src,/SHIPPING_ADDRESS_INVALID/);
  assert.match(src,/shipping_snapshot:shippingSnapshot/);
  assert.match(src,/customer_email:shippingSnapshot\.email/);
});

test("order preview only blocks missing addresses conditionally",()=>{
  const src=read("supabase/functions/hunt-order-preview/index.ts");
  assert.match(src,/shippingAddressReady/);
  assert.match(src,/if\(!shippingReady\) blockers\.push\("SHIPPING_ADDRESS_NOT_COLLECTED"\)/);
  assert.doesNotMatch(src,/^\s*blockers\.push\("SHIPPING_ADDRESS_NOT_COLLECTED"\);/m);
  assert.match(src,/shipping_address_ready:shippingReady/);
});


test("address validation focuses the first invalid shipping field",()=>{
  const js=read("checkout.js");
  assert.match(js,/Object\.keys\(address\.errors\|\|\{\}\)\.find\(key=>addressFields\[key\]\)/);
  assert.match(js,/\$\(addressFields\[firstField\]\)\?\.focus\(\)/);
});
