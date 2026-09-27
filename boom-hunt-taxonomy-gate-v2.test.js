const assert=require("assert");
const {classifyProduct}=require("./boom-hunt-taxonomy-gate-v2.js");

const cases=[
  ["necklace gift",{title:"Angel Wings Necklace Gift For Her",department:"gifts",category:"party"},"REMAP","accessories","jewelry-necklaces"],
  ["men top overrides decorative necklace word",{title:"Street Necklace Print Sleeveless T-Shirt Men's Summer Base Layer",department:"lifestyle",category:"knitwear"},"REMAP","men","men-tops"],
  ["real jewelry ring",{title:"Diamond Adjustable Finger Ring for Women",department:"lifestyle",category:"jewelry"},"REMAP","accessories","jewelry-rings"],
  ["ring flash light quarantines",{title:"48 LED Ring Flash Light Camera Kit",department:"lifestyle",category:"jewelry"},"TAXONOMY_REVIEW"],
  ["regular watch",{title:"Men Quartz Wristwatch",department:"lifestyle",category:"sports-outdoor"},"REMAP","accessories","watches"],
  ["smart watch",{title:"Bluetooth ECG Smart Watch",department:"lifestyle",category:"tech-accessories"},"REMAP","tech","wearables"],
  ["watch screen protector",{title:"Glass Screen Protector for Galaxy Watch",department:"lifestyle",category:"tech-accessories"},"REMAP","tech","wearable-accessories"],
  ["pet scarf",{title:"Dog Bandana Pet Scarf",department:"accessories",category:"scarves"},"REMAP","pets","pet-accessories"],
  ["kitchen colander",{title:"Nylon Strainer Large Scoop Colander Kitchen Cooking Tool",department:"accessories",category:"shoes"},"REMAP","kitchen","kitchen-tools"],
  ["phone case",{title:"Soft Silicone Phone Case for Samsung Galaxy",department:"lifestyle",category:"tech-accessories"},"REMAP","tech","phone-cases"],
  ["steel ring bra not jewelry",{title:"Women's Bra Without Steel Ring",department:"women",category:"women-underwear"},"TAXONOMY_REVIEW"],
  ["home ring decor not jewelry",{title:"Iron Ring Dream Catcher Wall Decoration",department:"home",category:"home-decor"},"TAXONOMY_REVIEW"],
  ["cap light not hat",{title:"Camping Cap Light with Clip",department:"lifestyle",category:"hats"},"TAXONOMY_REVIEW"],
  ["restricted product blocked",{title:"Adult vibrator product",department:"lifestyle",category:"accessories"},"BLOCK"]
];

for(const [name,input,status,dep,cat] of cases){
  const got=classifyProduct(input);
  assert.equal(got.status,status,name+" status");
  if(dep)assert.equal(got.canonical_department,dep,name+" department");
  if(cat)assert.equal(got.canonical_category,cat,name+" category");
}
console.log("PASS boom-hunt-taxonomy-gate-v2",cases.length,"cases");
