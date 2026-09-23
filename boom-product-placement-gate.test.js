const assert=require("node:assert/strict");
const gate=require("./boom-product-placement-gate.js");
function e(title,department,category){return gate.evaluate({title,current_department:department,current_category:category});}
let r=e("Trendy brand suitable for iPhone 14 cartoon phone case","women","women-evening");
assert.equal(r.decision,"REJECT"); assert.equal(r.placement_action,"MOVE"); assert.equal(r.canonical_category,"phone-cases");
r=e("Carrot Cat Bed Winter Warm Plush Pet Small Dog Bed","toys","plush-toys");
assert.equal(r.decision,"REJECT"); assert.equal(r.canonical_department,"pets"); assert.equal(r.canonical_category,"pet-houses");
r=e("Ripped Jeans Women Skinny High Waist Denim Pants","women","women-bottoms");
assert.equal(r.decision,"REJECT"); assert.equal(r.canonical_category,"women-jeans");
r=e("Ripped Jeans Women Skinny High Waist Denim Pants","women","women-jeans");
assert.equal(r.decision,"PASS"); assert.equal(r.placement_action,"KEEP");
r=e("Y13 Smart Bracelet Bluetooth Heart Rate Fitness Tracker","tech","wearables");
assert.equal(r.decision,"PASS"); assert.equal(r.canonical_category,"wearables");
r=e("Bracelet style data cable suitable for Apple Android fast charging cable","tech","chargers-cables");
assert.equal(r.decision,"PASS"); assert.equal(r.canonical_category,"chargers-cables");
r=e("Pleated Print Fashion Suit Women's Autumn Two Piece Set","men","men-tops");
assert(["REJECT","REVIEW"].includes(r.decision)); assert.notEqual(r.placement_action,"KEEP");
r=e("Generic decorative item without reliable type evidence","gifts","gift-decor");
assert.equal(r.decision,"UNKNOWN"); assert.equal(r.placement_action,"HOLD_UNKNOWN");
console.log("Product Placement Gate V1: PASS");

r=e("Women's Summer New Heavy Industry Skirt Hollow Mesh Embroidery Dress","women","women-dresses");
assert.notEqual(r.canonical_category,"crafts");
r=e("White sleeveless off-the-shoulder bag hip dress Women's stretch bandage dress","women","women-dresses");
assert.notEqual(r.canonical_category,"bags");
r=e("Women's Traceless Sports Bra Steel Ring Free Shockproof","women","women-underwear");
assert.notEqual(r.canonical_category,"jewelry-rings");
r=e("New Men's Computer Handbag Light Notebook 15.6 Inch Business Briefcase","women","women-underwear");
assert.notEqual(r.canonical_category,"stationery");
console.log("Product Placement false-positive regressions: PASS");

for(const [title,dep,cat,bad] of [
  ["Handmade Plush Cat Ear Fox Headband Accessory Realistic Animal Ears","toys","plush-toys","plush-toys"],
  ["AirPods silicone wireless Bluetooth earphone protective case","tech","audio","audio"],
  ["WebCam Cover Shutter Magnet Slider Privacy Sticker","tech","cameras","cameras"],
  ["Refrigerator Egg Storage Box Kitchen Large Capacity","home","home-storage","home-storage"],
  ["Dog socks pet socks non-slip cotton socks","accessories","socks","socks"],
  ["Pet absorbent towel dog cat bath towel","home","home-textiles","home-textiles"],
  ["Transparent Waterproof Glue Home Decoration Repair Leak","home","home-decor","home-decor"],
  ["Reusable Drinking Straw with Cleaning Brush","home","cleaning","cleaning"],
  ["Automotive Sunshade Mirror LED Makeup Mirror","home","mirrors","mirrors"],
  ["Hand Sanitizer Dispenser Bracelet Wristband","accessories","jewelry-bracelets","jewelry-bracelets"]
]){
  const q=e(title,dep,cat);
  assert(!(q.decision==="PASS"&&q.canonical_category===bad),title+" must not self-validate wrong category");
}
console.log("Product Placement Stage 2 regressions: PASS");

r=gate.evaluate({
  title:"Ambiguous fashion item with no deterministic type words",
  current_department:"women",current_category:"women-dresses",
  supplier_category_id:1241,
  supplier_taxonomy_current_rail_verified:true
});
assert.equal(r.decision,"PASS");
assert.equal(r.placement_action,"KEEP");
assert(r.reason_codes.includes("SUPPLIER_TAXONOMY_KEEP_SUPPORT"));

r=gate.evaluate({
  title:"Men shoes leather loafer",
  current_department:"women",current_category:"women-dresses",
  supplier_category_id:1241,
  supplier_taxonomy_current_rail_verified:true
});
assert.notEqual(r.decision,"PASS");
console.log("Product Placement supplier-taxonomy KEEP support: PASS");
