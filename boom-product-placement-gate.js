(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.BoomProductPlacementGate=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  const clean=v=>String(v??"").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
  const rx=(pattern,flags="i")=>new RegExp(pattern,flags);
  const evidence=(code,match)=>({code,match:clean(match||"")});
  const RULES=[
    {type:"phone_case",priority:100,dest:["tech","phone-cases"],re:rx("\\b(phone case|iphone case|galaxy case|mobile phone case|smartphone case|protective case for (iphone|samsung|galaxy)|case for iphone)\\b")},
    {type:"smart_ring",priority:99,dest:["tech","wearables"],re:rx("\\b(smart ring|fitness ring|health ring)\\b")},
    {type:"smart_wearable",priority:99,dest:["tech","wearables"],re:rx("\\b(smart ?watch|smart bracelet|fitness tracker|heart rate.{0,25}bracelet|blood oxygen.{0,25}bracelet)\\b")},
    {type:"wearable_accessory",priority:98,dest:["tech","wearable-accessories"],re:rx("\\b(watch strap|watch band|smartwatch band|smart watch band|iwatch band)\\b")},
    {type:"camera",priority:97,dest:["tech","cameras"],re:rx("\\b(camera|webcam|dash cam|security cam|ccd camera)\\b"),exclude:rx("\\b(camera frame|webcam cover|camera cover|privacy sticker|fill light|camera light|camera mount|camera base|card reader)\\b")},
    {type:"charger_cable",priority:96,dest:["tech","chargers-cables"],re:rx("\\b(charger|charging cable|data cable|usb cable|type[- ]?c cable|lightning cable)\\b"),exclude:rx("\\b(storage case|storage bag|pouch|organizer|power bank|powerbank|battery pack)\\b")},
    {type:"power_bank",priority:96,dest:["tech","power-banks"],re:rx("\\b(power bank|portable charger)\\b"),exclude:rx("\\b(blanket|shawl|lamp|lights?|lantern|headlight|flashlight|bicycle|bike|heated|electric blanket)\\b")},
    {type:"gaming",priority:95,dest:["tech","gaming"],re:rx("\\b(gaming mouse|gaming keyboard|gamepad|game controller|joystick|xbox controller|playstation controller)\\b")},
    {type:"pet_bed_house",priority:95,dest:["pets","pet-houses"],re:rx("\\b(cat bed|dog bed|pet bed|cat house|dog house|pet house|cat condo|pet condo|cat cave)\\b"),exclude:rx("\\b(sign|plaque|wall decor|decoration|ozone|disinfection machine|sterilizer)\\b")},
    {type:"pet_grooming",priority:95,dest:["pets","pet-grooming"],re:rx("\\b(pet grooming|dog grooming|cat grooming|pet brush|dog brush|cat brush|deshedding|pet clipper|pet nail clipper)\\b")},
    {type:"aquarium",priority:95,dest:["pets","aquarium"],re:rx("\\b(aquarium|fish tank|fish filter|fish feeder|aquatic pump)\\b")},
    {type:"building_toy",priority:94,dest:["toys","building-toys"],re:rx("\\b(building blocks?|construction blocks?|brick set|building toy|construction toy)\\b")},
    {type:"office_craft",priority:72,dest:["office","crafts"],re:rx("\\b(embroidery kit|crochet kit|knitting kit|scrapbook supplies|beading (kit|supplies)|sewing kit|craft kit|jewelry making kit|diy craft|craft supplies)\\b")},
    {type:"stationery",priority:72,dest:["office","stationery"],re:rx("\\b(notebook|planner|journal|stationery|sticky notes?|paper clips?|pencil case|marker pens?)\\b"),exclude:rx("\\b(computer|laptop|macbook|briefcase|handbag)\\b")},
    {type:"garden_light",priority:93,dest:["garden","garden-lighting"],re:rx("\\b(garden light|solar garden light|landscape light|outdoor garden light)\\b")},
    {type:"garden_tool",priority:93,dest:["garden","garden-tools"],re:rx("\\b(garden tool|gardening tool|garden rake|planting shovel|watering tool|plant tool)\\b")},
    {type:"cleaning",priority:92,dest:["home","cleaning"],re:rx("\\b(mop|dustpan|broom|squeegee|duster|cleaning brush|window cleaner|household cleaner)\\b"),exclude:rx("\\b(straw|makeup|cosmetic|beard|hair|pet|dog|cat|garden|lawn|keyboard|headset|earphone|phone)\\b")},
    {type:"laundry",priority:92,dest:["home","laundry"],re:rx("\\b(laundry hamper|laundry basket|drying rack|clothes drying|ironing board|laundry bag)\\b")},
    {type:"bedding",priority:92,dest:["home","bedding"],re:rx("\\b(bed sheet|bedsheet|duvet|comforter|quilt|bedding set|mattress cover|pillowcase)\\b")},
    {type:"curtain",priority:92,dest:["home","curtains"],re:rx("\\b(curtain|curtains|drape|drapes|window panel)\\b")},
    {type:"rug",priority:92,dest:["home","rugs"],re:rx("\\b(rug|rugs|carpet|doormat|floor mat)\\b")},
    {type:"entryway",priority:92,dest:["home","entryway"],re:rx("\\b(coat rack|shoe rack|entryway|umbrella stand|hallway storage|console table)\\b")},
    {type:"home_storage",priority:91,dest:["home","home-storage"],re:rx("\\b(storage box|storage basket|storage rack|drawer organizer|closet organizer|home organizer)\\b"),exclude:rx("\\b(kitchen|egg|refrigerator|fridge|jewelry|sewing|thread|snack|food|tissue|toilet paper|remote control|phone bracket)\\b")},
    {type:"wall_decor",priority:91,dest:["home","wall-decor"],re:rx("\\b(wall art|wall decor|wall hanging|wall clock|wall shelf|wall sticker)\\b")},
    {type:"mirror",priority:90,dest:["home","mirrors"],re:rx("\\b(wall mirror|full length mirror|bathroom mirror|dressing mirror|desktop mirror)\\b"),exclude:rx("\\b(phone case|holder|bracket|automotive|car sunshade|vehicle)\\b")},
    {type:"home_lighting",priority:90,dest:["home","lighting"],re:rx("\\b(table lamp|desk lamp|bedside lamp|night light|ceiling light|wall light|home lamp)\\b"),exclude:rx("\\b(humidifier|speaker|toy|globe|projector toy|backpack|school bag)\\b")},
    {type:"fitness_accessory",priority:90,dest:["sports","fitness-accessories"],re:rx("\\b(resistance band|exercise band|yoga mat|ab roller|foam roller|jump rope|fitness accessory|gym accessory)\\b"),exclude:rx("\\b(socks?|handbag|shoulder bag|travel bag|computer bag|backpack)\\b")},
    {type:"active_bottoms",priority:89,dest:["sports","active-bottoms"],re:rx("\\b(yoga pants|gym shorts|sports shorts|running pants|training pants|workout leggings)\\b")},
    {type:"sports_gear",priority:88,dest:["sports","sports-gear"],re:rx("\\b(basketball|football|soccer|tennis|badminton|volleyball).{0,20}\\b(ball|racket|gear|equipment|training)\\b")},
    {type:"earrings",priority:84,dest:["accessories","jewelry-earrings"],re:rx("\\bearrings?\\b"),exclude:rx("\\b(camera|craft|diy|beads?|phone case|keychain)\\b")},
    {type:"necklace",priority:84,dest:["accessories","jewelry-necklaces"],re:rx("\\bnecklaces?\\b"),exclude:rx("\\b(camera|craft|diy|beads?|phone case)\\b")},
    {type:"bracelet",priority:84,dest:["accessories","jewelry-bracelets"],re:rx("\\b(bracelets?|bangles?)\\b"),exclude:rx("\\b(smart|fitness|watch|wristband|strap|band|cable|craft|diy|beads?|sanitizer|dispenser|costume|shawl)\\b")},
    {type:"ring",priority:84,dest:["accessories","jewelry-rings"],re:rx("\\b(finger ring|rings? for women|women(?:\'s)? rings?|men(?:\'s)? rings?|jewelry rings?|engagement ring|wedding ring|zircon ring|stainless steel ring)\\b"),exclude:rx("\\b(ring free|smart|fitness|yoga|phone|holder|stand|key ?ring|napkin|binder|curtain|camera|craft|diy)\\b")},
    {type:"watch",priority:86,dest:["accessories","watches"],re:rx("\\b(wristwatch|analog watch|quartz watch|mechanical watch)\\b"),exclude:rx("\\bsmart\\b")},
    {type:"hat",priority:85,dest:["accessories","hats"],re:rx("\\b(beanie|bucket hat|baseball cap|sun hat|beret)\\b")},
    {type:"bag_accessory",priority:80,dest:["accessories","bag-accessories"],re:rx("\\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap)\\b")},
    {type:"bag",priority:80,dest:["accessories","bags"],re:rx("\\b(handbag|shoulder bag|crossbody bag|tote bag|purse)\\b"),exclude:rx("\\b(storage bag|laundry bag|trash bag|sleeping bag)\\b")},
    {type:"hair_accessory",priority:80,dest:["accessories","hair-accessories"],re:rx("\\b(hair clip|hair claw|hair tie|scrunchie|headband|barrette|hair pin)\\b"),exclude:rx("\\b(headlamp|headlight|sweatband|sports|pet|dog|cat|animal ears?|cosplay)\\b")},
    {type:"boxers",priority:92,dest:["men","men-boxers"],re:rx("\\b(boxer briefs|boxer shorts|boxers)\\b")},
    {type:"women_underwear",priority:92,dest:["women","women-underwear"],re:rx("\\b(panties|women'?s underwear|women'?s briefs|ladies underwear|sports bra|wireless bra)\\b")},
    {type:"women_swim",priority:92,dest:["women","women-swim"],re:rx("\\b(bikini|swimsuit|one[- ]piece swimsuit|beach cover[- ]?up)\\b"),exclude:rx("\\b(girl|kids?|children|baby|wax|shaver|trimmer|hair removal|depilation|jewelry|ring tie|metal ring)\\b")},
    {type:"evening_dress",priority:93,dest:["women","women-evening"],re:rx("\\b(evening dress|prom dress|cocktail dress|formal dress|party dress|banquet dress)\\b"),exclude:rx("\\b(necklace|earring|jewelry|pendant|bracelet|ring set)\\b")},
    {type:"dress",priority:90,dest:["women","women-dresses"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,50}\\bdress\\b|\\bdress\\b.{0,50}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"skirt",priority:91,dest:["women","women-skirts"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,40}\\bskirt\\b|\\bskirt\\b.{0,40}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"women_jeans",priority:92,dest:["women","women-jeans"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(jeans|denim pants|denim trousers)\\b|\\b(jeans|denim pants|denim trousers)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b"),exclude:rx("\\b(jacket|coat|hoodie|outerwear)\\b")},
    {type:"men_jeans",priority:92,dest:["men","men-jeans"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(jeans|denim pants|denim trousers)\\b|\\b(jeans|denim pants|denim trousers)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b"),exclude:rx("\\b(jacket|coat|hoodie|outerwear)\\b")},
    {type:"women_shoes",priority:91,dest:["women","women-shoes"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b|\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b"),exclude:rx("\\b(shoe rack|shoe cabinet|shoe bag|gym bag|backpack|shoe cover|toe cap|protective gear)\\b")},
    {type:"men_shoes",priority:91,dest:["men","men-shoes"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b|\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b"),exclude:rx("\\b(shoe rack|shoe cabinet|shoe bag|gym bag|backpack|shoe cover|toe cap|protective gear)\\b")},
    {type:"women_outerwear",priority:90,dest:["women","women-outerwear"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(jacket|coat|parka|windbreaker|outerwear)\\b|\\b(jacket|coat|parka|windbreaker|outerwear)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_outerwear",priority:90,dest:["men","men-outerwear"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(jacket|coat|parka|windbreaker|outerwear)\\b|\\b(jacket|coat|parka|windbreaker|outerwear)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_hoodie",priority:90,dest:["women","women-hoodies"],exclude:rx("\\bt[- ]?shirt\\b"),re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(hoodie|sweatshirt)\\b|\\b(hoodie|sweatshirt)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_hoodie",priority:90,dest:["men","men-hoodies"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(hoodie|sweatshirt)\\b|\\b(hoodie|sweatshirt)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_knitwear",priority:89,dest:["women","women-knitwear"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(sweater|cardigan|knitwear|pullover)\\b|\\b(sweater|cardigan|knitwear|pullover)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_knitwear",priority:89,dest:["men","men-knitwear"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(sweater|cardigan|knitwear|pullover)\\b|\\b(sweater|cardigan|knitwear|pullover)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_suit",priority:91,dest:["women","women-suits"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(suit|blazer|two[- ]piece suit)\\b|\\b(suit|blazer)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_suit",priority:91,dest:["men","men-suits"],re:rx("\\b(men|men'?s|mens|male|man|groom).{0,45}\\b(suit|tuxedo|blazer)\\b|\\b(suit|tuxedo|blazer)\\b.{0,45}\\b(men|men'?s|mens|male|man|groom)\\b")},
    {type:"women_socks",priority:88,dest:["women","women-socks"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,40}\\b(socks?|stockings?|pantyhose)\\b|\\b(socks?|stockings?|pantyhose)\\b.{0,40}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_socks",priority:88,dest:["men","men-socks"],re:rx("\\b(men|men'?s|mens|male|man).{0,40}\\bsocks?\\b|\\bsocks?\\b.{0,40}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"generic_socks",priority:70,dest:["accessories","socks"],re:rx("\\bsocks?\\b"),exclude:rx("\\b(sock boots?|sock shoes?|kids?|children|baby|toddler|boys?|girls?|dog|cat|pet|women|women\'s|men|men\'s)\\b")},

    {type:"beauty_makeup",priority:86,dest:["beauty","makeup"],re:rx("\\b(lipstick|lip gloss|mascara|eyeliner|eyeshadow|eye shadow|foundation|concealer|blush|brow pencil|eyebrow pencil|makeup palette|make-up palette)\\b")},
    {type:"beauty_skincare",priority:86,dest:["beauty","skincare"],re:rx("\\b(face serum|facial serum|moisturizer|moisturising cream|moisturizing cream|face cream|facial cream|facial cleanser|face cleanser|skin toner|facial toner|sunscreen|sun cream|eye cream|face mask|facial mask|acne patch|blemish patch)\\b")},
    {type:"beauty_hair",priority:85,dest:["beauty","hair"],re:rx("\\b(wig|hair extension|hair extensions|hair dryer|blow dryer|curling iron|hair curler|hair straightener|flat iron|shampoo|conditioner|hair oil|hair serum|hair mask)\\b"),exclude:rx("\\b(pet|dog|cat)\\b")},
    {type:"beauty_tool",priority:84,dest:["beauty","beauty-tools"],re:rx("\\b(makeup brush|make-up brush|makeup sponge|beauty sponge|eyelash curler|facial roller|jade roller|gua sha|blackhead remover|pore cleaner|facial cleansing device|makeup mirror)\\b")},
    {type:"fragrance",priority:86,dest:["beauty","fragrance"],re:rx("\\b(eau de parfum|eau de toilette|perfume|cologne|fragrance spray|body fragrance|parfum)\\b"),exclude:rx("\\b(diffuser|air freshener|car perfume|pet)\\b")},
    {type:"nails",priority:85,dest:["beauty","nails"],re:rx("\\b(nail polish|gel polish|press[- ]?on nails?|false nails?|fake nails?|nail tips|manicure set|nail art)\\b"),exclude:rx("\\b(bag|pouch|packaging|drawstring|holder|storage case)\\b")},

    {type:"kids_shoes",priority:94,dest:["kids","kids-shoes"],re:rx("\\b(kids?|children|child|boys?|girls|girl\\x27s|baby|toddler).{0,45}\\b(shoes?|sneakers?|sandals?|boots?|slippers?)\\b|\\b(shoes?|sneakers?|sandals?|boots?|slippers?)\\b.{0,45}\\b(kids?|children|child|boys?|girls|girl\\x27s|baby|toddler)\\b"),exclude:rx("\\b(shoe rack|shoe bag|shoe cover)\\b")},
    {type:"kids_clothing",priority:90,dest:["kids","kids-clothing"],re:rx("\\b(kids?|children|child|boys?|girls|girl\\x27s).{0,50}\\b(t[- ]?shirt|shirt|pants|trousers|shorts|dress|skirt|jacket|coat|hoodie|sweater|clothing|outfit|set)\\b|\\b(t[- ]?shirt|shirt|pants|trousers|shorts|dress|skirt|jacket|coat|hoodie|sweater)\\b.{0,50}\\b(kids?|children|child|boys?|girls|girl\\x27s)\\b")},
    {type:"baby_product",priority:89,dest:["kids","baby"],re:rx("\\b(baby bib|baby bottle|pacifier|dummy pacifier|swaddle|baby blanket|baby romper|newborn romper|baby feeding|teether|baby teether|diaper bag|nappy bag)\\b")},
    {type:"kids_accessory",priority:82,dest:["kids","kids-accessories"],re:rx("\\b(kids?|children|boys?|girls|girl\\x27s|baby|toddler).{0,40}\\b(headband|hair clip|hat|cap|beanie|backpack|school bag|gloves|scarf)\\b|\\b(headband|hair clip|hat|cap|beanie|backpack|school bag|gloves|scarf)\\b.{0,40}\\b(kids?|children|boys?|girls|girl\\x27s|baby|toddler)\\b")},

    {type:"drinkware",priority:84,dest:["kitchen","drinkware"],re:rx("\\b(tumbler|travel mug|coffee mug|tea mug|drinking cup|water bottle|vacuum bottle|thermos|vacuum flask|straw cup|glass cup)\\b"),exclude:rx("\\b(baby bottle|pet bottle|spray bottle|carrier bag|waist bag|bottle bag|pouch|holder|hook|hooks|hanging rope|storage tool|lunch bag|case|pet|dog|cat)\\b")},
    {type:"cookware",priority:84,dest:["kitchen","cookware"],re:rx("\\b(frying pan|fry pan|saucepan|cooking pot|stock pot|wok|baking pan|baking tray|roasting pan|casserole pot)\\b")},
    {type:"tableware",priority:83,dest:["kitchen","tableware"],re:rx("\\b(dinner plate|ceramic plate|dinnerware|tableware|cutlery set|flatware|spoon fork set|fork spoon set|serving bowl|salad bowl|rice bowl)\\b"),exclude:rx("\\b(baby|children|kids?|camping|outdoor|pet|dog|cat|storage bag|pouch|carrier)\\b")},
    {type:"kitchen_tool",priority:82,dest:["kitchen","kitchen-tools"],re:rx("\\b(vegetable peeler|kitchen peeler|silicone spatula|kitchen spatula|kitchen whisk|cheese grater|kitchen tongs|can opener|garlic press|pizza cutter|kitchen scissors|measuring spoons?|measuring cups?)\\b")},
    {type:"food_storage",priority:82,dest:["kitchen","food-storage"],re:rx("\\b(food storage container|food container|lunch box|bento box|food jar|grain storage|rice storage|spice jar|airtight container)\\b")},

    {type:"electrical_lighting",priority:83,dest:["electrical","electrical-lighting"],re:rx("\\b(led bulb|light bulb|ceiling light|ceiling lamp|chandelier|pendant light|led strip|strip light|downlight|spotlight|wall sconce)\\b"),exclude:rx("\\b(car|bicycle|bike|camping|garden|flea|bug trap|insect trap|pest killer|mosquito killer)\\b")},
    {type:"electrical_accessory",priority:79,dest:["electrical","electrical-accessories"],re:rx("\\b(power socket|wall socket|smart socket|electrical outlet|power strip|extension cord|plug adapter|voltage converter|circuit breaker)\\b")},
    {type:"home_appliance",priority:80,dest:["electrical","home-appliances"],re:rx("\\b(vacuum cleaner|air purifier|humidifier|dehumidifier|electric fan|portable fan|space heater|electric kettle|rice cooker|air fryer)\\b")},

    {type:"plush_toy",priority:86,dest:["toys","plush-toys"],re:rx("\\b(plush toy|stuffed animal|plush doll|stuffed toy|teddy bear|plush bear|plush rabbit|plush cat|plush dog)\\b"),exclude:rx("\\b(pet bed|cat bed|dog bed|keychain|bag charm|headband|hair accessory|cosplay|animal ears?|ear headband)\\b")},
    {type:"toy_vehicle",priority:84,dest:["toys","toy-vehicles"],re:rx("\\b(remote control car|rc car|toy car|toy truck|toy excavator|toy tractor|toy vehicle|remote control truck)\\b")},
    {type:"educational_toy",priority:81,dest:["toys","educational-toys"],re:rx("\\b(educational toy|learning toy|montessori toy|stem toy|learning board|busy board|math toy|alphabet toy)\\b")},

    {type:"computer_accessory",priority:81,dest:["tech","computer-accessories"],re:rx("\\b(usb hub|docking station|card reader|memory card reader|mouse pad|mousepad|laptop cooling pad|laptop sleeve|keyboard cover|webcam cover)\\b"),exclude:rx("\\b(gaming|privacy sticker|webcam cover|camera cover|laptop sleeve|notebook bag|carrying bag|protective bag)\\b")},
    {type:"audio",priority:85,dest:["tech","audio"],re:rx("\\b(headphones?|earphones?|earbuds?|bluetooth speaker|portable speaker|wireless speaker|microphone|soundbar|audio receiver)\\b"),exclude:rx("\\b(cleaning|protective case|protective cover|earphone case|headphone case|storage case|audio cable|headphone cable|earphone cable)\\b")},
    {type:"stand_holder",priority:84,dest:["tech","stands-holders"],re:rx("\\b(phone stand|mobile phone stand|tablet stand|laptop stand|phone holder|car phone holder|magnetic phone holder|tablet holder|desk phone holder)\\b")},
    {type:"tech_accessory",priority:78,dest:["tech","phone-accessories"],re:rx("\\b(screen protector|tempered glass|camera lens protector|phone lanyard|phone strap|sim card tool)\\b")},

    {type:"cycling",priority:84,dest:["sports","cycling"],re:rx("\\b(bike helmet|bicycle helmet|cycling helmet|bicycle pump|bike pump|cycling gloves|bike saddle|bicycle saddle|cycling jersey|bike bag|bicycle bag|bike repair kit)\\b")},
    {type:"outdoor_sports",priority:80,dest:["sports","outdoors"],re:rx("\\b(hiking poles?|trekking poles?|hiking gear|outdoor sports|climbing harness|climbing carabiner|camping hiking backpack)\\b")},
    {type:"sports_top",priority:78,dest:["sports","active-tops"],re:rx("\\b(sports top|workout top|gym top|running shirt|training shirt|yoga top|fitness top)\\b")},

    {type:"pet_walk",priority:88,dest:["pets","pet-walk"],re:rx("\\b(dog leash|pet leash|dog collar|cat collar|pet collar|dog harness|cat harness|pet harness|dog lead|pet lead|chest harness|anti[- ]?pull harness)\\b")},
    {type:"pet_accessory",priority:83,dest:["pets","pet-accessories"],re:rx("\\b(pet bowl|dog bowl|cat bowl|pet feeder|poop bag|pet waste bag|cat scratcher|scratching post|pet carrier|pet backpack)\\b")},
    {type:"pet_toy",priority:82,dest:["pets","pet-toys"],re:rx("\\b(dog toy|cat toy|pet toy|chew toy for dog|cat teaser|cat wand|dog ball toy)\\b")},

    {type:"camping_shelter",priority:85,dest:["camping","camping-shelter"],re:rx("\\b(camping tent|outdoor tent|backpacking tent|beach tent|canopy tent|camping tarp|tent tarp)\\b")},
    {type:"camping_sleep",priority:84,dest:["camping","camping-sleep"],re:rx("\\b(camping sleeping bag|outdoor sleeping bag|camping mattress|sleeping pad|camping pillow|inflatable camping mat)\\b")},
    {type:"camping_light",priority:84,dest:["camping","camping-lighting"],re:rx("\\b(camping lantern|camping light|tent light|outdoor lantern)\\b")},
    {type:"outdoor_gear",priority:75,dest:["camping","outdoors"],re:rx("\\b(camping gear|hiking gear|outdoor survival gear|camping accessory|camping accessories)\\b"),exclude:rx("\\b(stove|gas|fuel|knife|blade|fire starter|lighter)\\b")},

    {type:"luggage",priority:85,dest:["travel","luggage"],re:rx("\\b(suitcase|travel suitcase|luggage case|trolley case|carry[- ]?on luggage|rolling luggage|hard shell luggage|hardshell luggage)\\b")},
    {type:"travel_accessory",priority:80,dest:["travel","travel-accessories"],re:rx("\\b(luggage tag|passport holder|travel pillow|packing cubes?|travel organizer|neck pillow|luggage strap)\\b")},

    {type:"home_textile",priority:78,dest:["home","home-textiles"],re:rx("\\b(throw blanket|sofa cover|couch cover|cushion cover|tablecloth|table cloth|bath towel|hand towel|decorative pillow cover)\\b"),exclude:rx("\\b(pet|dog|cat|costume|robe)\\b")},
    {type:"home_decor",priority:75,dest:["home","home-decor"],re:rx("\\b(home decor|home decoration|decorative vase|ceramic vase|decorative figurine|ornament statue|decorative sculpture)\\b"),exclude:rx("\\b(jewelry|earring|necklace|phone case|glue|paint|repair|leak|sealant)\\b")}
  ].sort((a,b)=>b.priority-a.priority);

  function detectGender(title){
    const t=clean(title).toLowerCase();
    const men=/\b(men|men's|mens|male|man|gentlemen)\b/i.test(t);
    const women=/\b(women|women's|womens|female|woman|ladies|lady)\b/i.test(t);
    const kids=/\b(kids?|children|child|baby|toddler|infant|newborn|boys?|girls|girl\x27s)\b/i.test(t);
    if(men&&women)return "UNISEX";
    if(kids&&!men&&!women)return "KIDS";
    if(men&&!women)return "MEN";
    if(women&&!men)return "WOMEN";
    return "UNKNOWN";
  }

  function detectProductType(product={}){
    const title=clean(product.title);
    const hits=[];
    for(const rule of RULES){
      const m=title.match(rule.re);
      if(!m)continue;
      if(rule.exclude&&rule.exclude.test(title))continue;
      hits.push({type:rule.type,priority:rule.priority,dest:rule.dest,match:m[0]});
    }
    if(!hits.length)return {state:"UNKNOWN",hits:[]};
    const top=hits[0];
    const conflicting=hits.filter(x=>x.priority>=top.priority-1 && (x.dest[0]!==top.dest[0]||x.dest[1]!==top.dest[1]));
    if(conflicting.length>=1)return {state:"CONFLICTED",hits:[top,...conflicting]};
    return {state:"VERIFIED",...top,hits};
  }

  const SAFE_MOVE_TYPES=new Set([
    "phone_case","pet_bed_house","pet_grooming","building_toy",
    "fitness_accessory","sports_gear","earrings","necklace","ring","watch",
    "wearable_accessory","gaming","bag_accessory","boxers",
    "women_swim","evening_dress","women_jeans","men_jeans",
    "women_shoes","men_shoes","women_hoodie","active_bottoms",
    "garden_tool","fragrance","computer_accessory","charger_cable"
  ]);

  function evaluate(product={}){
    const currentDepartment=clean(product.current_department||product.department);
    const currentCategory=clean(product.current_category||product.category);
    const title=clean(product.title);
    const gender=detectGender(title);
    const type=detectProductType(product);
    const positive=[],negative=[],conflicts=[],reasonCodes=[];

    if(type.state==="CONFLICTED"){
      conflicts.push(...type.hits.map(x=>x.type+":"+x.dest.join("/")));
      reasonCodes.push("PLACEMENT_TYPE_CONFLICT");
      return {decision:"REVIEW",placement_action:"HOLD_REVIEW",move_tier:"RULE_REFINEMENT",detected_product_type:null,canonical_department:null,canonical_category:null,confidence:0,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }

    if(type.state==="VERIFIED"){
      const [dep,cat]=type.dest;
      positive.push(evidence("EXPLICIT_PRODUCT_TYPE",type.match),evidence("DETECTED_TYPE",type.type));
      const same=dep===currentDepartment&&cat===currentCategory;
      if(same){
        reasonCodes.push("PLACEMENT_SUPPORTED");
        return {decision:"PASS",placement_action:"KEEP",move_tier:"NONE",detected_product_type:type.type,canonical_department:dep,canonical_category:cat,confidence:0.98,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:false,gender};
      }
      negative.push(evidence("CURRENT_PLACEMENT_CONTRADICTS_TYPE",(currentDepartment||"UNKNOWN")+"/"+(currentCategory||"UNKNOWN")));
      reasonCodes.push("CURRENT_PLACEMENT_MISMATCH");

      if((currentDepartment==="kids"||gender==="KIDS")&&dep!=="kids"){
        conflicts.push("KIDS_AUDIENCE_CROSS_DEPARTMENT");
        reasonCodes.push("KIDS_DEPARTMENT_PROTECTION");
        return {decision:"REVIEW",placement_action:"HOLD_REVIEW",move_tier:"RULE_REFINEMENT",detected_product_type:type.type,canonical_department:null,canonical_category:null,suggested_department:dep,suggested_category:cat,confidence:0.60,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
      }

      if(!SAFE_MOVE_TYPES.has(type.type)){
        reasonCodes.push("TYPE_RULE_REQUIRES_REFINEMENT");
        return {decision:"REVIEW",placement_action:"HOLD_REVIEW",move_tier:"RULE_REFINEMENT",detected_product_type:type.type,canonical_department:null,canonical_category:null,suggested_department:dep,suggested_category:cat,confidence:0.70,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
      }

      reasonCodes.push("SAFE_MOVE_CANDIDATE");
      return {decision:"REJECT",placement_action:"MOVE",move_tier:"SAFE_MOVE_CANDIDATE",detected_product_type:type.type,canonical_department:dep,canonical_category:cat,confidence:0.98,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }

    if(currentDepartment==="men"&&gender==="WOMEN"){
      negative.push(evidence("EXPLICIT_GENDER_CONFLICT","WOMEN title in men department"));
      reasonCodes.push("GENDER_DEPARTMENT_CONFLICT");
      return {decision:"REVIEW",placement_action:"HOLD_REVIEW",move_tier:"RULE_REFINEMENT",detected_product_type:null,canonical_department:"women",canonical_category:null,confidence:0.90,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }
    if(currentDepartment==="women"&&gender==="MEN"){
      negative.push(evidence("EXPLICIT_GENDER_CONFLICT","MEN title in women department"));
      reasonCodes.push("GENDER_DEPARTMENT_CONFLICT");
      return {decision:"REVIEW",placement_action:"HOLD_REVIEW",move_tier:"RULE_REFINEMENT",detected_product_type:null,canonical_department:"men",canonical_category:null,confidence:0.90,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }

    if(product.supplier_taxonomy_current_rail_verified===true){
      positive.push(evidence("SUPPLIER_TAXONOMY_VERIFIED_CURRENT_RAIL",product.supplier_category_id||"verified"));
      reasonCodes.push("SUPPLIER_TAXONOMY_KEEP_SUPPORT");
      return {decision:"PASS",placement_action:"KEEP",move_tier:"NONE",detected_product_type:null,canonical_department:currentDepartment,canonical_category:currentCategory,confidence:0.92,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:false,gender};
    }

    reasonCodes.push("NO_INDEPENDENT_PLACEMENT_PROOF");
    return {decision:"UNKNOWN",placement_action:"HOLD_UNKNOWN",move_tier:"NO_EVIDENCE",detected_product_type:null,canonical_department:null,canonical_category:null,confidence:0,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
  }

  function audit(products=[]){
    const rows=products.map(p=>({...p,placement:evaluate(p)}));
    const summary={total:rows.length,PASS:0,REJECT:0,REVIEW:0,UNKNOWN:0,KEEP:0,MOVE:0,HOLD_REVIEW:0,HOLD_UNKNOWN:0};
    for(const row of rows){
      summary[row.placement.decision]=(summary[row.placement.decision]||0)+1;
      summary[row.placement.placement_action]=(summary[row.placement.placement_action]||0)+1;
    }
    return {version:"HUNT-PRODUCT-PLACEMENT-GATE-V1",mode:"SHADOW_ALWAYS_ON",summary,rows};
  }

  return {version:"HUNT-PRODUCT-PLACEMENT-GATE-V1",detectGender,detectProductType,evaluate,audit};
});
