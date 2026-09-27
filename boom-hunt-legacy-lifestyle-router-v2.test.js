const assert=require("assert");
const {legacyRoute}=require("./boom-hunt-legacy-lifestyle-router-v2.js");

const cases=[
  ["car blind spot", {title:"Car Blind Spot Rear View Mirror",department:"lifestyle",category:"curtains-blinds"}, "TAXONOMY_REVIEW"],
  ["cat shirt not pet", {title:"Unisex Cat Print T-Shirt",department:"lifestyle",category:"pets"}, "TAXONOMY_REVIEW"],
  ["shoe cabinet", {title:"3 Row Shoe Storage Cabinet",department:"lifestyle",category:"shoes"}, "REMAP","home","storage"],
  ["cosmetic bag", {title:"Travel Cosmetic Bag Large Capacity",department:"lifestyle",category:"beauty"}, "REMAP","accessories","bags"],
  ["cosmetic organizer", {title:"Rotating Makeup Organizer Storage",department:"lifestyle",category:"beauty"}, "REMAP","home","storage"],
  ["usb fridge", {title:"Portable Mini USB Fridge Refrigerator",department:"lifestyle",category:"tech-accessories"}, "REMAP","electrical","home-appliances"],
  ["sports apparel", {title:"Women Fitness Sportswear Tracksuit Set",department:"lifestyle",category:"sports-outdoor"}, "REMAP","sports","activewear"],
  ["sunglasses", {title:"Oversized Sunglasses Women Shades",department:"lifestyle",category:"mirrors"}, "REMAP","accessories","sunglasses"],
  ["phone ring", {title:"Magnetic Cell Phone Ring Holder Stand for iPhone",department:"lifestyle",category:"jewelry"}, "REMAP","tech","stands-holders"],
  ["pet lint roller", {title:"Reusable Lint Roller Pet Hair Remover",department:"lifestyle",category:"pets"}, "REMAP","pets","pet-grooming"],
  ["baby canonical", {title:"Newborn Baby Blanket",department:"baby",category:"baby-bedding"}, "REMAP","kids","baby-bedding"],
  ["adult in baby", {title:"Women's Mesh Bodysuit",department:"baby",category:"women-tops"}, "TAXONOMY_REVIEW"],
  ["phone case", {title:"Silicone iPhone Case Cover",department:"lifestyle",category:"tech-accessories"}, "REMAP","tech","phone-cases"],
  ["camping chair", {title:"Ultralight Folding Camping Chair",department:"lifestyle",category:"sports-outdoor"}, "REMAP","camping","outdoors"],
  ["unisex shoe", {title:"Unisex Men and Women Sports Shoes",department:"lifestyle",category:"shoes"}, "TAXONOMY_REVIEW"]
];
for(const [name,input,status,dep,cat] of cases){
 const got=legacyRoute(input,input.title);
 assert(got,name+" returned no route");
 assert.equal(got.status,status,name+" status");
 if(dep)assert.equal(got.canonical_department,dep,name+" department");
 if(cat)assert.equal(got.canonical_category,cat,name+" category");
}
console.log("PASS legacy lifestyle router",cases.length);
