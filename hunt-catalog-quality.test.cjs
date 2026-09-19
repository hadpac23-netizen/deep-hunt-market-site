const fs=require("fs"),assert=require("assert"),vm=require("vm");
const code=fs.readFileSync("hunt-catalog-quality.js","utf8");
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(code,sandbox);
const Q=sandbox.window.HuntCatalogQuality;
assert(Q&&typeof Q.fit==="function"&&typeof Q.cleanShelves==="function","Catalog quality API missing");

const cases=[
  ["pillows",{item_id:"1",title:"Ergonomic PU Leather Desk Chair with Thick Cushion"},false],
  ["pillows",{item_id:"2",title:"Soft Plush Throw Pillow for Sofa Bedroom"},true],
  ["beauty",{item_id:"3",title:"Modern Hallway Furniture Set with Shoe Cabinet"},false],
  ["beauty",{item_id:"4",title:"Hydrating Facial Serum with Peptide"},true],
  ["beauty-tools",{item_id:"5",title:"Wrist Blood Pressure Meter"},false],
  ["beauty-tools",{item_id:"6",title:"Electric Makeup Brush Cleaner Machine"},true],
  ["home-storage",{item_id:"7",title:"Portable Air Conditioner USB Mini Fan"},false],
  ["home-storage",{item_id:"8",title:"Foldable Closet Storage Organizer Box"},true],
  ["smart-home",{item_id:"9",title:"Handheld Cooling Fan"},false],
  ["smart-home",{item_id:"10",title:"Wireless Smart Doorbell Intercom Camera"},true],
  ["women-shoes",{item_id:"11",title:"Women's Breathable Lace-up Sneakers"},true],
  ["men-shoes",{item_id:"12",title:"Retro Mid-top Boots Mens Casual"},true],
  ["makeup",{item_id:"13",title:"Waterproof Eyeliner Stamp Pen"},true],
  ["skincare",{item_id:"14",title:"Retinol Peptide Facial Serum"},true]
];
for(const [slug,item,expected] of cases)assert.strictEqual(Q.fit(slug,item),expected,slug+" "+item.title);

const snap=JSON.parse(fs.readFileSync("cj-launch-home.json","utf8"));
const cleaned=Q.cleanShelves(snap.shelves||{});
assert(cleaned.report.before>0,"Launch snapshot empty");
assert(cleaned.report.after>0,"Quality gate removed everything");
assert(cleaned.report.rejected>0,"Quality gate did not reject known noise");
assert((cleaned.shelves["women-shoes"]||[]).length>=8,"Women shoes overfiltered");
assert((cleaned.shelves["men-shoes"]||[]).length>=8,"Men shoes overfiltered");
assert((cleaned.shelves["makeup"]||[]).length>=8,"Makeup overfiltered");
assert((cleaned.shelves["skincare"]||[]).length>=8,"Skincare overfiltered");
console.log("hunt_catalog_quality=PASS",JSON.stringify(cleaned.report));