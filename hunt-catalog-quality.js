(() => {
  const text=item=>String(item?.title||"").toLowerCase().replace(/[\u2010-\u2015]/g,"-");
  const has=(re,s)=>re.test(s);
  const genericBad=/\b(shipment from walmart|wholesale lot|supplier sample|test product)\b/i;

  const rules={
    pillows:{
      allow:/\b(pillow|cushion|pillowcase|throw pillow|neck pillow|body pillow)\b/i,
      deny:/\b(wheelchair|commode|deck box|storage box|sofa bed|rocking chair set|conversation furniture|desk chair|office chair|bench(?! cushion)|toilet|stool)\b/i
    },
    beauty:{
      allow:/\b(beauty|makeup|cosmetic|skincare|skin care|serum|cleanser|toner|moisturi[sz]er|cream|lotion|lipstick|mascara|eyeliner|eyeshadow|foundation|concealer|blush|nail|manicure|pedicure|hair (?:dryer|curler|straightener|brush|comb)|facial|face mask|beauty tool|makeup brush|cosmetic brush)\b/i,
      deny:/\b(vanity desk|hallway furniture|wardrobe|shoe cabinet|coat rack|storage cabinet|dresser|table with mirror|furniture set)\b/i
    },
    makeup:{
      allow:/\b(makeup|cosmetic|lipstick|lip gloss|lip tint|mascara|eyeliner|eyeshadow|foundation|concealer|blush|powder|makeup brush|cosmetic brush|eyebrow|brow|eyelash|eyelashes|lashes|lash|false eyelashes|hairline powder)\b/i,
      deny:/\b(vanity desk|cabinet|wardrobe|hall tree|furniture|storage shelf)\b/i
    },
    skincare:{
      allow:/\b(skincare|skin care|serum|cleanser|toner|moisturi[sz]er|face cream|facial cream|eye cream|face mask|mask|acne|essence|lotion|retinol|collagen|peptide|ampoule|hydrating|hydration|tanning serum|microcurrent|ems|facial roller|face roller)\b/i,
      deny:/\b(vanity desk|cabinet|wardrobe|furniture|storage shelf)\b/i
    },
    tech:{
      allow:/\b(phone|iphone|samsung|android|tablet|ipad|charger|charging|usb|type-c|lightning|power bank|battery|earbud|earphone|headphone|bluetooth|speaker|smart watch|smartwatch|camera|electronic|electronics|keyboard|mouse|gaming|controller|magsafe|cable|adapter|hub|ssd|memory card|webcam|projector|led strip|smart home|sensor)\b/i,
      deny:/\b(dressing table|vanity|desk\/chair|rustic desk|jewelry|earring|necklace|dress|pillow|cushion)\b/i
    },
    "home-storage":{
      allow:/\b(storage|organizer|organisation|organization|closet|rack|shelf|shelves|bookshelf|cabinet|drawer|box|basket|container|holder|shoe storage|wardrobe organizer|folding storage)\b/i,
      deny:/\b(hair|comb|brush|air conditioner|air cooler|massager|cushion|gym|fan|diffuser|humidifier|strengthener|trainer)\b/i
    },
    drinkware:{
      allow:/\b(mug|mugs|cup|cups|bottle|bottles|tumbler|tumblers|flask|thermos|water bladder|vacuum cup|coffee cup|water cup|water glass)\b/i,
      deny:/\b(phone holder only|furniture|chair|bag organizer)\b/i
    },
    "beauty-tools":{
      allow:/\b(makeup brush|brush cleaner|cosmetic bag|toiletry bag|makeup storage|cosmetic storage|hair mask|hair treatment|facial roller|face roller|microcurrent|dermaplan|eyelash curler|nail lamp|manicure tool|pedicure tool|beauty tool|skin scrubber|blackhead|pore cleaner)\b/i,
      deny:/\b(blood pressure|sphygmomanometer|fan|diffuser|kneecap|knee|scarf|hat|massager for shoulders)\b/i
    },
    hair:{
      allow:/\b(hair|wig|wigs|extension|extensions|straightener|curler|curling|hair dryer|hot air comb|lace wig|hairpiece)\b/i,
      deny:/\b(hat integrated scarf|household fan|blood pressure)\b/i
    },
    "computer-accessories":{
      allow:/\b(laptop|computer|usb|ssd|hard disk|hard drive|keycap|keyboard|mouse|dock|docking|tablet|screen protector|laptop stand|computer stand|u disk|flash drive|digital accessories|computer bag|laptop bag)\b/i,
      deny:/\b(dress|jewelry|pillow|chair|vanity)\b/i
    },
    "small-appliances":{
      allow:/\b(juicer|blender|grinder|mixer|chopper|food processor|sealer|coffee maker|kettle|air fryer|milk maker|soybean milk|electric pepper|garlic press|vacuum food saver|meat grinder)\b/i,
      deny:/\b(phone|jewelry|clothing|chair|pillow)\b/i
    },
    "smart-home":{
      allow:/\b(smart lock|doorbell|intercom|surveillance camera|security camera|smart plug|smart switch|wifi|wi-fi|zigbee|sensor|thermostat|robot vacuum|automatic vacuum|smart home|home automation)\b/i,
      deny:/\b(handheld fan|garment steamer|hand massage|foot grinder|telephoto lens|aroma diffuser|desktop fan|clock only)\b/i
    },
    "phone-cases":{
      allow:/\b(case|cover)\b.*\b(phone|iphone|samsung|pixel|xiaomi|huawei|oppo|vivo|magsafe)\b|\b(phone|iphone|samsung|pixel|xiaomi|huawei|oppo|vivo|magsafe)\b.*\b(case|cover)\b/i,
      deny:/\b(charger|cable|earbud|speaker|holder only)\b/i
    },
    "chargers-cables":{
      allow:/\b(charger|charging|cable|usb|type-c|lightning|adapter|power adapter)\b/i,
      deny:/\b(case only|cover only)\b/i
    },
    "power-banks":{
      allow:/\b(power bank|portable charger|battery pack)\b/i
    },
    audio:{
      allow:/\b(earbud|earbuds|earphone|earphones|headphone|headphones|speaker|audio|bluetooth headset)\b/i
    },
    home:{
      allow:/\b(home|decor|storage|organizer|kitchen|lamp|lighting|bedding|blanket|pillow|cushion|bath|towel|rug|mat|curtain|cookware|utensil|cleaning|laundry|shelf|rack|wall art|vase|mirror|tableware|drinkware)\b/i,
      deny:/\b(phone case|iphone case|earring|necklace|bracelet|women dress|men shirt|wig extension)\b/i
    }
  };

  const slugRule=slug=>{
    if(rules[slug])return rules[slug];
    if(/^beauty$/.test(slug))return rules.beauty;
    if(/^(makeup|skincare|body-care|nails|hair|beauty-tools)$/.test(slug))return rules[slug]||rules.beauty;
    if(/^(tech|electronics|usefultech|phone-cases|phonecases|phoneaccessories|phone-accessories|chargers|chargers-cables|powerbanks|power-banks|audio|earbuds|wearables|smart-home|cameras|computer-accessories|gaming|stands-holders)$/.test(slug))return rules[slug]||rules.tech;
    if(/^(home|home-storage|storage|kitchen|lighting|bedding|bath|home-decor|drinkware|cleaning|small-appliances|pillows|blankets)$/.test(slug))return rules[slug]||rules.home;
    return null;
  };

  function apparelFit(slug,s){
    if(slug==="women-dresses"||slug==="dresses")return has(/\b(dress|gown)\b/i,s)&&!has(/\b(boy|boys|kid|kids|child|children|baby|toddler|men|male)\b/i,s);
    if(slug==="women-tops")return has(/\b(top|tops|shirt|shirts|t-shirt|t-shirts|tee|tees|blouse|blouses|tank|tanks|camisole|vest)\b/i,s)&&!has(/\b(men|male|boy|boys|kid|kids|baby|toddler)\b/i,s);
    if(slug==="women-shoes")return has(/\b(shoe|shoes|heel|heels|sandal|sandals|sneaker|sneakers|loafer|loafers|boot|boots|slipper|slippers|flats)\b/i,s)&&!has(/\b(men|male|boy|boys|kid|kids|baby|toddler)\b/i,s);
    if(slug==="men-tops")return has(/\b(shirt|shirts|t-shirt|t-shirts|tee|tees|polo|polos|top|tops)\b/i,s)&&!has(/\b(women|woman|female|ladies|girl|girls)\b/i,s);
    if(slug==="men-shoes")return has(/\b(shoe|shoes|sneaker|sneakers|loafer|loafers|boot|boots|slipper|slippers|sandal|sandals|creek shoes)\b/i,s)&&!has(/\b(women|woman|female|ladies|girl|girls)\b/i,s);
    return null;
  }

  function fit(slug,item){
    if(!item?.item_id||!String(item?.title||"").trim())return false;
    const s=text(item);
    if(genericBad.test(s))return false;
    const apparel=apparelFit(String(slug||""),s);
    if(apparel!==null)return apparel;
    const rule=slugRule(String(slug||""));
    if(!rule)return true;
    if(rule.deny?.test(s))return false;
    if(rule.allow&&!rule.allow.test(s))return false;
    return true;
  }

  function cleanShelves(shelves){
    const out={},report={before:0,after:0,rejected:0,by_shelf:{}};
    for(const [slug,rows] of Object.entries(shelves||{})){
      const list=Array.isArray(rows)?rows:[];
      report.before+=list.length;
      const kept=[],rejected=[];
      for(const item of list)(fit(slug,item)?kept:rejected).push(item);
      out[slug]=kept;
      report.after+=kept.length;
      report.rejected+=rejected.length;
      if(rejected.length)report.by_shelf[slug]={before:list.length,after:kept.length,rejected:rejected.length};
    }
    return {shelves:out,report};
  }

  window.HuntCatalogQuality=Object.freeze({fit,cleanShelves});
})();