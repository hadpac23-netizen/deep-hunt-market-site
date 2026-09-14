(() => {
  const functionsBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const publishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const cartKey = "hunt_deal_cart_v1";
  const signalKey = "hunt_deal_boom_signals_v1";
  const preferenceKey = "hunt_shopping_preferences_v1";
  const blocked = [
    "gun","firearm","ammunition","ammo","weapon","switchblade","taser",
    "cannabis","marijuana","thc","cocaine","heroin","meth","steroid",
    "vape","cigarette","nicotine","beer","wine","vodka","casino",
    "sportsbook","betting","porn","sex toy","spyware"
  ];

  const categoryDefs = {
    women: {title:"Women's Fashion", query:"women", icon:"W", description:"Women's apparel, everyday fashion and seasonal styles."},
    men: {title:"Men's Fashion", query:"men", icon:"M", description:"Men's apparel only: shirts, hoodies, jackets, bottoms and everyday styles."},
    dresses: {title:"Dresses & Skirts", query:"women dresses skirts", icon:"D", description:"Women's dresses and skirts from CJ."},
    eveningdresses: {title:"Evening & Occasion Dresses", query:"women evening dress party formal", icon:"E", description:"Evening, party and occasion dresses from CJ."},
    womensuits: {title:"Women's Suits & Blazers", query:"women suits blazers tailoring", icon:"U", description:"Women's suits, blazers and tailored sets from CJ."},
    tops: {title:"Tops & T-Shirts", query:"tops", icon:"T", description:"T-shirts, tops, tanks, polos and blouses."},
    bottoms: {title:"Bottoms", query:"bottoms pants shorts jeans", icon:"B", description:"Pants, shorts, jeans, joggers and leggings."},
    jeans: {title:"Jeans & Denim", query:"jeans denim", icon:"J", description:"Jeans and denim bottoms with live product-detail recheck before checkout."},
    underwear: {title:"Women's Underwear & Bras", query:"women underwear bra panties briefs", icon:"U", description:"Everyday women's underwear and bras from CJ."},
    thongs: {title:"Women's Thongs", query:"women thong underwear", icon:"T", description:"Women's thong underwear kept separate from everyday basics."},
    boxers: {title:"Men's Boxer Briefs", query:"men boxer briefs underwear", icon:"B", description:"Men's boxer briefs and everyday underwear from CJ."},
    longboxers: {title:"Men's Long Boxer Briefs", query:"men long boxer briefs", icon:"L", description:"Long-leg boxer briefs and compression-style underwear from CJ."},
    mensbriefs: {title:"Men's Briefs & Low-Rise", query:"men briefs low rise underwear", icon:"R", description:"Men's briefs and low-rise underwear from CJ."},
    hoodies: {title:"Hoodies & Sweatshirts", query:"hoodies", icon:"H", description:"Hoodies, sweatshirts and warm layers."},
    knitwear: {title:"Knitwear", query:"sweaters cardigans knitwear", icon:"N", description:"Sweaters, cardigans and knit layers."},
    jackets: {title:"Jackets & Outerwear", query:"jackets", icon:"J", description:"Jackets, windbreakers and outerwear."},
    activewear: {title:"Activewear", query:"activewear", icon:"A", description:"Athletic apparel, leggings, shorts and performance wear."},
    bags: {title:"Bags", query:"bags", icon:"B", description:"Crossbody bags, totes, backpacks and everyday bags."},
    shoes: {title:"Shoes", query:"shoes", icon:"S", description:"Sneakers, canvas shoes and slides."},
    accessories: {title:"Accessories", query:"fashion accessories", icon:"X", description:"Everyday fashion accessories from CJ."},
    sunglasses: {title:"Sunglasses", query:"sunglasses", icon:"G", description:"Sunglasses and eyewear accessories from CJ."},
    belts: {title:"Belts & Small Accessories", query:"belt fashion accessories", icon:"B", description:"Belts and small fashion accessories from CJ."},
    home: {title:"Home", query:"home", icon:"O", description:"Decor, useful home finds and everyday living products."},
    storage: {title:"Storage & Organization", query:"storage organizer", icon:"S", description:"Closet, kitchen and home storage solutions."},
    bedding: {title:"Bedding", query:"bedding sheets duvet comforter", icon:"D", description:"Bedding, blankets, pillowcases and soft home essentials."},
    cleaning: {title:"Cleaning & Laundry", query:"cleaning laundry", icon:"C", description:"Household cleaning and laundry accessories."},
    tech: {title:"Phone & Tech", query:"tech", icon:"P", description:"Phones, electronics and connected accessories from approved catalog sources."},
    phonecases: {title:"Premium Phone Cases", query:"phone cases", icon:"C", description:"Curated phone cases with product-detail recheck before checkout."},
    phoneaccessories: {title:"Phone Accessories", query:"phone accessories", icon:"A", description:"Useful phone accessories from CJ."},
    chargers: {title:"Chargers & Cables", query:"phone charger cable usb type c", icon:"C", description:"Chargers, USB-C/Lightning cables and charging accessories from CJ."},
    powerbanks: {title:"Power Banks", query:"power bank portable charger", icon:"P", description:"Portable charging products from CJ."},
    phonestands: {title:"Phone & Tablet Stands", query:"phone tablet stand holder", icon:"S", description:"Phone and tablet stands and holders from CJ."},
    earbuds: {title:"Earbuds & Audio", query:"wireless earbuds bluetooth audio", icon:"A", description:"Useful personal audio accessories from CJ."},
    usefultech: {title:"Useful Electronics", query:"useful electronics smart device", icon:"E", description:"Practical everyday electronics from CJ."},
    gaming: {title:"Gaming Accessories", query:"gaming accessories", icon:"G", description:"Gaming accessories and desk-ready gear from connected supplier feeds."},
    hairaccessories: {title:"Hair Accessories", query:"hair accessories", icon:"H", description:"Hair clips, headbands, barrettes and everyday hair accessories."},
    sets: {title:"Matching Sets", query:"matching sets", icon:"2", description:"Two-piece and coordinated apparel sets from approved catalog sources."},
    plussize: {title:"Plus Size", query:"plus size fashion", icon:"+", description:"Extended-size apparel with product-detail recheck before checkout."},
    sleepwear: {title:"Sleepwear", query:"sleepwear pajamas", icon:"N", description:"Pyjamas, nightwear and robes from approved catalog sources."},
    suits: {title:"Suits & Tailoring", query:"suits blazers", icon:"U", description:"Suits, blazers and tailored styles from approved catalog sources."},
    sports: {title:"Sports & Fitness", query:"sports fitness", icon:"F", description:"Sports, fitness and active-lifestyle accessories."},
    outdoors: {title:"Outdoor & Garden", query:"outdoor garden picnic", icon:"G", description:"Outdoor, garden and picnic products."},
    kitchen: {title:"Kitchen", query:"kitchen", icon:"K", description:"Kitchen organizers, cookware accessories and useful everyday finds."},
    lighting: {title:"Lighting", query:"lighting", icon:"L", description:"Decorative lighting, desk lights and home lighting accessories."},
    bath: {title:"Bath & Bathroom", query:"bathroom bath", icon:"B", description:"Bathroom organizers and bath accessories."},
    toys: {title:"Toys & Play", query:"kids toys", icon:"T", description:"Selected toys, puzzles and creative play products."},
    crafts: {title:"Arts & Crafts", query:"crafts sewing painting", icon:"C", description:"Crafting, sewing, drawing and hobby supplies."},
    party: {title:"Party & Celebration", query:"party decorations gift wrap", icon:"P", description:"Party decorations, gift wrap and celebration supplies."},
    travel: {title:"Travel", query:"travel", icon:"R", description:"Travel bags, tags, bottles and useful travel items."},
    gifts: {title:"Gifts", query:"gifts", icon:"G", description:"Gift ideas from live approved catalogs."},
    kids: {title:"Kids & Youth", query:"kids", icon:"K", description:"Kids and youth apparel from the connected live catalog."},
    hats: {title:"Hats & Caps", query:"hats", icon:"C", description:"Caps, hats, beanies and headwear."},
    drinkware: {title:"Drinkware", query:"drinkware", icon:"U", description:"Mugs, bottles and tumblers."},
    wallart: {title:"Wall Art", query:"wallart", icon:"L", description:"Posters, canvas and wall decor."},
    blankets: {title:"Blankets & Towels", query:"blankets", icon:"N", description:"Blankets, towels and soft home essentials."},
    stickers: {title:"Stickers", query:"stickers", icon:"I", description:"Sticker sheets and decorative stickers."},
    stationery: {title:"Stationery", query:"stationery", icon:"E", description:"Notebooks, journals and calendars."},
    pets: {title:"Pets", query:"pets", icon:"V", description:"Pet accessories and selected pet products."},
    socks: {title:"Socks", query:"socks", icon:"Z", description:"Printed and embroidered socks."},
    swimwear: {title:"Swimwear", query:"swimwear", icon:"S", description:"Swimwear and swim-focused apparel."},
    office: {title:"Office & Desk", query:"office", icon:"D", description:"Desk mats, calendars, mouse pads and notebooks."},
    pillows: {title:"Pillows", query:"pillows", icon:"P", description:"Decorative pillows and pillow products."},
    ornaments: {title:"Ornaments", query:"ornaments", icon:"R", description:"Seasonal and decorative ornaments."},
    perfume: {title:"Perfume & Fragrance", query:"women perfume fragrance", icon:"F", description:"Live when matched from connected approved supplier feeds."},
    beauty: {title:"Beauty & Skincare", query:"beauty skincare makeup", icon:"Y", description:"Beauty and skincare products matched from connected approved supplier feeds."},
    makeup: {title:"Makeup", query:"makeup cosmetics", icon:"M", description:"Curated makeup products from CJ with unrelated vanity furniture and accessories excluded."},
    skincare: {title:"Skincare", query:"skincare face serum cleanser cream toner", icon:"S", description:"Curated skincare products from CJ with product-detail verification before checkout."},
    jewelry: {title:"Jewelry", query:"women jewelry necklace bracelet earrings", icon:"Q", description:"Jewelry and accessories matched from connected approved supplier feeds."}
  };

  Object.assign(categoryDefs, {"women":{"title":"Women","icon":"W","description":"Women products from CJ, organized into clear categories.","query":"women"},"women-dresses":{"title":"Dresses","icon":"D","description":"Dresses from the CJ-only HUNT catalog.","query":"women dresses"},"women-evening":{"title":"Evening & Occasion","icon":"E","description":"Evening & Occasion from the CJ-only HUNT catalog.","query":"women evening"},"women-suits":{"title":"Suits & Blazers","icon":"S","description":"Suits & Blazers from the CJ-only HUNT catalog.","query":"women suits"},"women-tops":{"title":"T-Shirts, Tops & Blouses","icon":"T","description":"T-Shirts, Tops & Blouses from the CJ-only HUNT catalog.","query":"women tops"},"women-jeans":{"title":"Jeans & Denim","icon":"J","description":"Jeans & Denim from the CJ-only HUNT catalog.","query":"women jeans"},"women-bottoms":{"title":"Pants & Shorts","icon":"P","description":"Pants & Shorts from the CJ-only HUNT catalog.","query":"women bottoms"},"women-skirts":{"title":"Skirts","icon":"S","description":"Skirts from the CJ-only HUNT catalog.","query":"women skirts"},"women-knitwear":{"title":"Knitwear & Sweaters","icon":"K","description":"Knitwear & Sweaters from the CJ-only HUNT catalog.","query":"women knitwear"},"women-outerwear":{"title":"Jackets & Coats","icon":"J","description":"Jackets & Coats from the CJ-only HUNT catalog.","query":"women outerwear"},"women-underwear":{"title":"Underwear & Bras","icon":"U","description":"Underwear & Bras from the CJ-only HUNT catalog.","query":"women underwear"},"women-sleepwear":{"title":"Sleepwear","icon":"S","description":"Sleepwear from the CJ-only HUNT catalog.","query":"women sleepwear"},"women-swim":{"title":"Swimwear","icon":"S","description":"Swimwear from the CJ-only HUNT catalog.","query":"women swim"},"women-shoes":{"title":"Shoes","icon":"S","description":"Shoes from the CJ-only HUNT catalog.","query":"women shoes"},"women-socks":{"title":"Socks","icon":"S","description":"Socks from the CJ-only HUNT catalog.","query":"women socks"},"women-wallets":{"title":"Wallets","icon":"W","description":"Wallets from the CJ-only HUNT catalog.","query":"women wallets"},"women-hoodies":{"title":"Hoodies & Sweatshirts","icon":"H","description":"Hoodies & Sweatshirts from the CJ-only HUNT catalog.","query":"women hoodies"},"women-clothing":{"title":"More Women","icon":"M","description":"More Women from the CJ-only HUNT catalog.","query":"women clothing"},"men":{"title":"Men","icon":"M","description":"Men products from CJ, organized into clear categories.","query":"men"},"men-tops":{"title":"Shirts & T-Shirts","icon":"S","description":"Shirts & T-Shirts from the CJ-only HUNT catalog.","query":"men tops"},"men-suits":{"title":"Suits & Blazers","icon":"S","description":"Suits & Blazers from the CJ-only HUNT catalog.","query":"men suits"},"men-jeans":{"title":"Jeans & Denim","icon":"J","description":"Jeans & Denim from the CJ-only HUNT catalog.","query":"men jeans"},"men-bottoms":{"title":"Pants & Shorts","icon":"P","description":"Pants & Shorts from the CJ-only HUNT catalog.","query":"men bottoms"},"men-outerwear":{"title":"Jackets & Coats","icon":"J","description":"Jackets & Coats from the CJ-only HUNT catalog.","query":"men outerwear"},"men-knitwear":{"title":"Knitwear & Sweaters","icon":"K","description":"Knitwear & Sweaters from the CJ-only HUNT catalog.","query":"men knitwear"},"men-boxers":{"title":"Boxers","icon":"B","description":"Boxers from the CJ-only HUNT catalog.","query":"men boxers"},"men-underwear":{"title":"Underwear & Briefs","icon":"U","description":"Underwear & Briefs from the CJ-only HUNT catalog.","query":"men underwear"},"men-sleepwear":{"title":"Sleepwear","icon":"S","description":"Sleepwear from the CJ-only HUNT catalog.","query":"men sleepwear"},"men-shoes":{"title":"Shoes","icon":"S","description":"Shoes from the CJ-only HUNT catalog.","query":"men shoes"},"men-bags":{"title":"Bags","icon":"B","description":"Bags from the CJ-only HUNT catalog.","query":"men bags"},"men-wallets":{"title":"Wallets","icon":"W","description":"Wallets from the CJ-only HUNT catalog.","query":"men wallets"},"men-socks":{"title":"Socks","icon":"S","description":"Socks from the CJ-only HUNT catalog.","query":"men socks"},"men-hoodies":{"title":"Hoodies & Sweatshirts","icon":"H","description":"Hoodies & Sweatshirts from the CJ-only HUNT catalog.","query":"men hoodies"},"men-accessories":{"title":"Men Accessories","icon":"M","description":"Men Accessories from the CJ-only HUNT catalog.","query":"men accessories"},"men-clothing":{"title":"More Men","icon":"M","description":"More Men from the CJ-only HUNT catalog.","query":"men clothing"},"kids":{"title":"Kids & Baby","icon":"K","description":"Kids & Baby products from CJ, organized into clear categories.","query":"kids"},"kids-clothing":{"title":"Kids Clothing","icon":"K","description":"Kids Clothing from the CJ-only HUNT catalog.","query":"kids clothing"},"kids-shoes":{"title":"Kids Shoes","icon":"K","description":"Kids Shoes from the CJ-only HUNT catalog.","query":"kids shoes"},"kids-accessories":{"title":"Kids Accessories","icon":"K","description":"Kids Accessories from the CJ-only HUNT catalog.","query":"kids accessories"},"baby":{"title":"Baby Essentials","icon":"B","description":"Baby Essentials from the CJ-only HUNT catalog.","query":"baby"},"baby-clothing":{"title":"Baby Clothing","icon":"B","description":"Baby Clothing from the CJ-only HUNT catalog.","query":"baby clothing"},"baby-shoes":{"title":"Baby Shoes","icon":"B","description":"Baby Shoes from the CJ-only HUNT catalog.","query":"baby shoes"},"beauty":{"title":"Beauty","icon":"B","description":"Beauty products from CJ, organized into clear categories.","query":"beauty"},"skincare":{"title":"Skincare","icon":"S","description":"Skincare from the CJ-only HUNT catalog.","query":"skincare"},"body-care":{"title":"Body Care","icon":"B","description":"Body Care from the CJ-only HUNT catalog.","query":"body care"},"makeup":{"title":"Makeup","icon":"M","description":"Makeup from the CJ-only HUNT catalog.","query":"makeup"},"nails":{"title":"Nails","icon":"N","description":"Nails from the CJ-only HUNT catalog.","query":"nails"},"hair":{"title":"Hair & Wigs","icon":"H","description":"Hair & Wigs from the CJ-only HUNT catalog.","query":"hair"},"fragrance":{"title":"Fragrance","icon":"F","description":"Fragrance from the CJ-only HUNT catalog.","query":"fragrance"},"beauty-tools":{"title":"Beauty Tools","icon":"B","description":"Beauty Tools from the CJ-only HUNT catalog.","query":"beauty tools"},"accessories":{"title":"Accessories & Jewelry","icon":"A","description":"Accessories & Jewelry products from CJ, organized into clear categories.","query":"accessories"},"jewelry-necklaces":{"title":"Necklaces","icon":"N","description":"Necklaces from the CJ-only HUNT catalog.","query":"jewelry necklaces"},"jewelry-rings":{"title":"Rings","icon":"R","description":"Rings from the CJ-only HUNT catalog.","query":"jewelry rings"},"jewelry-earrings":{"title":"Earrings","icon":"E","description":"Earrings from the CJ-only HUNT catalog.","query":"jewelry earrings"},"jewelry-bracelets":{"title":"Bracelets","icon":"B","description":"Bracelets from the CJ-only HUNT catalog.","query":"jewelry bracelets"},"jewelry":{"title":"Jewelry Sets & More","icon":"J","description":"Jewelry Sets & More from the CJ-only HUNT catalog.","query":"jewelry"},"watches":{"title":"Watches","icon":"W","description":"Watches from the CJ-only HUNT catalog.","query":"watches"},"bags":{"title":"Bags & Backpacks","icon":"B","description":"Bags & Backpacks from the CJ-only HUNT catalog.","query":"bags"},"hats":{"title":"Hats & Caps","icon":"H","description":"Hats & Caps from the CJ-only HUNT catalog.","query":"hats"},"belts":{"title":"Belts","icon":"B","description":"Belts from the CJ-only HUNT catalog.","query":"belts"},"scarves":{"title":"Scarves & Wraps","icon":"S","description":"Scarves & Wraps from the CJ-only HUNT catalog.","query":"scarves"},"keychains":{"title":"Keychains","icon":"K","description":"Keychains from the CJ-only HUNT catalog.","query":"keychains"},"gloves":{"title":"Gloves","icon":"G","description":"Gloves from the CJ-only HUNT catalog.","query":"gloves"},"hair-accessories":{"title":"Hair Accessories","icon":"H","description":"Hair Accessories from the CJ-only HUNT catalog.","query":"hair accessories"},"bag-accessories":{"title":"Bag Accessories","icon":"B","description":"Bag Accessories from the CJ-only HUNT catalog.","query":"bag accessories"},"socks":{"title":"Socks","icon":"S","description":"Socks from the CJ-only HUNT catalog.","query":"socks"},"tech":{"title":"Phone & Tech","icon":"T","description":"Phone & Tech products from CJ, organized into clear categories.","query":"tech"},"phone-cases":{"title":"Phone Cases","icon":"P","description":"Phone Cases from the CJ-only HUNT catalog.","query":"phone cases"},"chargers-cables":{"title":"Chargers & Cables","icon":"C","description":"Chargers & Cables from the CJ-only HUNT catalog.","query":"chargers cables"},"power-banks":{"title":"Power Banks","icon":"P","description":"Power Banks from the CJ-only HUNT catalog.","query":"power banks"},"stands-holders":{"title":"Stands & Holders","icon":"S","description":"Stands & Holders from the CJ-only HUNT catalog.","query":"stands holders"},"audio":{"title":"Earphones & Audio","icon":"E","description":"Earphones & Audio from the CJ-only HUNT catalog.","query":"audio"},"wearables":{"title":"Smart Watches & Wearables","icon":"S","description":"Smart Watches & Wearables from the CJ-only HUNT catalog.","query":"wearables"},"wearable-accessories":{"title":"Wearable Accessories","icon":"W","description":"Wearable Accessories from the CJ-only HUNT catalog.","query":"wearable accessories"},"smart-home":{"title":"Smart Home","icon":"S","description":"Smart Home from the CJ-only HUNT catalog.","query":"smart home"},"cameras":{"title":"Cameras","icon":"C","description":"Cameras from the CJ-only HUNT catalog.","query":"cameras"},"computer-accessories":{"title":"Computer Accessories","icon":"C","description":"Computer Accessories from the CJ-only HUNT catalog.","query":"computer accessories"},"electronics":{"title":"Useful Electronics","icon":"U","description":"Useful Electronics from the CJ-only HUNT catalog.","query":"electronics"},"gaming":{"title":"Gaming","icon":"G","description":"Gaming from the CJ-only HUNT catalog.","query":"gaming"},"home":{"title":"Home & Living","icon":"H","description":"Home & Living products from CJ, organized into clear categories.","query":"home"},"home-storage":{"title":"Storage & Organization","icon":"S","description":"Storage & Organization from the CJ-only HUNT catalog.","query":"home storage"},"kitchen":{"title":"Kitchen","icon":"K","description":"Kitchen from the CJ-only HUNT catalog.","query":"kitchen"},"lighting":{"title":"Lighting","icon":"L","description":"Lighting from the CJ-only HUNT catalog.","query":"lighting"},"bedding":{"title":"Bedding & Pillows","icon":"B","description":"Bedding & Pillows from the CJ-only HUNT catalog.","query":"bedding"},"bath":{"title":"Bath","icon":"B","description":"Bath from the CJ-only HUNT catalog.","query":"bath"},"home-decor":{"title":"Home Decor","icon":"H","description":"Home Decor from the CJ-only HUNT catalog.","query":"home decor"},"drinkware":{"title":"Drinkware","icon":"D","description":"Drinkware from the CJ-only HUNT catalog.","query":"drinkware"},"tools-diy":{"title":"Tools & DIY","icon":"T","description":"Tools & DIY from the CJ-only HUNT catalog.","query":"tools diy"},"cleaning":{"title":"Cleaning","icon":"C","description":"Cleaning from the CJ-only HUNT catalog.","query":"cleaning"},"small-appliances":{"title":"Small Appliances","icon":"S","description":"Small Appliances from the CJ-only HUNT catalog.","query":"small appliances"},"sports":{"title":"Sports & Outdoors","icon":"S","description":"Sports & Outdoors products from CJ, organized into clear categories.","query":"sports"},"fitness":{"title":"Fitness","icon":"F","description":"Fitness from the CJ-only HUNT catalog.","query":"fitness"},"outdoors":{"title":"Outdoor & Camping","icon":"O","description":"Outdoor & Camping from the CJ-only HUNT catalog.","query":"outdoors"},"active-bottoms":{"title":"Active Bottoms","icon":"A","description":"Active Bottoms from the CJ-only HUNT catalog.","query":"active bottoms"},"sports-gear":{"title":"Sports Gear","icon":"S","description":"Sports Gear from the CJ-only HUNT catalog.","query":"sports gear"},"sports-bags":{"title":"Sports Bags","icon":"S","description":"Sports Bags from the CJ-only HUNT catalog.","query":"sports bags"},"cycling":{"title":"Cycling","icon":"C","description":"Cycling from the CJ-only HUNT catalog.","query":"cycling"},"fitness-accessories":{"title":"Fitness Accessories","icon":"F","description":"Fitness Accessories from the CJ-only HUNT catalog.","query":"fitness accessories"},"pets":{"title":"Pets","icon":"P","description":"Pets products from CJ, organized into clear categories.","query":"pets"},"pet-accessories":{"title":"Pet Accessories","icon":"P","description":"Pet Accessories from the CJ-only HUNT catalog.","query":"pet accessories"},"pet-toys":{"title":"Pet Toys","icon":"P","description":"Pet Toys from the CJ-only HUNT catalog.","query":"pet toys"},"pet-grooming":{"title":"Pet Grooming","icon":"P","description":"Pet Grooming from the CJ-only HUNT catalog.","query":"pet grooming"},"pet-clothing":{"title":"Pet Clothing","icon":"P","description":"Pet Clothing from the CJ-only HUNT catalog.","query":"pet clothing"},"pet-feeding":{"title":"Pet Feeding","icon":"P","description":"Pet Feeding from the CJ-only HUNT catalog.","query":"pet feeding"},"pet-walk":{"title":"Collars, Leashes & Harnesses","icon":"C","description":"Collars, Leashes & Harnesses from the CJ-only HUNT catalog.","query":"pet walk"},"pet-beds":{"title":"Pet Beds & Mats","icon":"P","description":"Pet Beds & Mats from the CJ-only HUNT catalog.","query":"pet beds"},"aquarium":{"title":"Aquarium","icon":"A","description":"Aquarium from the CJ-only HUNT catalog.","query":"aquarium"},"toys":{"title":"Toys","icon":"T","description":"Toys from the CJ-only HUNT catalog.","query":"toys"},"plush-toys":{"title":"Plush Toys","icon":"P","description":"Plush Toys from the CJ-only HUNT catalog.","query":"plush toys"},"building-toys":{"title":"Building Toys","icon":"B","description":"Building Toys from the CJ-only HUNT catalog.","query":"building toys"},"educational-toys":{"title":"Educational Toys","icon":"E","description":"Educational Toys from the CJ-only HUNT catalog.","query":"educational toys"},"travel":{"title":"Travel","icon":"R","description":"Travel products from CJ, organized into clear categories.","query":"travel"},"luggage":{"title":"Luggage & Travel Bags","icon":"L","description":"Luggage & Travel Bags from the CJ-only HUNT catalog.","query":"luggage"},"office":{"title":"Office & Crafts","icon":"O","description":"Office & Crafts products from CJ, organized into clear categories.","query":"office"},"crafts":{"title":"Arts & Crafts","icon":"A","description":"Arts & Crafts from the CJ-only HUNT catalog.","query":"crafts"},"stationery":{"title":"Stationery","icon":"S","description":"Stationery from the CJ-only HUNT catalog.","query":"stationery"},"stickers":{"title":"Stickers","icon":"S","description":"Stickers from the CJ-only HUNT catalog.","query":"stickers"},"gifts":{"title":"Gifts & Party","icon":"G","description":"Gifts & Party products from CJ, organized into clear categories.","query":"gifts"},"party":{"title":"Party & Celebration","icon":"P","description":"Party & Celebration from the CJ-only HUNT catalog.","query":"party"}});

  const categoryGroups = [{title:"Departments",items:["women","men","kids","beauty","accessories","tech","home","sports","pets","toys","travel","office","gifts"]}];

  const departmentSubcategories = {"women":["women-dresses","women-evening","women-suits","women-tops","women-jeans","women-bottoms","women-skirts","women-knitwear","women-outerwear","women-underwear","women-sleepwear","women-swim","women-shoes","women-socks","women-wallets","women-hoodies","women-clothing"],"men":["men-tops","men-suits","men-jeans","men-bottoms","men-outerwear","men-knitwear","men-boxers","men-underwear","men-sleepwear","men-shoes","men-bags","men-wallets","men-socks","men-hoodies","men-accessories","men-clothing"],"kids":["kids-clothing","kids-shoes","kids-accessories","baby","baby-clothing","baby-shoes"],"beauty":["skincare","body-care","makeup","nails","hair","fragrance","beauty-tools"],"accessories":["jewelry-necklaces","jewelry-rings","jewelry-earrings","jewelry-bracelets","jewelry","watches","bags","hats","belts","scarves","keychains","gloves","hair-accessories","bag-accessories","socks"],"tech":["phone-cases","chargers-cables","power-banks","stands-holders","audio","wearables","wearable-accessories","smart-home","cameras","computer-accessories","electronics","gaming"],"home":["home-storage","kitchen","lighting","bedding","bath","home-decor","drinkware","tools-diy","cleaning","small-appliances"],"sports":["fitness","outdoors","active-bottoms","sports-gear","sports-bags","cycling","fitness-accessories"],"pets":["pet-accessories","pet-toys","pet-grooming","pet-clothing","pet-feeding","pet-walk","pet-beds","aquarium"],"toys":["toys","plush-toys","building-toys","educational-toys"],"travel":["luggage"],"office":["crafts","stationery","stickers"],"gifts":["party"]};
  const genderSubcategories = {women:departmentSubcategories.women||[],men:departmentSubcategories.men||[]};


  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (value, currency="USD") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    try { return new Intl.NumberFormat(document.documentElement.lang || "en", {style:"currency",currency}).format(Number(value)); }
    catch { return String(value); }
  };
  const safeQuery = query => {
    const q = String(query || "").trim().slice(0,120);
    const lower = q.toLowerCase();
    if (!q || blocked.some(term => lower.includes(term))) return "";
    return q;
  };

  function inferCategory(value) {
    const t = String(value?.title || value || "").toLowerCase();
    if (/\b(pet|dog|cat)\b/.test(t)) return "pets";
    if (/\b(toy|toys|puzzle|plush|building block|craft kit|slime)\b/.test(t)) return "toys";
    if (/\b(kids?|youth|toddler|baby|newborn)\b/.test(t)) return "kids";
    if (/(perfume|fragrance)/.test(t)) return "perfume";
    if (/\b(lipstick|lip gloss|mascara|eyeliner|eyeshadow|foundation|concealer|blush|makeup|cosmetic)\b/.test(t)) return "makeup";
    if (/\b(skincare|skin care|serum|cleanser|toner|moisturizer|moisturiser|face cream|facial cream|eye cream)\b/.test(t)) return "skincare";
    if (/(beauty|cosmetic|serum|cream)/.test(t)) return "beauty";
    if (/(jewelry|jewellery|necklace|bracelet|earring|ring)/.test(t)) return "jewelry";
    if (/\b(swim|swimsuit|bikini|swim trunks)\b/.test(t)) return "swimwear";
    if (/\b(sock|socks)\b/.test(t)) return "socks";
    if (/\b(sticker|stickers)\b/.test(t)) return "stickers";
    if (/\b(ornament|ornaments)\b/.test(t)) return "ornaments";
    if (/\b(notebook|journal|calendar)\b/.test(t)) return "stationery";
    if (/\b(desk mat|desk calendar)\b/.test(t)) return "office";
    if (/\b(pillow|pillows)\b/.test(t)) return "pillows";
    if (/\b(blanket|blankets|towel|towels)\b/.test(t)) return "blankets";
    if (/\b(poster|posters|canvas|wall art|flag|framed)\b/.test(t)) return "wallart";
    if (/\b(mug|mugs|bottle|bottles|tumbler|tumblers|cup|cups)\b/.test(t)) return "drinkware";
    if (/\b(hat|hats|cap|caps|beanie|bucket hat)\b/.test(t)) return "hats";
    if (/\b(evening|formal|prom|cocktail|party)\b/.test(t) && /\b(dress|gown)\b/.test(t)) return "eveningdresses";
    if (/\b(women|woman|female|ladies)\b/.test(t) && /\b(suit|blazer|tailored)\b/.test(t)) return "womensuits";
    if (/\b(dress|dresses|skirt|skirts)\b/.test(t)) return "dresses";
    if (/\b(jean|jeans|denim)\b/.test(t) && /\b(pants|trousers|jeans|denim)\b/.test(t)) return "jeans";
    if (/\b(thong|thongs)\b/.test(t) && /\b(women|woman|female|ladies)\b/.test(t)) return "thongs";
    if (/\b(long boxer|long-leg boxer|long leg boxer)\b/.test(t) && /\b(men|man|male)\b/.test(t)) return "longboxers";
    if (/\b(brief|briefs|low rise|low-rise)\b/.test(t) && /\b(men|man|male)\b/.test(t)) return "mensbriefs";
    if (/\b(boxer|boxers|boxer briefs?)\b/.test(t) && /\b(men|man|male)\b/.test(t)) return "boxers";
    if (/\b(bra|bralette|underwear|panties|panty|briefs|brief)\b/.test(t) && /\b(women|woman|female|ladies)\b/.test(t)) return "underwear";
    if (/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/.test(t)) return "hoodies";
    if (/\b(jacket|jackets|windbreaker|bomber|letterman)\b/.test(t)) return "jackets";
    if (/\b(athletic|performance|legging|leggings|sports bra|shorts|yoga|rash guard|joggers|track pants)\b/.test(t)) return "activewear";
    if (/(handbag|purse|crossbody|tote|backpack|\bbag\b)/.test(t)) return "bags";
    if (/(shoe|sneaker|slide|heel)/.test(t)) return "shoes";
    if (/\b(sunglasses|sun glasses|eyewear)\b/.test(t)) return "sunglasses";
    if (/\b(belt|belts)\b/.test(t)) return "belts";
    if (/(hat|cap|wallet|belt|accessor|beanie|\btag\b)/.test(t)) return "accessories";
    if (/\b(power bank|portable charger)\b/.test(t)) return "powerbanks";
    if (/\b(phone|tablet)\b.*\b(stand|holder)\b|\b(stand|holder)\b.*\b(phone|tablet)\b/.test(t)) return "phonestands";
    if (/\b(earbuds?|earphones?|bluetooth headset)\b/.test(t)) return "earbuds";
    if (/\b(charger|charging cable|usb-c cable|type-c cable|lightning cable)\b/.test(t)) return "chargers";
    if (/(phone case|mobile case|screen protector|phone stand|charging cable)/.test(t)) return "phoneaccessories";
    if (/(gaming|gamer|gamepad|controller|headset stand|mouse ?pads?)/.test(t)) return "gaming";
    if (/(storage|organizer|closet|rack|shelf)/.test(t)) return "storage";
    if (/(bedding|bed sheet|duvet|comforter|pillowcase)/.test(t)) return "bedding";
    if (/(cleaning|laundry|mop|squeegee|dust)/.test(t)) return "cleaning";
    if (/(kitchen|cookware|utensil|bakeware|lunch box|food storage)/.test(t)) return "kitchen";
    if (/(lamp|lighting|night light|desk light)/.test(t)) return "lighting";
    if (/(bathroom|bath mat|shower|soap dispenser)/.test(t)) return "bath";
    if (/(craft|sewing|knitting|crochet|painting|drawing|scrapbook|beading)/.test(t)) return "crafts";
    if (/(party|birthday|gift wrap|balloon)/.test(t)) return "party";
    if (/(sports|fitness|running|cycling|yoga)/.test(t)) return "sports";
    if (/(outdoor|camping|picnic|hiking|garden)/.test(t)) return "outdoors";
    if (/(travel|luggage|suitcase|duffle|weekender)/.test(t)) return "travel";
    if (/(home|rug|pillow|blanket|decor|coaster|poster|canvas)/.test(t)) return "home";
    if (/(phone|iphone|samsung|airpods|magsafe|tech|electronics)/.test(t)) return "tech";
    if (/\bmen(?:'s|s)?\b/.test(t)) return "men";
    if (/\bwomen(?:'s|s)?\b/.test(t)) return "women";
    if (/\b(shirt|shirts|tee|tees|t-shirt|top|tops|tank|polo)\b/.test(t)) return "tops";
    return "gifts";
  }

  function slugFromQuery(query) {
    const q = String(query || "").toLowerCase();
    if (/perfume|fragrance/.test(q)) return "perfume";
    if (/jewel|necklace|bracelet|earring|ring/.test(q)) return "jewelry";
    if (/lipstick|mascara|eyeliner|eyeshadow|foundation|concealer|blush|makeup/.test(q)) return "makeup";
    if (/skincare|skin care|serum|cleanser|toner|moisturizer|face cream/.test(q)) return "skincare";
    if (/beauty|cosmetic/.test(q)) return "beauty";
    if (/kids?|youth|toddler|baby/.test(q)) return "kids";
    if (/swimwear|swimsuit|bikini|swim trunks/.test(q)) return "swimwear";
    if (/\bsocks?\b/.test(q)) return "socks";
    if (/stickers?/.test(q)) return "stickers";
    if (/\bpets?\b|dog|cat/.test(q)) return "pets";
    if (/ornaments?/.test(q)) return "ornaments";
    if (/stationery|notebook|journal|calendar/.test(q)) return "stationery";
    if (/\boffice\b|desk mat|mouse pad/.test(q)) return "office";
    if (/pillows?/.test(q)) return "pillows";
    if (/blankets?|towels?/.test(q)) return "blankets";
    if (/wallart|wall art|poster|canvas|framed/.test(q)) return "wallart";
    if (/drinkware|mug|bottle|tumbler/.test(q)) return "drinkware";
    if (/\bhats?\b|\bcaps?\b|beanie/.test(q)) return "hats";
    if (/(evening|formal|prom|cocktail|party).*(dress|gown)|(dress|gown).*(evening|formal|prom|cocktail|party)/.test(q)) return "eveningdresses";
    if (/women.*(suit|blazer)|(suit|blazer).*women/.test(q)) return "womensuits";
    if (/dress|skirt/.test(q)) return "dresses";
    if (/jeans?|denim/.test(q)) return "jeans";
    if (/women.*thong|thong.*women/.test(q)) return "thongs";
    if (/long.*boxer|boxer.*long/.test(q)) return "longboxers";
    if (/men.*(brief|low rise)|(brief|low rise).*men/.test(q)) return "mensbriefs";
    if (/boxer|boxers/.test(q)) return "boxers";
    if (/underwear|panties|bra|bralette/.test(q)) return "underwear";
    if (/hoodie|sweatshirt/.test(q)) return "hoodies";
    if (/jacket|outerwear|windbreaker|bomber/.test(q)) return "jackets";
    if (/activewear|fitness|gym|athletic|legging|yoga|performance/.test(q)) return "activewear";
    if (/handbag|purse|crossbody|backpack|\bbag/.test(q)) return "bags";
    if (/shoe|sneaker|heel|slide/.test(q)) return "shoes";
    if (/hat|cap|wallet|belt|accessor|beanie/.test(q)) return "accessories";
    if (/phone accessories|phone case|screen protector|phone stand|charging cable/.test(q)) return "phoneaccessories";
    if (/gaming|gamepad|controller/.test(q)) return "gaming";
    if (/storage|organizer|closet|rack|shelf/.test(q)) return "storage";
    if (/bedding|bed sheet|duvet|comforter|pillowcase/.test(q)) return "bedding";
    if (/cleaning|laundry|mop|squeegee/.test(q)) return "cleaning";
    if (/kitchen|cookware|utensil|bakeware/.test(q)) return "kitchen";
    if (/lighting|lamp|night light|desk light/.test(q)) return "lighting";
    if (/bathroom|bath|shower|soap dispenser/.test(q)) return "bath";
    if (/crafts?|sewing|painting|drawing|scrapbook/.test(q)) return "crafts";
    if (/party|birthday|gift wrap|balloon/.test(q)) return "party";
    if (/toys?|puzzle|plush|building block/.test(q)) return "toys";
    if (/sports|fitness|running|cycling|yoga/.test(q)) return "sports";
    if (/outdoor|camping|picnic|hiking|garden/.test(q)) return "outdoors";
    if (/travel|luggage|duffle|weekender/.test(q)) return "travel";
    if (/home|decor|rug|pillow|blanket/.test(q)) return "home";
    if (/phone|tech|electronic|airpods|magsafe/.test(q)) return "tech";
    if (/\bmen\b|men's|mens/.test(q)) return "men";
    if (/\bwomen\b|women's|womens/.test(q)) return "women";
    if (/shirt|t-shirt|tops|tank|polo/.test(q)) return "tops";
    if (/gift/.test(q)) return "gifts";
    return "women";
  }

  const readJson = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
    catch { return fallback; }
  };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const signals = () => readJson(signalKey, {});
  function recordSignal(category, action="view") {
    const slug = categoryDefs[category] ? category : inferCategory(category);
    const weights = {search:1, category:2, view:3, like:5, cart:6, save:8, survey:12};
    const state = signals();
    state[slug] = Math.min(100, Math.max(0, Number(state[slug] || 0) + Number(weights[action] || 1)));
    writeJson(signalKey, state);
    return state[slug];
  }
  const shoppingPreferences = () => readJson(preferenceKey, {categories:[],price_band:"any",priorities:[],discovery_modes:[]});
  function saveShoppingPreferences(value, applySignals=true) {
    const safe = {
      categories:Array.isArray(value?.categories)?value.categories.filter(x=>categoryDefs[x]).slice(0,40):[],
      price_band:["any","under25","25to50","50to100","100plus"].includes(value?.price_band)?value.price_band:"any",
      priorities:Array.isArray(value?.priorities)?value.priorities.map(String).slice(0,10):[],
      discovery_modes:Array.isArray(value?.discovery_modes)?value.discovery_modes.map(String).slice(0,10):[]
    };
    writeJson(preferenceKey,safe);
    if(applySignals) safe.categories.forEach(slug=>recordSignal(slug,"survey"));
    return safe;
  }
  function personalScore(product) {
    const category = inferCategory(product);
    const preferenceBoost = shoppingPreferences().categories.includes(category) ? 20 : 0;
    return Number(signals()[category] || 0) + preferenceBoost;
  }
  function personalReason(product) {
    const category = inferCategory(product);
    const preferred = shoppingPreferences().categories.includes(category);
    const score = personalScore(product);
    if (preferred) return `Matches a shopping category you selected in your HUNT survey.`;
    return score > 0 ? `Matches your recent ${categoryDefs[category]?.title || category} activity on this device.` : "BOOM is still learning from your views, likes, saves and shopping survey.";
  }

  const cart = () => {
    const rows = readJson(cartKey, []);
    return (Array.isArray(rows) ? rows : []).map(item => {
      const verified = item?.retail_price_verified === true && item?.price_basis === "HUNT_RETAIL_PROFIT_GATE";
      const amount = verified && Number.isFinite(Number(item?.price_amount)) && Number(item.price_amount) > 0
        ? Number(item.price_amount)
        : null;
      return {
        ...item,
        price_amount: amount,
        price_basis: amount !== null ? "HUNT_RETAIL_PROFIT_GATE" : "PRICE_PENDING",
        retail_price_verified: amount !== null,
        qty: Math.max(1, Math.min(5, Number(item?.qty) || 1))
      };
    });
  };
  const saveCart = value => writeJson(cartKey, Array.isArray(value) ? value : []);
  function addCart(product, variant=null, qty=1) {
    const items = cart();
    const variantId = String(variant?.variant_id || "base");
    const key = `${product.provider}:${product.item_id}:${variantId}`;
    const existing = items.find(x => x.key === key);
    const retailVerified = (variant?.retail_price_verified ?? product.retail_price_verified) === true;
    const profitGate = String(variant?.profit_gate_status ?? product.profit_gate_status ?? "").toUpperCase();
    const retailRaw = variant?.retail_price_amount ?? product.retail_price_amount ?? null;
    const retailAmount = retailVerified && profitGate === "PASS" && Number.isFinite(Number(retailRaw)) && Number(retailRaw) > 0
      ? Number(retailRaw)
      : null;
    const row = {
      key,
      provider: String(product.provider || ""),
      item_id: String(product.item_id || ""),
      variant_id: variantId === "base" ? null : variantId,
      variant_label: [variant?.color, variant?.size].filter(Boolean).join(" / ") || null,
      title: String(product.title || "Product"),
      image_url: String(variant?.image_url || product.image_url || "") || null,
      price_amount: retailAmount,
      currency: String(variant?.retail_currency || product.retail_currency || "USD"),
      price_basis: retailAmount !== null ? "HUNT_RETAIL_PROFIT_GATE" : "PRICE_PENDING",
      retail_price_verified: retailAmount !== null,
      profit_gate_status: profitGate || null,
      qty: Math.max(1, Math.min(5, Number(qty) || 1))
    };
    if (existing) {
      const nextQty = Math.min(5, Number(existing.qty || 1) + row.qty);
      Object.assign(existing, row, {qty:nextQty});
    } else items.push(row);
    saveCart(items);
    recordSignal(product, "cart");
    window.HuntAnalytics?.addToCart(row, product);
    return items;
  }
  function cartCount() { return cart().reduce((sum,x)=>sum+Math.max(1,Number(x.qty)||1),0); }
  function updateCartBadges() { document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=String(cartCount())); }

  async function storefront(params={}) {
    const url = new URL(functionsBase + "/hunt-storefront");
    Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!==null && v!=="") url.searchParams.set(k,String(v)); });
    const res = await fetch(url,{cache:"no-store",headers:{apikey:publishableKey}});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Storefront unavailable");
    return data;
  }
  async function search(query, limit=20) {
    const clean = safeQuery(query);
    if (!clean) throw new Error("This search is not available.");
    recordSignal(slugFromQuery(clean), "search");
    const res = await fetch(functionsBase + "/hunt-deals-hunt", {
      method:"POST",
      headers:{apikey:publishableKey,"Content-Type":"application/json"},
      body:JSON.stringify({query:clean,limit:Math.max(1,Math.min(24,Number(limit)||20))})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Live search unavailable");
    window.HuntAnalytics?.search({
      category: slugFromQuery(clean),
      resultCount: Array.isArray(data.results) ? data.results.length : 0
    });
    return data;
  }

  const productUrl = product => `product.html?provider=${encodeURIComponent(product?.provider || "CJdropshipping")}&id=${encodeURIComponent(product?.item_id || "")}`;
  const categoryUrl = slug => `category.html?c=${encodeURIComponent(categoryDefs[slug] ? slug : "women")}`;

  window.HuntCore = {
    functionsBase,publishableKey,cartKey,signalKey,preferenceKey,categoryDefs,categoryGroups,departmentSubcategories,genderSubcategories,esc,money,safeQuery,
    inferCategory,slugFromQuery,recordSignal,personalScore,personalReason,signals,shoppingPreferences,saveShoppingPreferences,
    cart,saveCart,addCart,cartCount,updateCartBadges,storefront,search,productUrl,categoryUrl
  };
})();
