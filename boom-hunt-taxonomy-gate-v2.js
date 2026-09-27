"use strict";

const BLOCKED=/\b(weapon|gun|firearm|ammo|ammunition|knife|blade|dagger|sword|machete|taser|pepper spray|mace|firework|explosive|vape|cigarette|nicotine|cbd|thc|cannabis|marijuana|adult|porn|steroid|diet pill|laxative)\b/i;

const MARKETING_TAGS=/\b(gift|gifts|gift for her|gift for him|birthday gift|christmas gift|summer|winter|trending|viral|new arrival|hot sale|best seller|for her|for him)\b/ig;

const RULES=[
  {id:"PET_HOUSE",department:"pets",category:"pet-houses",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,40}\b(bed|house|condo|cave|kennel)\b|\b(bed|house|condo|cave|kennel)\b.{0,40}\b(dog|cat|pet|puppy|kitten)\b/i},
  {id:"PET_CLOTHING",department:"pets",category:"pet-clothing",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,40}\b(hoodie|coat|shirt|dress|clothes|clothing|jacket|sweater)\b/i},
  {id:"PET_ACCESSORY",department:"pets",category:"pet-accessories",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,50}\b(bandana|scarf|collar|leash|harness|bowl|toy|brush|accessory|accessories)\b/i},

  {id:"BABY_CLOTHING",department:"kids",category:"baby-clothing",rx:/\b(baby|newborn|infant)\b.{0,50}\b(romper|onesie|bodysuit|clothes|clothing|outfit|pants|shirt|dress|jumpsuit|set)\b/i},
  {id:"BABY_CARE_REVIEW",department:"kids",category:null,rx:/\b(baby|newborn|infant|nappy|diaper)\b.{0,60}\b(bag|carrier|stroller|care|feeding|bottle|changing)\b/i,review:true},

  {id:"PHONE_CASE",department:"tech",category:"phone-cases",rx:/\b(phone|iphone|galaxy|smartphone|mobile)\b.{0,30}\b(case|cover)\b|\b(case|cover)\b.{0,30}\b(phone|iphone|galaxy|smartphone|mobile)\b/i},
  {id:"GAMING",department:"tech",category:"gaming",rx:/\b(gamepad|game controller|gaming mouse|gaming keyboard|gaming controller)\b/i},
  {id:"WEARABLE_ACCESSORY",department:"tech",category:"wearable-accessories",rx:/\b(smartwatch|smart watch|apple watch|iwatch)\b.{0,35}\b(band|strap|charger|stand|protector|case)\b/i},

  {id:"KITCHEN_TOOL",department:"kitchen",category:"kitchen-tools",rx:/\b(kitchen|cooking|cookware)\b.{0,50}\b(spoon|strainer|colander|utensil|whisk|spatula|peeler|tongs|grater|shovel|filter|tool)\b|\b(spoon|strainer|colander|whisk|spatula|peeler|tongs|grater)\b.{0,50}\b(kitchen|cooking)\b/i},
  {id:"BATH",department:"home",category:"bath",rx:/\b(bathroom|bath|shower|toilet)\b.{0,50}\b(brush|mat|curtain|rack|holder|caddy|towel|accessory|accessories)\b/i},

  {id:"WOMEN_KNITWEAR",department:"women",category:"women-knitwear",rx:/\b(women|woman|female)\b.{0,50}\b(sweater|cardigan|knitwear|knit|pullover)\b|\b(sweater|cardigan|knitwear|pullover)\b.{0,50}\b(women|woman|female)\b/i},
  {id:"WOMEN_DRESS",department:"women",category:"women-dresses",rx:/\b(women|woman|female)\b.{0,50}\b(dress|dresses)\b|\b(dress|dresses)\b.{0,50}\b(women|woman|female)\b/i},
  {id:"MEN_TOP",department:"men",category:"men-tops",rx:/\b(men|mens|men's|male)\b.{0,40}\b(t-shirt|shirt|polo|tank top)\b/i},

  {id:"JEWELRY_NECKLACE",department:"accessories",category:"jewelry-necklaces",rx:/\b(necklace|necklaces|pendant|choker)\b/i},
  {id:"JEWELRY_EARRING",department:"accessories",category:"jewelry-earrings",rx:/\b(earring|earrings)\b/i},
  {id:"JEWELRY_BRACELET",department:"accessories",category:"jewelry-bracelets",rx:/\b(bracelet|bracelets|bangle|bangles)\b/i},
  {id:"HAIR_ACCESSORY",department:"accessories",category:"hair-accessories",rx:/\b(hair clip|hairpin|hair pin|hair claw|hair tie|scrunchie|headband|barrette|hair comb)\b/i},
  {id:"HAT",department:"accessories",category:"hats",rx:/\b(bucket hat|baseball cap|beanie|beret|hat|caps?)\b/i},
  {id:"SOCKS",department:"accessories",category:"socks",rx:/\b(sock|socks|stocking|stockings|hosiery)\b/i},
  {id:"SCARF",department:"accessories",category:"scarves",rx:/\b(scarf|scarves|shawl)\b/i},
  {id:"BELT",department:"accessories",category:"belts",rx:/\b(belt|belts)\b/i},
  {id:"BAG_ACCESSORY",department:"accessories",category:"bag-accessories",rx:/\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap)\b/i},
  {id:"BAG",department:"accessories",category:"bags",rx:/\b(handbag|purse|tote bag|crossbody bag|shoulder bag|backpack|schoolbag)\b/i},

  {id:"PARTY",department:"gifts",category:null,rx:/\b(party decoration|party supplies|balloon|gift wrap|wrapping paper|gift box|greeting card|party favor)\b/i,review:true}
];

const CROSS_DEPARTMENT_EXCLUSIONS=[
  {department:"gifts",rx:/\b(necklace|pendant|choker|earring|bracelet|bangle|jewelry|jewellery|handbag|purse|tote|crossbody|backpack|wallet|belt|scarf|shawl|hat|cap|beanie|sock|hair clip|hairpin|headband|scrunchie|watch)\b/i,reason:"CORE_PRODUCT_IS_NOT_GIFT"},
  {department:"accessories",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,50}\b(bandana|scarf|collar|leash|harness|bed|house|coat|shirt|hoodie)\b/i,reason:"PET_PRODUCT_NOT_FASHION_ACCESSORY"},
  {department:"accessories",rx:/\b(baby|newborn|infant|nappy|diaper)\b.{0,50}\b(bag|carrier|romper|onesie|bodysuit|stroller)\b/i,reason:"BABY_PRODUCT_NOT_GENERAL_ACCESSORY"},
  {department:"sports",rx:/\b(watch|wristwatch)\b/i,reason:"WATCH_NOT_SPORTS_BY_KEYWORD_ALONE"}
];

function cleanText(v){return String(v||"").replace(MARKETING_TAGS," ").replace(/\s+/g," ").trim();}
function identityText(p){return cleanText([p.title,p.source_category,p.category,p.description].filter(Boolean).join(" "));}

function classifyProduct(product={}){
  const raw=[product.title,product.source_category,product.category,product.description].filter(Boolean).join(" ");
  if(BLOCKED.test(raw)) return {status:"BLOCK",reason:"POLICY_BLOCKED_TERM",production_exposure:false};

  const text=identityText(product);
  const proposedDepartment=String(product.proposed_department||product.department||"").trim();
  const proposedCategory=String(product.proposed_category||product.category||"").trim();

  const matches=RULES.filter(r=>r.rx.test(text));
  const high=matches[0]||null;

  if(matches.length>1){
    const unique=new Set(matches.map(x=>x.department+"/"+String(x.category)));
    if(unique.size>1){
      return {
        status:"TAXONOMY_REVIEW",
        reason:"MULTIPLE_CORE_IDENTITIES",
        candidates:matches.slice(0,6).map(x=>({rule:x.id,department:x.department,category:x.category})),
        production_exposure:false
      };
    }
  }

  if(!high){
    return {
      status:"TAXONOMY_REVIEW",
      reason:"NO_HIGH_CONFIDENCE_CORE_IDENTITY",
      proposed_department:proposedDepartment||null,
      proposed_category:proposedCategory||null,
      production_exposure:false
    };
  }

  const cross=CROSS_DEPARTMENT_EXCLUSIONS.find(x=>x.department===proposedDepartment&&x.rx.test(text));
  if(high.review){
    return {
      status:"TAXONOMY_REVIEW",
      reason:"CORE_IDENTITY_NEEDS_CANONICAL_CATEGORY",
      preferred_department:high.department,
      matched_rule:high.id,
      production_exposure:false
    };
  }

  if(cross || proposedDepartment!==high.department || (proposedCategory && proposedCategory!==high.category)){
    return {
      status:"REMAP",
      reason:cross?.reason||"PROPOSED_ROUTE_CONFLICTS_WITH_CORE_IDENTITY",
      canonical_department:high.department,
      canonical_category:high.category,
      matched_rule:high.id,
      source_route:{department:proposedDepartment||null,category:proposedCategory||null},
      production_exposure:false
    };
  }

  return {
    status:"PASS",
    canonical_department:high.department,
    canonical_category:high.category,
    matched_rule:high.id,
    production_exposure:false
  };
}

module.exports={classifyProduct,cleanText,RULES,CROSS_DEPARTMENT_EXCLUSIONS};
