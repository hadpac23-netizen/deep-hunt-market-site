const assert=require("assert");
const {classifyProduct}=require("./boom-hunt-taxonomy-gate-v2.js");

const cases=[
  {
    name:"necklace with gift wording must leave Gifts",
    input:{title:"Angel Wings Butterfly Necklace Gift For Her",department:"gifts",category:"party"},
    expect:{status:"REMAP",department:"accessories",category:"jewelry-necklaces"}
  },
  {
    name:"pet bandana must not be fashion scarf",
    input:{title:"Thanksgiving Dog Bandana Pet Scarf",department:"accessories",category:"scarves"},
    expect:{status:"REMAP",department:"pets",category:"pet-accessories"}
  },
  {
    name:"kitchen colander must not be shoes",
    input:{title:"Nylon Strainer Large Scoop Colander Kitchen Cooking Tool",department:"accessories",category:"shoes"},
    expect:{status:"REMAP",department:"kitchen",category:"kitchen-tools"}
  },
  {
    name:"phone case routes to tech",
    input:{title:"Soft Silicone Phone Case for Samsung Galaxy",department:"lifestyle",category:"tech-accessories"},
    expect:{status:"REMAP",department:"tech",category:"phone-cases"}
  },
  {
    name:"baby romper must not become scarf",
    input:{title:"Baby Cotton Romper with Scarf Warm One Piece",department:"accessories",category:"scarves"},
    expect:{status:"REMAP",department:"kids",category:"baby-clothing"}
  },
  {
    name:"women sweater must not become scarf due shawl",
    input:{title:"Women Navy Collar Shawl Tie-In Knit Sweater Set",department:"accessories",category:"scarves"},
    expect:{status:"REMAP",department:"women",category:"women-knitwear"}
  },
  {
    name:"party balloon stays review until canonical gift category is resolved",
    input:{title:"Birthday Party Decoration Balloon Set",department:"gifts",category:"party"},
    expect:{status:"TAXONOMY_REVIEW"}
  },
  {
    name:"ambiguous product quarantines instead of first-match",
    input:{title:"Creative Lifestyle Organizer",department:"gifts",category:"party"},
    expect:{status:"TAXONOMY_REVIEW"}
  },
  {
    name:"restricted product is blocked",
    input:{title:"Tactical switchblade knife",department:"sports",category:"outdoors"},
    expect:{status:"BLOCK"}
  }
];

for(const c of cases){
  const got=classifyProduct(c.input);
  assert.equal(got.status,c.expect.status,c.name+" status");
  if(c.expect.department)assert.equal(got.canonical_department,c.expect.department,c.name+" department");
  if(c.expect.category)assert.equal(got.canonical_category,c.expect.category,c.name+" category");
}
console.log("PASS boom-hunt-taxonomy-gate-v2",cases.length,"cases");
