(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.BoomProductPlacementOverlapGate=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  const norm=v=>String(v??"").replace(/\s+/g," ").trim();
  const has=(t,re)=>re.test(t);
  const R=(state,target,reason,confidence)=>({state,target_rail:target||null,reason,confidence,production_effect:false});

  function evaluate(product={}){
    const rail=norm(product.current_rail||[product.current_department,product.current_category].filter(Boolean).join("/"));
    const t=norm(product.title).toLowerCase();
    const cid=Number(product.supplier_category_id)||null;

    if(rail==="gifts/gift-decor"){
      if(has(t,/\b(self[- ]?defense|weapon|window breaker)\b/i))return R("HOLD_OUT_OF_SCOPE",null,"RISK_OR_SCOPE_REVIEW",1);
      const exact={33:"accessories/jewelry-rings",47:"accessories/jewelry-necklaces",48:"accessories/jewelry-earrings",49:"accessories/watches",50:"accessories/jewelry-bracelets",51:"accessories/jewelry",140:"home/home-decor",145:"gifts/party"};
      if(exact[cid])return R("SAFE_MOVE_CANDIDATE",exact[cid],"SUPPLIER_FAMILY_EXACT",.99);
      if(cid===131||has(t,/\b(beads?|jewelry making|diy jewelry|craft beads?)\b/i))return R("REVIEW","office/crafts","DIY_JEWELRY_CRAFT_OVERLAP",.85);
      if(has(t,/\b(sticker|decal)\b/i))return R("SAFE_MOVE_CANDIDATE","office/stickers","EXPLICIT_STICKER",.98);
      if(has(t,/\b(ring|necklace|earrings?|bracelet|bangle|pendant|watch)\b/i))return R("REVIEW",null,"JEWELRY_SUBTYPE_NEEDS_EXACT_RAIL",.90);
      if(has(t,/\b(gift box|gift bag|gift wrap|gift decoration|gift decor|keepsake|souvenir|ornament|plaque|figurine|decorative sculpture)\b/i))return R("KEEP",rail,"EXPLICIT_GIFT_DECOR",.92);
      return R("UNKNOWN",null,"GIFT_DECOR_UNRESOLVED",0);
    }

    if(rail==="kitchen/drinkware"){
      if(has(t,/\b(cup|mug|tumbler|water bottle|vacuum bottle|thermos|flask|goblet|wine glass|champagne glass|cocktail glass|drinking glass|coffee glass|tea glass|juice glass)\b/i)){
        if(has(t,/\b(bowl|plate|dish|soup bowl)\b/i)&&!has(t,/\bcup\b/i))return R("SAFE_MOVE_CANDIDATE","kitchen/tableware","EXPLICIT_TABLEWARE",.98);
        return R("KEEP",rail,"EXPLICIT_DRINKWARE",.98);
      }
      if(has(t,/\b(bowl|plate|dinnerware|cutlery|flatware|spoon|fork)\b/i))return R("SAFE_MOVE_CANDIDATE","kitchen/tableware","EXPLICIT_TABLEWARE",.98);
      if(has(t,/\b(frying pan|saucepan|cooking pot|stock pot|wok|casserole|roasting pan)\b/i))return R("SAFE_MOVE_CANDIDATE","kitchen/cookware","EXPLICIT_COOKWARE",.98);
      if(has(t,/\b(food storage|lunch box|bento box|airtight container|food container)\b/i))return R("SAFE_MOVE_CANDIDATE","kitchen/food-storage","EXPLICIT_FOOD_STORAGE",.98);
      return R("UNKNOWN",null,"DRINKWARE_UNRESOLVED",0);
    }

    if(rail==="electrical/electrical-lighting"){
      if(cid===38||has(t,/\b(power bank|portable power bank|magnetic power bank)\b/i))return R("SAFE_MOVE_CANDIDATE","tech/power-banks","POWER_BANK_PRODUCT",.99);
      if(has(t,/\b(wireless charger|charging stand|charging station)\b/i)&&has(t,/\b(light|lamp|clock|stand)\b/i))return R("REVIEW",null,"MULTIFUNCTION_CHARGER_LIGHT",.96);
      if(has(t,/\b(charging cable|usb cable|type[- ]?c cable|lightning cable|data cable)\b/i))return R("SAFE_MOVE_CANDIDATE","tech/chargers-cables","EXPLICIT_CHARGING_CABLE",.99);
      if(has(t,/\b(selfie light|phone light|live streaming light|photography light|camera light|ring light)\b/i))return R("REVIEW","tech/cameras","PHOTO_LIGHT_OVERLAP",.94);
      if(has(t,/\b(garden|landscape|lawn|pathway|courtyard)\b/i)&&has(t,/\b(light|lamp|lantern)\b/i))return R("SAFE_MOVE_CANDIDATE","garden/garden-lighting","EXPLICIT_GARDEN_LIGHTING",.98);
      if(has(t,/\b(camping|tent|hiking)\b/i)&&has(t,/\b(light|lamp|lantern)\b/i))return R("REVIEW","camping/outdoors","CAMPING_LIGHTING_TAXONOMY_GAP",.90);
      if(cid===76||has(t,/\b(car|vehicle|automotive|headlight|fog light)\b/i))return R("REVIEW",null,"AUTOMOTIVE_LIGHTING_TAXONOMY_GAP",.98);
      if(cid===109&&has(t,/\b(light|lamp|bulb|chandelier|sconce|downlight|spotlight|led)\b/i))return R("KEEP",rail,"SUPPLIER_LIGHTING_FAMILY",.97);
      if(has(t,/\b(led bulb|light bulb|ceiling light|ceiling lamp|chandelier|pendant light|wall sconce|downlight|spotlight|light string|string light|christmas light|night light|lamp)\b/i))return R("KEEP",rail,"EXPLICIT_LIGHTING",.96);
      return R("UNKNOWN",null,"ELECTRICAL_LIGHTING_UNRESOLVED",0);
    }

    if(rail==="beauty/beauty-tools"){
      if(has(t,/\b(teeth|dental|dentures|tooth whitening|oral)\b/i))return R("REVIEW",null,"ORAL_CARE_TAXONOMY_GAP",.99);
      if(cid===86||has(t,/\b(hair|scalp|beard).{0,30}\b(serum|oil|mask|care|growth|conditioner|dye|shampoo)\b|\b(shampoo|conditioner|hair oil|hair serum|hair mask|hair growth|scalp care)\b/i))return R("SAFE_MOVE_CANDIDATE","beauty/hair","HAIR_CARE_PRODUCT",.99);
      if(has(t,/\b(body soap|body lotion|body cream|body oil|body scrub|after shave lotion|aftershave lotion|body care)\b/i))return R("SAFE_MOVE_CANDIDATE","beauty/body-care","BODY_CARE_PRODUCT",.98);
      if(cid===87||has(t,/\b(lipstick|lip gloss|mascara|eyeliner|eyeshadow|eyebrow (pen|liner)|brow pen|foundation|concealer|blush|makeup palette)\b/i))return R("SAFE_MOVE_CANDIDATE","beauty/makeup","MAKEUP_PRODUCT",.99);
      if(cid===88||has(t,/\b(face serum|facial serum|moisturizer|face cream|facial cream|cleanser|toner|sunscreen|eye cream|face mask|acne patch|skin care|skincare)\b/i))return R("SAFE_MOVE_CANDIDATE","beauty/skincare","SKINCARE_PRODUCT",.98);
      if(has(t,/\b(nail polish|gel polish|nail glue|press[- ]?on nails?|false nails?|nail tips|manicure|nail art)\b/i))return R("SAFE_MOVE_CANDIDATE","beauty/nails","NAIL_PRODUCT",.98);
      if(cid===89||has(t,/\b(perfume|cologne|eau de parfum|eau de toilette|fragrance)\b/i))return R("SAFE_MOVE_CANDIDATE","beauty/fragrance","FRAGRANCE_PRODUCT",.99);
      if([91,93].includes(cid)||has(t,/\b(hair removal device|epilator|trimmer|clipper|makeup brush|beauty sponge|eyelash curler|facial roller|gua sha|blackhead remover|pore cleaner|cleansing device)\b/i))return R("KEEP",rail,"BEAUTY_TOOL_OR_DEVICE",.97);
      return R("UNKNOWN",null,"BEAUTY_TOOLS_UNRESOLVED",0);
    }

    if(rail==="sports/fitness"){
      if(cid===70)return R("SAFE_MOVE_CANDIDATE","sports/sports-bags","SUPPLIER_SPORT_BAGS",.99);
      if(cid===67)return R("SAFE_MOVE_CANDIDATE","sports/cycling","SUPPLIER_CYCLING",.99);
      if(has(t,/\b(yoga pants|gym shorts|sports shorts|running pants|training pants|workout leggings|fitness pants)\b/i))return R("SAFE_MOVE_CANDIDATE","sports/active-bottoms","SPORTS_BOTTOMS",.98);
      if(has(t,/\b(grip trainer|grip strengthener|hand grip|dumbbell|barbell|ab roller|resistance band|exercise band|fitness equipment|gym equipment|strength trainer)\b/i))return R("KEEP",rail,"FITNESS_EQUIPMENT",.98);
      if(cid===66)return R("REVIEW",null,"SPORTS_CLOTHING_TAXONOMY_GAP",.95);
      if(has(t,/\b(bike helmet|bicycle helmet|cycling helmet|bicycle pump|bike pump|bike saddle|bicycle saddle|cycling jersey|bike repair kit)\b/i))return R("SAFE_MOVE_CANDIDATE","sports/cycling","EXPLICIT_CYCLING_PRODUCT",.98);
      if(cid===73||has(t,/\b(wrist wallet|ankle support|knee support|wrist support|brace|fitness strap|fitness belt|fitness accessory)\b/i))return R("REVIEW","sports/fitness-accessories","SPORT_ACCESSORY_REVIEW",.94);
      if(cid===69)return R("KEEP",rail,"SUPPLIER_FITNESS_FAMILY",.97);
      return R("UNKNOWN",null,"SPORTS_FITNESS_UNRESOLVED",0);
    }

    if(rail==="pets/pet-accessories"){
      if(cid===1214||has(t,/\b(pet clothes|dog clothes|cat clothes|pet clothing|dog sweater|cat sweater|pet costume|dog costume|pet pajamas|dog pajamas)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-clothing","PET_CLOTHING",.99);
      if(has(t,/\b(pet bed|dog bed|cat bed|pet mat|dog mat|cat mat)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-beds","PET_BED",.98);
      if(has(t,/\b(pet house|dog house|cat house|cat cave|pet cave|cat condo)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-houses","PET_HOUSE",.98);
      if(has(t,/\b(pet toy|dog toy|cat toy|chew toy|cat teaser|cat wand)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-toys","PET_TOY",.98);
      if(has(t,/\b(grooming|pet brush|dog brush|cat brush|deshedding|pet clipper|pet nail clipper)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-grooming","PET_GROOMING",.98);
      if(has(t,/\b(pet bowl|dog bowl|cat bowl|pet feeder|dog feeder|cat feeder|water feeder|food feeder)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-feeding","PET_FEEDING",.97);
      if(has(t,/\b(leash|collar|harness|poop bag|waste bag|dog walking|pet walking)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/pet-walk","PET_WALK",.97);
      if(has(t,/\b(aquarium|fish tank|fish feeder|aquatic)\b/i))return R("SAFE_MOVE_CANDIDATE","pets/aquarium","AQUARIUM",.98);
      if(cid===128)return R("KEEP",rail,"BROAD_PET_PRODUCT_NO_SUBTYPE_CONFLICT",.80);
      return R("UNKNOWN",null,"PET_ACCESSORY_UNRESOLVED",0);
    }
    return R("UNKNOWN",null,"OUTSIDE_STAGE6",0);
  }

  function audit(products=[]){
    const rows=products.map(p=>({...p,overlap:evaluate(p)}));
    const summary={total:rows.length,KEEP:0,SAFE_MOVE_CANDIDATE:0,REVIEW:0,UNKNOWN:0,HOLD_OUT_OF_SCOPE:0};
    for(const r of rows)summary[r.overlap.state]=(summary[r.overlap.state]||0)+1;
    return {version:"HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-V1",summary,rows};
  }
  return {version:"HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-V1",evaluate,audit};
});
