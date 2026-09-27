"use strict";

const REVIEW=(reason)=>({status:"TAXONOMY_REVIEW",reason,autofill_eligible:false});
const REMAP=(department,category,reason)=>({status:"REMAP",canonical_department:department,canonical_category:category,reason,autofill_eligible:true});

function legacyRoute(product={},text=""){
  const dep=String(product.proposed_department||product.department||"").toLowerCase();
  const shelf=String(product.proposed_category||product.category||"");
  const t=String(text||product.title||"").toLowerCase();

  // Baby is not one of HUNT's canonical 17 departments.
  if(dep==="baby"){
    if(/\b(women|woman|female|ladies|lady)\b/.test(t) &&
       !/\b(baby|newborn|infant|toddler|child|children|kid|kids)\b/.test(t)){
      return REVIEW("ADULT_PRODUCT_IN_LEGACY_BABY");
    }
    if(/\b(baby|newborn|infant|toddler|child|children|kid|kids)\b/.test(t)){
      const safeShelf=
        /^(baby-bedding|baby-sets|baby-sleepsuits|baby-clothing|baby|nursery|tableware|tech)$/.test(shelf)
          ? shelf
          : (shelf==="newborn"||shelf==="kids"?"baby":null);
      if(safeShelf)return REMAP("kids",safeShelf,"BABY_DEPARTMENT_CANONICALIZED_TO_KIDS");
    }
    return REVIEW("LEGACY_BABY_IDENTITY_UNRESOLVED");
  }

  if(dep!== "lifestyle" && dep!=="") return null;

  // Automotive has no canonical HUNT department in the current 17-department contract.
  if(/\b(car|automobile|vehicle|motorcycle|truck|suv)\b/.test(t) &&
     !/\b(carrier bag|carrying case|pet carrier|car seat cover for pet)\b/.test(t)){
    return REVIEW("AUTOMOTIVE_NO_CANONICAL_DEPARTMENT");
  }

  // Prevent theme words from turning human products into pet products.
  if(shelf==="pets" &&
     /\b(men|women|unisex|couple|human)\b/.test(t) &&
     /\b(shirt|t-shirt|tee|shorts|tank top|sandals|slippers|shoes|hoodie|sweater|clothing|top)\b/.test(t)){
    return REVIEW("HUMAN_APPAREL_FALSE_PET");
  }
  if(shelf==="pets" && /\b(wall sticker|wall decor|car decor|car ornament|air freshener|rearview)\b/.test(t)){
    return REVIEW("ANIMAL_THEME_NOT_PET_PRODUCT");
  }

  // Storage/furniture wins over misleading product-theme words.
  if(/\b(shoe cabinet|shoe rack|shoe storage|shoe box|shoe organizer|storage bench)\b/.test(t)){
    return REMAP("home","storage","SHOE_STORAGE_NOT_FOOTWEAR");
  }
  if(/\b(cosmetic organizer|makeup organizer|brush holder|cosmetic storage|makeup storage)\b/.test(t)){
    return REMAP("home","storage","COSMETIC_STORAGE_NOT_MAKEUP");
  }

  // Pet product identity.
  if(/\b(dog|cat|pet|puppy|kitten)\b/.test(t)){
    if(/\b(lint roller|hair remover|deshedding|groom|grooming|brush|comb|nail clipper)\b/.test(t))
      return REMAP("pets","pet-grooming","PET_GROOMING_TOOL");
    if(/\b(gps|tracker|locator)\b/.test(t))
      return REMAP("pets","pet-accessories","PET_TRACKER");
    if(/\b(bed|cushion|mat)\b/.test(t) && !/\b(vacuum|robot|cleaner)\b/.test(t))
      return REMAP("pets","pet-beds","PET_BED");
    if(/\b(house|cave|kennel|condo)\b/.test(t))
      return REMAP("pets","pet-houses","PET_HOUSE");
    if(/\b(coat|shirt|dress|hoodie|sweater|clothing|clothes)\b/.test(t))
      return REMAP("pets","pet-clothing","PET_CLOTHING");
    if(/\b(toy|ball|chew|teaser|scratch)\b/.test(t))
      return REMAP("pets","pet-toys","PET_TOY");
    if(/\b(bowl|feeder|feeding|water fountain)\b/.test(t))
      return REMAP("pets","pet-feeding","PET_FEEDING");
    if(/\b(leash|collar|harness|traction|walking)\b/.test(t))
      return REMAP("pets","pet-walk","PET_WALK");
    if(shelf==="pets" && !/\b(vacuum|robot|cleaner|sweeper|appliance|carpet|floor)\b/.test(t))
      return REMAP("pets","pet-accessories","PET_ACCESSORY");
  }

  // Tech.
  if(/\b(phone|iphone|galaxy|smartphone|mobile)\b.{0,35}\b(case|cover)\b|\b(case|cover)\b.{0,35}\b(phone|iphone|galaxy|smartphone|mobile)\b/.test(t))
    return REMAP("tech","phone-cases","PHONE_CASE");
  if(/\b(phone|tablet|mobile|iphone)\b.{0,30}\b(stand|holder|bracket|grip)\b|\b(stand|holder|bracket|grip)\b.{0,30}\b(phone|tablet|mobile|iphone)\b/.test(t))
    return REMAP("tech","stands-holders","PHONE_STAND_HOLDER");
  if(/\b(power bank|portable charger)\b/.test(t)) return REMAP("tech","power-banks","POWER_BANK");
  if(/\b(smartwatch|smart watch|bluetooth watch|ecg watch|gps watch)\b/.test(t) &&
     !/\b(band|strap|charger|case|protector|screen protector)\b/.test(t))
    return REMAP("tech","wearables","WEARABLE_DEVICE");
  if(/\b(watch|smartwatch|smart watch)\b.{0,35}\b(band|strap|charger|case|protector|screen protector)\b|\b(band|strap|charger|case|protector|screen protector)\b.{0,35}\b(watch|smartwatch|smart watch)\b/.test(t))
    return REMAP("tech","wearable-accessories","WEARABLE_ACCESSORY");
  if(/\b(gaming mouse|gaming keyboard|gamepad|game controller|mouse pad|gaming headset)\b/.test(t))
    return REMAP("tech","gaming","GAMING");
  if(/\b(headphone|earbud|earbuds|speaker|microphone|audio)\b/.test(t))
    return REMAP("tech","audio","AUDIO");
  if(/\b(camera|webcam|dash cam)\b/.test(t) && !/\bcamera bag\b/.test(t))
    return REMAP("tech","cameras","CAMERA");
  if(shelf==="tech"||shelf==="tech-accessories"||shelf==="phone-accessories"){
    if(/\b(usb|type-c|type c|lightning|charger|charging|cable|adapter)\b/.test(t)){
      if(/\b(fridge|refrigerator|freezer|cooler)\b/.test(t)) return REMAP("electrical","home-appliances","SMALL_APPLIANCE");
      return REMAP("tech","chargers-cables","CHARGER_CABLE");
    }
  }

  // Office.
  if(shelf==="office" && /\b(notebook|binder|stationer|pen|pencil|marker|paper|envelope|folder|clipboard|stapler|sticky note)\b/.test(t))
    return REMAP("office","stationery","OFFICE_STATIONERY");
  if(shelf==="office" && /\b(office|desk)\b.{0,30}\b(chair|table|cabinet|shelf|drawer)\b|\boffice furniture\b/.test(t))
    return REMAP("office","office-furniture","OFFICE_FURNITURE");

  // Beauty.
  if(shelf==="beauty"){
    if(/\b(cosmetic bag|toiletry bag|wash bag|makeup bag)\b/.test(t)) return REMAP("accessories","bags","COSMETIC_BAG");
    if(/\b(nail|manicure|pedicure)\b/.test(t)) return REMAP("beauty","nails","BEAUTY_NAILS");
    if(/\b(skin|skincare|blackhead|sunscreen|facial|face cream|serum|pore|acne)\b/.test(t)) return REMAP("beauty","skincare","BEAUTY_SKINCARE");
    if(/\b(makeup|cosmetic|lipstick|mascara|eyelash|eyebrow|foundation|concealer)\b/.test(t)) return REMAP("beauty","makeup","BEAUTY_MAKEUP");
    if(/\b(wig|hair extension|hair bundle|hair care|hair mask|hair oil)\b/.test(t)) return REMAP("beauty","hair","BEAUTY_HAIR");
    if(/\b(perfume|fragrance|eau de|cologne)\b/.test(t)) return REMAP("beauty","fragrance","BEAUTY_FRAGRANCE");
    if(/\b(makeup brush|beauty sponge|facial brush|cosmetic brush|beauty tool)\b/.test(t)) return REMAP("beauty","beauty-tools","BEAUTY_TOOLS");
    if(/\b(body lotion|body cream|body butter|body care)\b/.test(t)) return REMAP("beauty","body-care","BEAUTY_BODY");
  }

  // Home.
  if(shelf==="cushions-throws" && /\b(cushion|throw pillow|pillow cover)\b/.test(t) && !/\bshoe cabinet|storage bench\b/.test(t))
    return REMAP("home","cushions-throws","HOME_CUSHION");
  if(shelf==="bath"){
    if(/\b(slipper|slippers|flip-flop|flip flop)\b/.test(t)) return REVIEW("FOOTWEAR_NOT_BATH");
    if(/\b(bathroom|bath|shower|toilet)\b/.test(t)) return REMAP("home","bath","HOME_BATH");
  }
  if(shelf==="mirrors"){
    if(/\b(sunglass|sunglasses|shades)\b/.test(t)) return REMAP("accessories","sunglasses","SUNGLASSES");
    if(/\b(mirror|wall mirror|vanity mirror)\b/.test(t) && !/\b(bike|bicycle|car|motorcycle)\b/.test(t))
      return REMAP("home","mirrors","HOME_MIRROR");
  }
  if(shelf==="towels" && /\b(towel|bath towel|hand towel)\b/.test(t) && !/\b(napkin ring|shirt|t-shirt|top|clothing)\b/.test(t))
    return REMAP("home","towels","HOME_TOWEL");
  if(shelf==="rugs-runners" && /\b(rug|carpet|doormat|runner)\b/.test(t)) return REMAP("home","rugs-runners","HOME_RUG");
  if(shelf==="curtains-blinds"){
    if(/\b(blind spot|rear view|rearview|vehicle|car|motorcycle)\b/.test(t)) return REVIEW("AUTO_MIRROR_NOT_CURTAIN");
    if(/\b(curtain|blind|window shade)\b/.test(t) && !/\bgazebo\b/.test(t)) return REMAP("home","curtains-blinds","HOME_CURTAIN");
  }
  if(shelf==="tableware" && /\b(plate|bowl|cup|tableware|dinnerware|cutlery)\b/.test(t) && !/\b(pet|dog|cat)\b/.test(t))
    return REMAP("home","tableware","HOME_TABLEWARE");

  // Travel / Garden / Gifts.
  if(shelf==="travel" && /\b(luggage|suitcase|travel bag|packing cube|carry-on|carry on)\b/.test(t))
    return REMAP("travel","luggage","TRAVEL_LUGGAGE");
  if(shelf==="garden"){
    if(/\b(planter|plant pot|flower pot|grow bag)\b/.test(t)) return REMAP("garden","planters","GARDEN_PLANTER");
    if(/\b(watering|garden hose|sprinkler|drip irrigation)\b/.test(t)) return REMAP("garden","watering","GARDEN_WATERING");
    if(/\b(pruner|garden tool|gardening tool|garden shovel|garden rake)\b/.test(t)) return REMAP("garden","garden-tools","GARDEN_TOOL");
    if(/\b(patio|gazebo|outdoor furniture|garden furniture)\b/.test(t)) return REMAP("garden","outdoor-living","GARDEN_OUTDOOR_LIVING");
  }
  if(shelf==="gifts" && /\b(gift|souvenir|keepsake|present)\b/.test(t)) return REMAP("gifts","gift-decor","GIFT_DECOR");
  if(shelf==="party" && /\b(party|balloon|decoration|banner|confetti|gift wrap|wrapping)\b/.test(t)) return REMAP("gifts","party","PARTY");

  // Fashion accessories.
  if(shelf==="bags" && /\b(handbag|purse|tote|crossbody|shoulder bag|fashion bag)\b/.test(t) &&
     !/\b(pet|dog|cat|tool bag|storage bag|diaper|luggage|travel bag)\b/.test(t))
    return REMAP("accessories","bags","FASHION_BAG");
  if(shelf==="jewelry"){
    if(/\b(nintendo|switch|mobile phone|cellphone|iphone)\b.{0,50}\b(ring|holder|bracket|stand)\b|\b(ring|holder|bracket|stand)\b.{0,50}\b(nintendo|switch|mobile phone|cellphone|iphone)\b/.test(t))
      return REMAP("tech","stands-holders","TECH_HOLDER_NOT_JEWELRY");
    if(/\b(necklace|pendant|choker)\b/.test(t) && !/\b(box|storage|display|packaging|holder)\b/.test(t)) return REMAP("accessories","jewelry-necklaces","JEWELRY_NECKLACE");
    if(/\b(earring|earrings)\b/.test(t) && !/\b(box|storage|display|packaging|holder)\b/.test(t)) return REMAP("accessories","jewelry-earrings","JEWELRY_EARRING");
    if(/\b(bracelet|bangle)\b/.test(t) && !/\b(box|storage|display|packaging|holder)\b/.test(t)) return REMAP("accessories","jewelry-bracelets","JEWELRY_BRACELET");
    if(/\b(ring|rings|anklet|anklets|brooch|brooches)\b/.test(t) && !/\b(box|storage|display|packaging|holder|tool|decor|ring light)\b/.test(t)) return REMAP("accessories","jewelry","JEWELRY_GENERIC");
  }
  if(shelf==="hats" && /\b(hat|cap|beanie|beret)\b/.test(t) && !/\b(tool chest|seat|lamp|light)\b/.test(t))
    return REMAP("accessories","hats","HAT");

  // Footwear: require product words, reject storage.
  if(shelf==="shoes" && !/\b(shoe cabinet|shoe rack|shoe storage|shoe box|shoe organizer)\b/.test(t)){
    const footwear=/\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|slipper|slippers)\b/;
    if(footwear.test(t)){
      if(/\b(women|woman|ladies|female)\b/.test(t) && !/\b(men|mens|men's|male)\b/.test(t)) return REMAP("women","women-shoes","WOMEN_FOOTWEAR");
      if(/\b(men|mens|men's|male)\b/.test(t) && !/\b(women|woman|ladies|female)\b/.test(t)) return REMAP("men","men-shoes","MEN_FOOTWEAR");
      if(/\b(baby|kid|kids|child|children|girl|boy)\b/.test(t)) return REMAP("kids","kids-shoes","KIDS_FOOTWEAR");
      if(/\b(unisex|men and women|men's and women's)\b/.test(t)) return REVIEW("UNISEX_FOOTWEAR_NEEDS_CANONICAL_AUDIENCE");
    }
  }

  // Clothing from legacy generic shelves. Unisex remains review instead of forced gendering.
  if(["jackets","hoodies","knitwear"].includes(shelf)){
    if(/\b(unisex|men and women|men's and women's|couple)\b/.test(t)) return REVIEW("UNISEX_APPAREL_NEEDS_CANONICAL_AUDIENCE");
    const map={
      jackets:["women-outerwear","men-outerwear"],
      hoodies:["women-hoodies","men-hoodies"],
      knitwear:["women-knitwear","men-knitwear"]
    };
    if(/\b(women|woman|ladies|female)\b/.test(t) && !/\b(men|mens|men's|male)\b/.test(t)) return REMAP("women",map[shelf][0],"WOMEN_APPAREL");
    if(/\b(men|mens|men's|male)\b/.test(t) && !/\b(women|woman|ladies|female)\b/.test(t)) return REMAP("men",map[shelf][1],"MEN_APPAREL");
  }

  // Sports vs camping. Apparel isn't an accessory.
  if(shelf==="sports-outdoor"){
    if(/\b(power inverter|car inverter|battery charger)\b/.test(t)) return REVIEW("POWER_EQUIPMENT_REVIEW");
    if(/\b(camping|tent|sleeping bag|camp stove|camp lantern|camping chair|camping toilet)\b/.test(t)) return REMAP("camping","outdoors","CAMPING_OUTDOOR");
    if(/\b(women|men|unisex)\b/.test(t) && /\b(shirt|t-shirt|top|tracksuit|sportswear|clothing|suit|set)\b/.test(t)) return REMAP("sports","activewear","ACTIVEWEAR");
    if(/\b(yoga|fitness|gym|workout|exercise|training band|resistance band|sports brace|compression sleeve|wrist guard|racket)\b/.test(t)) return REMAP("sports","fitness-accessories","FITNESS_ACCESSORY");
    if(/\b(sports leggings|yoga pants|gym pants|activewear bottoms|running shorts)\b/.test(t)) return REMAP("sports","active-bottoms","ACTIVE_BOTTOMS");
  }

  return null;
}

module.exports={legacyRoute};
