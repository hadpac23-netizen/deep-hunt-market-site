(() => {
  const RTL=new Set(["he","ar"]);
  const supported=new Set(["en","he","ar","es","fr","ja","zh"]);

  const EN={
    heroKicker:"YOUR WORLD · YOUR HUNT",heroTitle1:"Find what",heroTitle2:"fits you.",
    heroCopy:"Fashion, beauty, home, tech and more — reshaped around what you actually explore.",
    search:"Search products, styles, brands or ideas…",
    women:"Women",accessories:"Accessories",beauty:"Beauty",men:"Men",kids:"Kids",home:"Home",tech:"Tech",sports:"Sports",shoes:"Shoes",
    shop:"Shop",aiFind:"AI Find",categories:"Categories",forYou:"For You",saved:"Saved",cart:"Cart",signIn:"Sign in",account:"Account",
    allCategories:"All categories",continueShopping:"Continue shopping",preferences:"Preferences",likes:"Likes",ordersShipping:"Orders & shipping",
    promoLifestyle:"BOOM LIFESTYLE",promoForYou:"FOR YOU",promoFresh:"VERIFIED NEW",promoSelects:"HUNT SELECTS",
    promoPersonal:"Picked from what you explore and choose in HUNT.",promoCatalog:"A real connected-catalog find for this HUNT moment.",
    promoBeauty:"Beauty selected from the connected catalog.",promoTech:"Useful tech selected from the connected catalog.",promoHome:"A home find selected from the connected catalog.",
    verifyPrice:"Open product to verify price",maybe:"Maybe for you",explore:"Explore HUNT",sceneNext:"Show next HUNT night world",
    discover:["Discover your HUNT","More for you below","Scroll into your world"],
    lifestyleIntro:"Personalized discovery begins here as you scroll. Real catalog products only.",
    womenKicker:"WOMEN · HUNT EDIT",womenTitle:"Start with style.",womenCopy:"Dresses, tops, shoes and everyday fashion pulled directly from the live catalog.",shopWomen:"Shop Women →",
    accessoriesTitle:"Finish the look.",beautyTitle:"Beauty, without the noise.",
    forYouKicker:"BOOM FOR YOU",forYouTitle:"HUNT changes as you browse.",forYouCopy:"A balanced mix while HUNT learns what you open, like and save.",
    buildKicker:"BOOM DEAL BUILDER",buildTitle:"One item can become a whole look.",buildCopy:"Start with one item. BOOM can connect complementary products around it. Discounts stay locked until stock, shipping and Profit Gate are verified.",buildCta:"Start exploring →",
    freshKicker:"FRESH CATALOG",freshTitle:"Fresh in HUNT.",freshCopy:"Real catalog arrivals and rotating discovery — no fake popularity labels.",keepExploring:"Keep exploring ↓",
    endlessKicker:"ENDLESS DISCOVERY",endlessHomeTitle:"Keep hunting.",endlessHomeCopy:"A mixed feed across the connected catalog. More products load as you move.",remix:"Remix",
    verifiedOpps:"VERIFIED OPPORTUNITIES",smartPicks:"Smart Deal Picks",smartPicksCopy:"Only qualified candidates appear here. Empty is better than fabricated.",noDealsTitle:"No qualified live deals yet.",noDealsCopy:"The engine is ready. Real products appear only after a provider feed and commerce path are verified.",
    productCueTop:"YOUR HUNT CONTINUES",productCue:"Discover more for you",productPulse:"Maybe interesting for you",productPulseCta:"Discover ↓",
    endlessTitle:"Keep discovering",endlessCopy:"HUNT opens more relevant products as you scroll.",
    tuneKicker:"TUNE YOUR HUNT",tuneTitle:"Choose what you want to see more of.",tuneCopy:"These choices travel with your HUNT account. Browsing, likes and saves can refine them over time.",tuneLocal:"Saved on this device until you sign in.",resetInterests:"Reset interests",
    profileLikes:"Your likes",profileSaved:"Your saved products",likedProducts:"LIKED PRODUCTS",savedLater:"SAVED FOR LATER",orderTracking:"ORDER TRACKING",signOut:"Sign out",
    shopCategory:"SHOP CATEGORY",forYouRanking:"For You ranking",learningDevice:"Learning from your HUNT activity.",sort:"Sort",relevance:"Relevance",priceLow:"Price: Low",priceHigh:"Price: High",min:"Min",max:"Max",apply:"Apply",shopByCategory:"SHOP BY CATEGORY",dealTruth:"Deal truth",loadMore:"Load more products",noLiveCategory:"No live product feed in this category yet.",supplierNetwork:"Supplier network →",
    searchKicker:"HUNT AI FIND",searchTitle:"Describe what you want.",searchCopy:"Search naturally. HUNT turns your request into category, style, color and budget filters.",find:"Find",readySearch:"Ready to search",searchTruth:"No profile guessing. Results come from the current connected HUNT catalog.",missionKicker:"BOOM MISSION SHOPPING",missionSet:"Your mission set",rebuild:"Rebuild",estimatedTotal:"Estimated product total",shippingRecheck:"Shipping, stock and final price are rechecked before checkout.",searchBegin:"Search to begin.",
    preLaunch:"PRE-LAUNCH",checkoutPreview:"Checkout preview",checkoutCopy:"This flow uses real connected catalog products. Payment remains disabled until retail, fulfillment and payment activation are approved.",yourCart:"YOUR CART",orderItems:"Order items",clearCart:"Clear cart",cartEmpty:"Your cart is empty.",browseProducts:"Browse live products",orderSummary:"ORDER SUMMARY",verifiedSubtotal:"Verified HUNT retail subtotal",priceVerification:"Price verification",perItem:"PER ITEM",shipping:"Shipping",pending:"PENDING",bundleOffer:"BOOM bundle offer",taxesDuties:"Taxes / duties",verifiedTotal:"Verified pre-tax total",destinationCountry:"Destination country",shippingDetails:"Shipping details",fullName:"Full name",email:"Email",address:"Address",address2:"Address line 2",city:"City",region:"Province / region",postal:"Postal code",phone:"Phone",verifyShipping:"Verify price & shipping",bundleCheck:"BOOM bundle check",shippingChess:"BOOM Shipping Chess",paymentPending:"Payment activation pending",checkoutTruth:"No card data is collected here. Verify price and shipping first; payment stays disabled until authorized.",
    accountPersonalization:"ACCOUNT & PERSONALIZATION",oneAccount:"ONE ACCOUNT · SMARTER HUNT",authTitle:"Your HUNT account.",authCopy:"Sign in so your chosen interests, likes, saves and HUNT personalization can continue across devices.",authForYou:"For You",authForYouCopy:"Personal category ranking",authCart:"Cart",authCartCopy:"Keep your selected products",truthFirst:"Truth first",truthCopy:"No fake discounts or fake popularity",signInCreate:"SIGN IN / CREATE ACCOUNT",continueAccount:"Continue with your account",emailAddress:"Email address",sendMagic:"Send secure magic link →",or:"or",checking:"Checking…",authNote:"Social providers activate only after their official OAuth configuration is complete.",signedIn:"SIGNED IN",boomPersonalization:"BOOM personalization",syncedAccount:"SYNCED HUNT ACCOUNT",
    privacy:"Privacy",terms:"Terms",returns:"Returns & Cancellation",withdrawal:"Withdrawal / Return request",partners:"Partners",deals:"Deals",priceLens:"Price Lens"
  };

  const OV={
    he:{
      heroKicker:"העולם שלך · ה-HUNT שלך",heroTitle1:"מצא מה",heroTitle2:"מתאים לך.",heroCopy:"אופנה, ביוטי, בית, טכנולוגיה ועוד — משתנים לפי מה שבאמת מעניין אותך.",search:"חפש מוצרים, סגנונות, מותגים או רעיונות…",
      women:"נשים",accessories:"אקססוריז",beauty:"ביוטי",men:"גברים",kids:"ילדים",home:"בית",tech:"טכנולוגיה",sports:"ספורט",shoes:"נעליים",shop:"קניות",aiFind:"חיפוש AI",categories:"קטגוריות",forYou:"בשבילך",saved:"שמורים",cart:"עגלה",signIn:"התחברות",account:"חשבון",allCategories:"כל הקטגוריות",continueShopping:"המשך לקנות",preferences:"העדפות",likes:"לייקים",ordersShipping:"הזמנות ומשלוחים",
      promoLifestyle:"BOOM LIFESTYLE",promoForYou:"בשבילך",promoFresh:"חדש מאומת",promoSelects:"HUNT בוחר",promoPersonal:"נבחר לפי מה שבחרת וגילית ב-HUNT.",promoCatalog:"מוצר אמיתי מהקטלוג המחובר לרגע הזה ב-HUNT.",promoBeauty:"בחירת ביוטי מהקטלוג המחובר.",promoTech:"טכנולוגיה שימושית מהקטלוג המחובר.",promoHome:"בחירת בית מהקטלוג המחובר.",verifyPrice:"פתח מוצר לבדיקת מחיר",maybe:"אולי יעניין אותך",explore:"גלה ב-HUNT",sceneNext:"הצג עיר לילה הבאה",
      discover:["גלה את ה-HUNT שלך","יש עוד בשבילך למטה","גלול לעולם שלך"],lifestyleIntro:"הגילוי האישי מתחיל כשגוללים. רק מוצרים אמיתיים מהקטלוג.",
      womenKicker:"נשים · HUNT EDIT",womenTitle:"מתחילים בסטייל.",womenCopy:"שמלות, חולצות, נעליים ואופנה יומיומית ישירות מהקטלוג החי.",shopWomen:"קניות לנשים →",accessoriesTitle:"משלימים את הלוק.",beautyTitle:"ביוטי בלי הרעש.",forYouKicker:"BOOM בשבילך",forYouTitle:"HUNT משתנה תוך כדי גלישה.",forYouCopy:"מיקס מאוזן בזמן ש-HUNT לומד ממה שאתה פותח, אוהב ושומר.",
      buildKicker:"BOOM DEAL BUILDER",buildTitle:"מוצר אחד יכול להפוך ללוק שלם.",buildCopy:"מתחילים בפריט אחד. BOOM מחבר סביבו מוצרים משלימים. הנחות נשארות נעולות עד אימות מלאי, שילוח ו-Profit Gate.",buildCta:"התחל לגלות →",freshKicker:"קטלוג חדש",freshTitle:"חדש ב-HUNT.",freshCopy:"מוצרים אמיתיים וגילוי מתחלף — בלי תוויות פופולריות מזויפות.",keepExploring:"המשך לגלות ↓",endlessKicker:"גילוי ללא סוף",endlessHomeTitle:"ממשיכים לצוד.",endlessHomeCopy:"פיד מעורב מהקטלוג המחובר. עוד מוצרים נטענים תוך כדי.",remix:"ערבב",
      verifiedOpps:"הזדמנויות מאומתות",smartPicks:"בחירות חכמות",smartPicksCopy:"רק מועמדים שעברו בדיקה מופיעים כאן.",noDealsTitle:"אין כרגע דילים חיים שעברו אימות.",noDealsCopy:"המנוע מוכן. מוצרים מופיעים רק אחרי חיבור מקור ומסלול מסחרי מאומת.",
      productCueTop:"ה-HUNT שלך ממשיך",productCue:"גלה עוד בשבילך",productPulse:"אולי זה יעניין אותך",productPulseCta:"גלה ↓",endlessTitle:"ממשיכים לגלות",endlessCopy:"HUNT פותח עוד מוצרים רלוונטיים ככל שגוללים.",
      tuneKicker:"כוון את ה-HUNT שלך",tuneTitle:"בחר מה תרצה לראות יותר.",tuneCopy:"הבחירות נשמרות בחשבון HUNT וממשיכות איתך בין מכשירים. גלישה, לייקים ושמירות יכולים לדייק אותן.",tuneLocal:"נשמר במכשיר עד שתתחבר.",resetInterests:"אפס תחומי עניין",profileLikes:"הלייקים שלך",profileSaved:"המוצרים ששמרת",likedProducts:"מוצרים שאהבת",savedLater:"נשמר לאחר כך",orderTracking:"מעקב הזמנות",signOut:"התנתק",
      shopCategory:"קטגוריה",forYouRanking:"דירוג בשבילך",learningDevice:"לומד מפעילות HUNT שלך.",sort:"מיון",relevance:"רלוונטיות",priceLow:"מחיר: נמוך",priceHigh:"מחיר: גבוה",min:"מינימום",max:"מקסימום",apply:"החל",shopByCategory:"קנה לפי קטגוריה",dealTruth:"אמת מסחרית",loadMore:"טען עוד מוצרים",noLiveCategory:"אין עדיין פיד חי בקטגוריה הזו.",supplierNetwork:"רשת ספקים →",
      searchKicker:"HUNT AI FIND",searchTitle:"תאר מה אתה רוצה.",searchCopy:"חפש בצורה טבעית. HUNT הופך את הבקשה לקטגוריה, סטייל, צבע ותקציב.",find:"חפש",readySearch:"מוכן לחיפוש",searchTruth:"בלי ניחוש פרופיל. התוצאות מגיעות מהקטלוג המחובר של HUNT.",missionKicker:"BOOM MISSION SHOPPING",missionSet:"המשימה שלך",rebuild:"בנה מחדש",estimatedTotal:"סך מוצרים משוער",shippingRecheck:"שילוח, מלאי ומחיר סופי נבדקים שוב לפני checkout.",searchBegin:"התחל בחיפוש.",
      preLaunch:"טרום השקה",checkoutPreview:"תצוגת Checkout",checkoutCopy:"המסלול משתמש במוצרים אמיתיים. תשלום נשאר כבוי עד אישור מחיר, אספקה והפעלת סליקה.",yourCart:"העגלה שלך",orderItems:"פריטי ההזמנה",clearCart:"נקה עגלה",cartEmpty:"העגלה ריקה.",browseProducts:"עיין במוצרים",orderSummary:"סיכום הזמנה",verifiedSubtotal:"סכום ביניים מאומת",priceVerification:"אימות מחיר",perItem:"לכל פריט",shipping:"שילוח",pending:"ממתין",bundleOffer:"הצעת BOOM",taxesDuties:"מסים ומכס",verifiedTotal:"סה״כ מאומת לפני מס",destinationCountry:"מדינת יעד",shippingDetails:"פרטי שילוח",fullName:"שם מלא",email:"אימייל",address:"כתובת",address2:"שורת כתובת 2",city:"עיר",region:"מחוז / אזור",postal:"מיקוד",phone:"טלפון",verifyShipping:"אמת מחיר ושילוח",bundleCheck:"בדיקת BOOM bundle",shippingChess:"BOOM Shipping Chess",paymentPending:"הפעלת תשלום ממתינה",checkoutTruth:"לא נאספים כאן פרטי כרטיס. קודם מאמתים מחיר ושילוח; התשלום נשאר כבוי עד אישור.",
      accountPersonalization:"חשבון והתאמה אישית",oneAccount:"חשבון אחד · HUNT חכם יותר",authTitle:"חשבון HUNT שלך.",authCopy:"התחבר כדי שהעדפות, לייקים, שמירות והתאמה אישית ימשיכו איתך בין מכשירים.",authForYou:"בשבילך",authForYouCopy:"דירוג קטגוריות אישי",authCart:"עגלה",authCartCopy:"שמור את המוצרים שבחרת",truthFirst:"אמת קודם",truthCopy:"בלי הנחות או פופולריות מזויפות",signInCreate:"התחברות / יצירת חשבון",continueAccount:"המשך עם החשבון שלך",emailAddress:"כתובת אימייל",sendMagic:"שלח קישור התחברות מאובטח →",or:"או",checking:"בודק…",authNote:"ספקי Social יופעלו רק אחרי השלמת OAuth רשמית.",signedIn:"מחובר",boomPersonalization:"התאמה אישית של BOOM",syncedAccount:"חשבון HUNT מסונכרן",
      privacy:"פרטיות",terms:"תנאים",returns:"החזרות וביטול",withdrawal:"בקשת החזרה",partners:"שותפים",deals:"דילים",priceLens:"מחירים"
    },
    ar:{
      heroKicker:"عالمك · HUNT تبعك",heroTitle1:"اكتشف ما",heroTitle2:"يناسبك.",heroCopy:"موضة وبيوتي وبيت وتقنية وأكثر — تتغيّر حسب اهتماماتك الحقيقية.",search:"ابحث عن منتجات أو ستايل أو ماركات أو أفكار…",
      women:"نساء",accessories:"إكسسوارات",beauty:"بيوتي",men:"رجال",kids:"أطفال",home:"بيت",tech:"تقنية",sports:"رياضة",shoes:"أحذية",shop:"تسوّق",aiFind:"بحث AI",categories:"أقسام",forYou:"إلك",saved:"محفوظ",cart:"السلة",signIn:"دخول",account:"الحساب",allCategories:"كل الأقسام",continueShopping:"كمّل تسوق",preferences:"اهتمامات",likes:"إعجابات",ordersShipping:"طلبات وشحن",
      promoLifestyle:"BOOM LIFESTYLE",promoForYou:"إلك",promoFresh:"جديد موثّق",promoSelects:"اختيارات HUNT",promoPersonal:"اختيار حسب الأشياء اللي اخترتها واستكشفتها في HUNT.",promoCatalog:"منتج حقيقي من الكتالوج المتصل.",promoBeauty:"اختيار بيوتي من الكتالوج.",promoTech:"تقنية مفيدة من الكتالوج.",promoHome:"اختيار للبيت من الكتالوج.",verifyPrice:"افتح المنتج لفحص السعر",maybe:"يمكن يعجبك",explore:"اكتشف HUNT",sceneNext:"اعرض مدينة الليل التالية",
      discover:["اكتشف HUNT تبعك","في المزيد إلك تحت","انزل لعالمك"],lifestyleIntro:"الاكتشاف الشخصي يبدأ لما تنزل. فقط منتجات حقيقية من الكتالوج.",
      womenKicker:"نساء · HUNT EDIT",womenTitle:"ابدأ بالستايل.",womenCopy:"فساتين وتوبات وأحذية وموضة يومية من الكتالوج الحي.",shopWomen:"تسوّق نسائي →",accessoriesTitle:"كمّل اللوك.",beautyTitle:"بيوتي بدون ضجيج.",forYouKicker:"BOOM إلك",forYouTitle:"HUNT يتغيّر وأنت تتصفح.",forYouCopy:"مزيج متوازن بينما HUNT يتعلم من الأشياء اللي تفتحها وتحفظها.",
      buildKicker:"BOOM DEAL BUILDER",buildTitle:"قطعة واحدة ممكن تصير لوك كامل.",buildCopy:"ابدأ بقطعة، وBOOM يربط منتجات مكملة حولها. أي خصم يبقى مقفول لحد التحقق.",buildCta:"ابدأ الاكتشاف →",freshKicker:"كتالوج جديد",freshTitle:"جديد في HUNT.",freshCopy:"منتجات حقيقية واكتشاف متجدد بدون شعبية مزيفة.",keepExploring:"كمّل اكتشاف ↓",endlessKicker:"اكتشاف مستمر",endlessHomeTitle:"كمّل HUNT.",endlessHomeCopy:"فيد متنوع من الكتالوج المتصل، ومنتجات أكثر تظهر مع النزول.",remix:"غيّر المزيج",
      verifiedOpps:"فرص موثّقة",smartPicks:"اختيارات ذكية",smartPicksCopy:"فقط المنتجات المؤهلة تظهر هنا.",noDealsTitle:"ما في صفقات حيّة مؤهلة حاليًا.",noDealsCopy:"المحرك جاهز، والمنتجات تظهر فقط بعد التحقق من المصدر.",
      productCueTop:"HUNT تبعك مستمر",productCue:"اكتشف المزيد إلك",productPulse:"يمكن هذا يعجبك",productPulseCta:"اكتشف ↓",endlessTitle:"كمّل اكتشاف",endlessCopy:"HUNT يفتح منتجات أقرب لاهتماماتك كلما نزلت.",
      tuneKicker:"ظبط HUNT تبعك",tuneTitle:"اختار شو بتحب تشوف أكثر.",tuneCopy:"اختياراتك بتكمل مع حساب HUNT بين الأجهزة، والتصفح والحفظ بيدققوها.",tuneLocal:"محفوظ على هذا الجهاز لحد ما تسجل دخول.",resetInterests:"امسح الاهتمامات",profileLikes:"إعجاباتك",profileSaved:"محفوظاتك",likedProducts:"منتجات أعجبتك",savedLater:"محفوظ لبعدين",orderTracking:"تتبع الطلبات",signOut:"خروج",
      shopCategory:"قسم التسوق",forYouRanking:"ترتيب إلك",learningDevice:"يتعلم من نشاط HUNT تبعك.",sort:"ترتيب",relevance:"الأكثر صلة",priceLow:"السعر: الأقل",priceHigh:"السعر: الأعلى",min:"أقل",max:"أعلى",apply:"تطبيق",shopByCategory:"تسوّق حسب القسم",dealTruth:"وضوح السعر",loadMore:"حمّل منتجات أكثر",noLiveCategory:"ما في فيد حي لهذا القسم حاليًا.",supplierNetwork:"شبكة الموردين →",
      searchKicker:"HUNT AI FIND",searchTitle:"احكي شو بدك.",searchCopy:"ابحث بطريقتك. HUNT يحول الطلب لقسم وستايل ولون وميزانية.",find:"ابحث",readySearch:"جاهز للبحث",searchTruth:"بدون تخمين شخصي. النتائج من كتالوج HUNT المتصل.",missionKicker:"BOOM MISSION SHOPPING",missionSet:"مهمتك",rebuild:"إعادة بناء",estimatedTotal:"مجموع المنتجات المتوقع",shippingRecheck:"الشحن والمخزون والسعر النهائي ينفحصوا قبل الدفع.",searchBegin:"ابدأ البحث.",
      preLaunch:"قبل الإطلاق",checkoutPreview:"معاينة الدفع",checkoutCopy:"المسار يستخدم منتجات حقيقية. الدفع يبقى مغلقًا حتى اعتماد السعر والتنفيذ والدفع.",yourCart:"سلتك",orderItems:"عناصر الطلب",clearCart:"افرغ السلة",cartEmpty:"السلة فاضية.",browseProducts:"تصفح المنتجات",orderSummary:"ملخص الطلب",verifiedSubtotal:"المجموع الموثّق",priceVerification:"فحص السعر",perItem:"لكل قطعة",shipping:"الشحن",pending:"قيد الانتظار",bundleOffer:"عرض BOOM",taxesDuties:"ضرائب ورسوم",verifiedTotal:"المجموع الموثّق قبل الضريبة",destinationCountry:"بلد الوجهة",shippingDetails:"تفاصيل الشحن",fullName:"الاسم الكامل",email:"إيميل",address:"العنوان",address2:"سطر عنوان 2",city:"المدينة",region:"المنطقة",postal:"الرمز البريدي",phone:"الهاتف",verifyShipping:"تحقق من السعر والشحن",bundleCheck:"فحص BOOM bundle",shippingChess:"BOOM Shipping Chess",paymentPending:"تفعيل الدفع بانتظار الاعتماد",checkoutTruth:"ما بناخد بيانات بطاقة هون. أولًا نتحقق من السعر والشحن، والدفع يظل مغلقًا حتى الاعتماد.",
      accountPersonalization:"الحساب والتخصيص",oneAccount:"حساب واحد · HUNT أذكى",authTitle:"حساب HUNT تبعك.",authCopy:"سجل دخول حتى اهتماماتك وإعجاباتك ومحفوظاتك تكمل معك بين الأجهزة.",authForYou:"إلك",authForYouCopy:"ترتيب أقسام شخصي",authCart:"السلة",authCartCopy:"احفظ المنتجات اللي اخترتها",truthFirst:"الحقيقة أولًا",truthCopy:"بدون خصومات أو شعبية مزيفة",signInCreate:"دخول / إنشاء حساب",continueAccount:"كمّل بحسابك",emailAddress:"البريد الإلكتروني",sendMagic:"أرسل رابط دخول آمن →",or:"أو",checking:"جاري الفحص…",authNote:"مزودي Social يشتغلوا فقط بعد إعداد OAuth الرسمي.",signedIn:"مسجل دخول",boomPersonalization:"تخصيص BOOM",syncedAccount:"حساب HUNT متزامن",
      privacy:"خصوصية",terms:"شروط",returns:"إرجاع وإلغاء",withdrawal:"طلب إرجاع",partners:"شركاء",deals:"صفقات",priceLens:"أسعار"
    },
    es:{
      heroKicker:"TU MUNDO · TU HUNT",heroTitle1:"Encuentra lo que",heroTitle2:"va contigo.",heroCopy:"Moda, belleza, hogar, tecnología y más — adaptado a tus intereses reales.",search:"Busca productos, estilos, marcas o ideas…",
      women:"Mujer",accessories:"Accesorios",beauty:"Belleza",men:"Hombre",kids:"Niños",home:"Hogar",tech:"Tecnología",sports:"Deporte",shoes:"Calzado",shop:"Comprar",aiFind:"Buscar con AI",categories:"Categorías",forYou:"Para ti",saved:"Guardado",cart:"Carrito",signIn:"Entrar",account:"Cuenta",allCategories:"Todas las categorías",continueShopping:"Seguir comprando",preferences:"Preferencias",likes:"Me gusta",ordersShipping:"Pedidos y envíos",
      promoLifestyle:"BOOM LIFESTYLE",promoForYou:"PARA TI",promoFresh:"NUEVO VERIFICADO",promoSelects:"HUNT SELECCIONA",promoPersonal:"Elegido según lo que exploras y seleccionas en HUNT.",promoCatalog:"Un producto real del catálogo conectado.",promoBeauty:"Belleza seleccionada del catálogo conectado.",promoTech:"Tecnología útil del catálogo conectado.",promoHome:"Una selección para el hogar.",verifyPrice:"Abre el producto para verificar el precio",maybe:"Quizá te interese",explore:"Explorar HUNT",sceneNext:"Mostrar la siguiente ciudad nocturna",
      discover:["Descubre tu HUNT","Hay más para ti abajo","Entra en tu mundo"],lifestyleIntro:"El descubrimiento personalizado empieza al desplazarte. Solo productos reales.",
      womenKicker:"MUJER · HUNT EDIT",womenTitle:"Empieza con estilo.",womenCopy:"Vestidos, tops, calzado y moda diaria desde el catálogo activo.",shopWomen:"Comprar mujer →",accessoriesTitle:"Completa el look.",beautyTitle:"Belleza sin ruido.",forYouKicker:"BOOM PARA TI",forYouTitle:"HUNT cambia mientras exploras.",forYouCopy:"Una mezcla equilibrada mientras HUNT aprende de lo que visitas, te gusta y guardas.",
      buildKicker:"BOOM DEAL BUILDER",buildTitle:"Una pieza puede convertirse en un look completo.",buildCopy:"Empieza con una pieza y BOOM conecta productos complementarios. Los descuentos permanecen bloqueados hasta verificarse.",buildCta:"Empezar a explorar →",freshKicker:"CATÁLOGO NUEVO",freshTitle:"Nuevo en HUNT.",freshCopy:"Productos reales y descubrimiento rotativo, sin etiquetas falsas.",keepExploring:"Seguir explorando ↓",endlessKicker:"DESCUBRIMIENTO SIN FIN",endlessHomeTitle:"Sigue buscando.",endlessHomeCopy:"Un feed mixto del catálogo conectado. Aparecen más productos al avanzar.",remix:"Mezclar",
      productCueTop:"TU HUNT CONTINÚA",productCue:"Descubre más para ti",productPulse:"Quizá te interese",productPulseCta:"Descubrir ↓",endlessTitle:"Sigue descubriendo",endlessCopy:"HUNT abre más productos relevantes mientras exploras.",
      tuneKicker:"AJUSTA TU HUNT",tuneTitle:"Elige lo que quieres ver más.",tuneCopy:"Tus elecciones viajan con tu cuenta HUNT entre dispositivos.",tuneLocal:"Guardado en este dispositivo hasta que inicies sesión.",resetInterests:"Restablecer intereses",
      shopCategory:"CATEGORÍA",forYouRanking:"Orden para ti",sort:"Ordenar",relevance:"Relevancia",priceLow:"Precio: menor",priceHigh:"Precio: mayor",min:"Mín.",max:"Máx.",apply:"Aplicar",shopByCategory:"COMPRAR POR CATEGORÍA",loadMore:"Cargar más productos",noLiveCategory:"Aún no hay un feed activo en esta categoría.",supplierNetwork:"Red de proveedores →",
      searchKicker:"HUNT AI FIND",searchTitle:"Describe lo que quieres.",searchCopy:"Busca de forma natural. HUNT convierte tu petición en categoría, estilo, color y presupuesto.",find:"Buscar",readySearch:"Listo para buscar",searchTruth:"Sin adivinar perfiles. Los resultados vienen del catálogo conectado.",rebuild:"Reconstruir",estimatedTotal:"Total estimado",shippingRecheck:"Envío, stock y precio final se revisan antes del checkout.",searchBegin:"Busca para empezar.",
      preLaunch:"PRELANZAMIENTO",checkoutPreview:"Vista previa del checkout",yourCart:"TU CARRITO",orderItems:"Artículos",clearCart:"Vaciar carrito",cartEmpty:"Tu carrito está vacío.",browseProducts:"Ver productos",orderSummary:"RESUMEN",shipping:"Envío",pending:"PENDIENTE",destinationCountry:"País de destino",shippingDetails:"Datos de envío",fullName:"Nombre completo",email:"Email",address:"Dirección",city:"Ciudad",region:"Región",postal:"Código postal",phone:"Teléfono",verifyShipping:"Verificar precio y envío",paymentPending:"Activación de pago pendiente",
      accountPersonalization:"CUENTA Y PERSONALIZACIÓN",oneAccount:"UNA CUENTA · HUNT MÁS INTELIGENTE",authTitle:"Tu cuenta HUNT.",authCopy:"Inicia sesión para llevar tus intereses, likes y guardados entre dispositivos.",signInCreate:"ENTRAR / CREAR CUENTA",continueAccount:"Continuar con tu cuenta",emailAddress:"Correo",sendMagic:"Enviar enlace seguro →",or:"o",checking:"Comprobando…",signedIn:"CONECTADO",boomPersonalization:"Personalización BOOM",syncedAccount:"CUENTA HUNT SINCRONIZADA",signOut:"Cerrar sesión"
    },
    fr:{
      heroKicker:"VOTRE MONDE · VOTRE HUNT",heroTitle1:"Trouvez ce qui",heroTitle2:"vous correspond.",heroCopy:"Mode, beauté, maison, tech et plus — adaptés à vos vrais centres d’intérêt.",search:"Recherchez produits, styles, marques ou idées…",
      women:"Femme",accessories:"Accessoires",beauty:"Beauté",men:"Homme",kids:"Enfants",home:"Maison",tech:"Tech",sports:"Sport",shoes:"Chaussures",shop:"Boutique",aiFind:"Recherche AI",categories:"Catégories",forYou:"Pour vous",saved:"Enregistré",cart:"Panier",signIn:"Connexion",account:"Compte",allCategories:"Toutes les catégories",continueShopping:"Continuer les achats",preferences:"Préférences",likes:"J’aime",ordersShipping:"Commandes et livraison",
      promoLifestyle:"BOOM LIFESTYLE",promoForYou:"POUR VOUS",promoFresh:"NOUVEAU VÉRIFIÉ",promoSelects:"SÉLECTION HUNT",promoPersonal:"Choisi selon ce que vous explorez et sélectionnez dans HUNT.",promoCatalog:"Un produit réel du catalogue connecté.",promoBeauty:"Beauté issue du catalogue connecté.",promoTech:"Tech utile issue du catalogue connecté.",promoHome:"Une sélection maison du catalogue.",verifyPrice:"Ouvrez le produit pour vérifier le prix",maybe:"Peut-être pour vous",explore:"Explorer HUNT",sceneNext:"Afficher la prochaine ville de nuit",
      discover:["Découvrez votre HUNT","Plus pour vous ci-dessous","Entrez dans votre univers"],lifestyleIntro:"La découverte personnalisée commence en faisant défiler. Produits réels uniquement.",
      womenKicker:"FEMME · HUNT EDIT",womenTitle:"Commencez avec style.",womenCopy:"Robes, hauts, chaussures et mode quotidienne du catalogue actif.",shopWomen:"Voir Femme →",accessoriesTitle:"Terminez le look.",beautyTitle:"La beauté sans le bruit.",forYouKicker:"BOOM POUR VOUS",forYouTitle:"HUNT change pendant votre navigation.",forYouCopy:"Un mélange équilibré pendant que HUNT apprend de vos visites, likes et sauvegardes.",
      buildKicker:"BOOM DEAL BUILDER",buildTitle:"Une pièce peut devenir un look complet.",buildCopy:"Commencez par une pièce, BOOM relie les produits complémentaires. Les remises restent verrouillées avant vérification.",buildCta:"Commencer →",freshKicker:"NOUVEAU CATALOGUE",freshTitle:"Nouveau dans HUNT.",freshCopy:"De vrais produits et une découverte dynamique, sans fausse popularité.",keepExploring:"Continuer ↓",endlessKicker:"DÉCOUVERTE CONTINUE",endlessHomeTitle:"Continuez à chercher.",endlessHomeCopy:"Un flux mixte du catalogue connecté. Plus de produits apparaissent en avançant.",remix:"Remixer",
      productCueTop:"VOTRE HUNT CONTINUE",productCue:"Découvrez plus pour vous",productPulse:"Cela pourrait vous plaire",productPulseCta:"Découvrir ↓",endlessTitle:"Continuez à découvrir",endlessCopy:"HUNT ouvre plus de produits pertinents au fil du défilement.",
      tuneKicker:"RÉGLEZ VOTRE HUNT",tuneTitle:"Choisissez ce que vous voulez voir davantage.",tuneCopy:"Vos choix suivent votre compte HUNT entre appareils.",tuneLocal:"Enregistré sur cet appareil jusqu’à votre connexion.",resetInterests:"Réinitialiser les intérêts",
      shopCategory:"CATÉGORIE",forYouRanking:"Classement pour vous",sort:"Trier",relevance:"Pertinence",priceLow:"Prix : bas",priceHigh:"Prix : haut",min:"Min",max:"Max",apply:"Appliquer",shopByCategory:"ACHETER PAR CATÉGORIE",loadMore:"Charger plus",noLiveCategory:"Pas encore de flux actif dans cette catégorie.",supplierNetwork:"Réseau fournisseurs →",
      searchKicker:"HUNT AI FIND",searchTitle:"Décrivez ce que vous voulez.",searchCopy:"Recherchez naturellement. HUNT transforme votre demande en catégorie, style, couleur et budget.",find:"Trouver",readySearch:"Prêt à rechercher",searchTruth:"Aucune supposition de profil. Les résultats viennent du catalogue connecté.",rebuild:"Reconstruire",estimatedTotal:"Total estimé",shippingRecheck:"Livraison, stock et prix final sont revérifiés avant le checkout.",searchBegin:"Lancez une recherche.",
      preLaunch:"PRÉ-LANCEMENT",checkoutPreview:"Aperçu du checkout",yourCart:"VOTRE PANIER",orderItems:"Articles",clearCart:"Vider le panier",cartEmpty:"Votre panier est vide.",browseProducts:"Voir les produits",orderSummary:"RÉSUMÉ",shipping:"Livraison",pending:"EN ATTENTE",destinationCountry:"Pays de destination",shippingDetails:"Détails de livraison",fullName:"Nom complet",email:"Email",address:"Adresse",city:"Ville",region:"Région",postal:"Code postal",phone:"Téléphone",verifyShipping:"Vérifier prix et livraison",paymentPending:"Activation du paiement en attente",
      accountPersonalization:"COMPTE ET PERSONNALISATION",oneAccount:"UN COMPTE · HUNT PLUS INTELLIGENT",authTitle:"Votre compte HUNT.",authCopy:"Connectez-vous pour retrouver vos intérêts, likes et sauvegardes sur tous vos appareils.",signInCreate:"CONNEXION / CRÉER UN COMPTE",continueAccount:"Continuer avec votre compte",emailAddress:"Adresse e-mail",sendMagic:"Envoyer un lien sécurisé →",or:"ou",checking:"Vérification…",signedIn:"CONNECTÉ",boomPersonalization:"Personnalisation BOOM",syncedAccount:"COMPTE HUNT SYNCHRONISÉ",signOut:"Déconnexion"
    },
    ja:{
      heroKicker:"あなたの世界 · あなたのHUNT",heroTitle1:"自分に合うものを",heroTitle2:"見つけよう。",heroCopy:"ファッション、美容、ホーム、テックなどを実際の興味に合わせて変化させます。",search:"商品、スタイル、ブランド、アイデアを検索…",
      women:"ウィメンズ",accessories:"アクセサリー",beauty:"ビューティー",men:"メンズ",kids:"キッズ",home:"ホーム",tech:"テック",sports:"スポーツ",shoes:"シューズ",shop:"ショップ",aiFind:"AI検索",categories:"カテゴリー",forYou:"あなたへ",saved:"保存済み",cart:"カート",signIn:"ログイン",account:"アカウント",allCategories:"すべてのカテゴリー",continueShopping:"買い物を続ける",preferences:"好み",likes:"いいね",ordersShipping:"注文・配送",
      promoLifestyle:"BOOM LIFESTYLE",promoForYou:"あなたへ",promoFresh:"確認済みNEW",promoSelects:"HUNTセレクト",promoPersonal:"HUNTで選び、見た内容をもとに選択。",promoCatalog:"接続済みカタログからの実在商品です。",promoBeauty:"ビューティーセレクト。",promoTech:"便利なテックセレクト。",promoHome:"ホームセレクト。",verifyPrice:"商品ページで価格を確認",maybe:"気になるかも",explore:"HUNTで見る",sceneNext:"次の夜景都市を見る",
      discover:["あなたのHUNTを発見","下にもおすすめがあります","あなたの世界をもっと見る"],lifestyleIntro:"スクロールするとパーソナルな発見が始まります。実在商品だけを表示します。",
      womenKicker:"WOMEN · HUNT EDIT",womenTitle:"スタイルから始めよう。",womenCopy:"ドレス、トップス、シューズなどをライブカタログから。",shopWomen:"ウィメンズを見る →",accessoriesTitle:"ルックを仕上げる。",beautyTitle:"ノイズのないビューティー。",forYouKicker:"BOOM FOR YOU",forYouTitle:"HUNTは見ているものに合わせて変わります。",forYouCopy:"閲覧、いいね、保存からHUNTが学びます。",
      productCueTop:"HUNTはまだ続く",productCue:"あなた向けをもっと見る",productPulse:"これも気になるかも",productPulseCta:"見る ↓",endlessTitle:"もっと見つける",endlessCopy:"スクロールするほど関連商品が広がります。",
      tuneKicker:"HUNTを調整",tuneTitle:"もっと見たいものを選択。",tuneCopy:"選択した好みはHUNTアカウントと一緒に端末間で引き継がれます。",tuneLocal:"ログインするまでこの端末に保存されます。",resetInterests:"興味をリセット",
      shopCategory:"カテゴリー",forYouRanking:"あなた向け順",sort:"並べ替え",relevance:"関連順",priceLow:"価格：安い順",priceHigh:"価格：高い順",min:"最小",max:"最大",apply:"適用",shopByCategory:"カテゴリーから探す",loadMore:"もっと読み込む",
      searchKicker:"HUNT AI FIND",searchTitle:"欲しいものを説明してください。",searchCopy:"自然な言葉で検索。HUNTがカテゴリー、スタイル、色、予算に変換します。",find:"検索",readySearch:"検索準備完了",searchBegin:"検索して開始。",
      preLaunch:"プレローンチ",checkoutPreview:"チェックアウトプレビュー",yourCart:"カート",orderItems:"商品",clearCart:"カートを空にする",cartEmpty:"カートは空です。",browseProducts:"商品を見る",orderSummary:"注文概要",shipping:"配送",pending:"確認中",destinationCountry:"配送先国",shippingDetails:"配送情報",fullName:"氏名",email:"メール",address:"住所",city:"市区町村",region:"都道府県",postal:"郵便番号",phone:"電話",verifyShipping:"価格と配送を確認",paymentPending:"支払い有効化待ち",
      accountPersonalization:"アカウントとパーソナライズ",oneAccount:"1つのアカウント · もっとスマートなHUNT",authTitle:"HUNTアカウント",authCopy:"ログインすると興味、いいね、保存が端末間で引き継がれます。",signInCreate:"ログイン / アカウント作成",continueAccount:"アカウントで続行",emailAddress:"メールアドレス",sendMagic:"安全なログインリンクを送る →",or:"または",checking:"確認中…",signedIn:"ログイン中",boomPersonalization:"BOOMパーソナライズ",syncedAccount:"HUNTアカウント同期済み",signOut:"ログアウト"
    },
    zh:{
      heroKicker:"你的世界 · 你的HUNT",heroTitle1:"找到真正",heroTitle2:"适合你的。",heroCopy:"时尚、美妆、家居、科技等会根据你的真实兴趣不断变化。",search:"搜索商品、风格、品牌或灵感…",
      women:"女装",accessories:"配饰",beauty:"美妆",men:"男装",kids:"儿童",home:"家居",tech:"科技",sports:"运动",shoes:"鞋履",shop:"购物",aiFind:"AI搜索",categories:"分类",forYou:"为你推荐",saved:"已收藏",cart:"购物车",signIn:"登录",account:"账户",allCategories:"全部分类",continueShopping:"继续购物",preferences:"偏好",likes:"喜欢",ordersShipping:"订单与配送",
      promoLifestyle:"BOOM LIFESTYLE",promoForYou:"为你推荐",promoFresh:"已验证新品",promoSelects:"HUNT精选",promoPersonal:"根据你在HUNT中的选择与浏览生成。",promoCatalog:"来自已连接目录的真实商品。",promoBeauty:"美妆精选。",promoTech:"实用科技精选。",promoHome:"家居精选。",verifyPrice:"打开商品页核验价格",maybe:"你可能会喜欢",explore:"探索HUNT",sceneNext:"查看下一座夜景城市",
      discover:["发现你的HUNT","下面还有更多为你准备","继续进入你的世界"],lifestyleIntro:"向下滚动后开始个性化发现，只展示真实目录商品。",
      womenKicker:"女装 · HUNT EDIT",womenTitle:"从风格开始。",womenCopy:"连衣裙、上装、鞋履和日常时尚，直接来自实时目录。",shopWomen:"查看女装 →",accessoriesTitle:"完成整套造型。",beautyTitle:"更安静的美妆体验。",forYouKicker:"BOOM 为你",forYouTitle:"HUNT会随着你的浏览而变化。",forYouCopy:"HUNT会根据浏览、喜欢和收藏逐步学习。",
      productCueTop:"你的HUNT还在继续",productCue:"发现更多适合你的",productPulse:"你可能会感兴趣",productPulseCta:"发现 ↓",endlessTitle:"继续发现",endlessCopy:"继续滚动，HUNT会打开更多相关商品。",
      tuneKicker:"调整你的HUNT",tuneTitle:"选择你想看到更多的内容。",tuneCopy:"你的选择会随HUNT账户在设备间同步。",tuneLocal:"登录前保存在当前设备。",resetInterests:"重置兴趣",
      shopCategory:"商品分类",forYouRanking:"为你排序",sort:"排序",relevance:"相关度",priceLow:"价格：从低到高",priceHigh:"价格：从高到低",min:"最低",max:"最高",apply:"应用",shopByCategory:"按分类购物",loadMore:"加载更多",
      searchKicker:"HUNT AI FIND",searchTitle:"描述你想要的东西。",searchCopy:"自然搜索，HUNT会把请求转换为分类、风格、颜色和预算。",find:"搜索",readySearch:"可以开始搜索",searchBegin:"搜索后开始。",
      preLaunch:"预发布",checkoutPreview:"结账预览",yourCart:"你的购物车",orderItems:"商品",clearCart:"清空购物车",cartEmpty:"购物车为空。",browseProducts:"浏览商品",orderSummary:"订单摘要",shipping:"配送",pending:"待确认",destinationCountry:"目的国家/地区",shippingDetails:"配送信息",fullName:"姓名",email:"邮箱",address:"地址",city:"城市",region:"省/地区",postal:"邮编",phone:"电话",verifyShipping:"核验价格与配送",paymentPending:"支付功能待启用",
      accountPersonalization:"账户与个性化",oneAccount:"一个账户 · 更智能的HUNT",authTitle:"你的HUNT账户",authCopy:"登录后，兴趣、喜欢和收藏可在不同设备间同步。",signInCreate:"登录 / 创建账户",continueAccount:"使用账户继续",emailAddress:"邮箱",sendMagic:"发送安全登录链接 →",or:"或",checking:"检查中…",signedIn:"已登录",boomPersonalization:"BOOM个性化",syncedAccount:"HUNT账户已同步",signOut:"退出登录"
    }
  };

  const TEXT_KEYS={
    "Shop":"shop","AI Find":"aiFind","Women":"women","Accessories":"accessories","Beauty":"beauty","Men":"men","Kids":"kids","Home":"home","Tech":"tech","Sports":"sports","Shoes":"shoes",
    "All categories":"allCategories","Categories":"categories","For You":"forYou","Saved":"saved","Cart":"cart","Sign in":"signIn","Account":"account","Continue shopping":"continueShopping",
    "Personalized discovery begins here as you scroll. Real catalog products only.":"lifestyleIntro",
    "WOMEN · HUNT EDIT":"womenKicker","Start with style.":"womenTitle","Dresses, tops, shoes and everyday fashion pulled directly from the live catalog.":"womenCopy","Shop Women →":"shopWomen",
    "ACCESSORIES":"accessories","Finish the look.":"accessoriesTitle","BEAUTY":"beauty","Beauty, without the noise.":"beautyTitle",
    "BOOM FOR YOU":"forYouKicker","HUNT changes as you browse.":"forYouTitle","A balanced mix while HUNT learns what you open, like and save.":"forYouCopy",
    "BOOM DEAL BUILDER":"buildKicker","One item can become a whole look.":"buildTitle","Start with a dress. BOOM can connect bags, jewelry and shoes around it. Any discount stays locked until stock, shipping and Profit Gate are verified.":"buildCopy","Start with a dress →":"buildCta",
    "FRESH CATALOG":"freshKicker","Fresh in HUNT.":"freshTitle","Real catalog arrivals and rotating product discovery — no fake popularity labels.":"freshCopy","Keep exploring ↓":"keepExploring",
    "ENDLESS DISCOVERY":"endlessKicker","Keep hunting.":"endlessHomeTitle","A mixed feed across the connected catalog. More products load as you move.":"endlessHomeCopy","Remix":"remix",
    "VERIFIED OPPORTUNITIES":"verifiedOpps","Smart Deal Picks":"smartPicks","Only qualified TEST/SELL candidates appear here. Empty is better than fabricated.":"smartPicksCopy",
    "No qualified live deals yet.":"noDealsTitle","The engine is ready. Real products appear only after a provider feed and affiliate path are verified.":"noDealsCopy",
    "Preferences":"preferences","Likes":"likes","Orders & shipping":"ordersShipping","Your likes":"profileLikes","Your saved products":"profileSaved","LIKED PRODUCTS":"likedProducts","SAVED FOR LATER":"savedLater","ORDER TRACKING":"orderTracking","Sign out":"signOut",
    "SHOP CATEGORY":"shopCategory","For You ranking":"forYouRanking","Learning from this device.":"learningDevice","Sort":"sort","Relevance":"relevance","Price: Low":"priceLow","Price: High":"priceHigh","Min":"min","Max":"max","Apply":"apply","SHOP BY CATEGORY":"shopByCategory","Deal truth":"dealTruth","Load more products":"loadMore","No live product feed in this category yet.":"noLiveCategory","Supplier network →":"supplierNetwork",
    "HUNT AI FIND":"searchKicker","Describe what you want.":"searchTitle","Search naturally in English, Hebrew or Arabic. HUNT turns your request into category, style, color and budget filters.":"searchCopy","Find":"find","Ready to search":"readySearch","No profile guessing. Results come from the current CJ-only HUNT catalog.":"searchTruth","BOOM MISSION SHOPPING":"missionKicker","Your mission set":"missionSet","Rebuild":"rebuild","Estimated product total":"estimatedTotal","Shipping, stock and final price are rechecked before checkout.":"shippingRecheck","Search to begin.":"searchBegin",
    "PRE-LAUNCH":"preLaunch","Checkout preview":"checkoutPreview","YOUR CART":"yourCart","Order items":"orderItems","Clear cart":"clearCart","Your cart is empty.":"cartEmpty","Browse live products":"browseProducts","ORDER SUMMARY":"orderSummary","Verified HUNT retail subtotal":"verifiedSubtotal","Price verification":"priceVerification","PER ITEM":"perItem","Shipping":"shipping","PENDING":"pending","BOOM bundle offer":"bundleOffer","Taxes / duties":"taxesDuties","Verified pre-tax total":"verifiedTotal","Destination country":"destinationCountry","Shipping details":"shippingDetails","Full name":"fullName","Email":"email","Address":"address","Address line 2":"address2","City":"city","Province / region":"region","Postal code":"postal","Phone":"phone","Verify price & shipping":"verifyShipping","BOOM bundle check":"bundleCheck","BOOM Shipping Chess":"shippingChess","Payment activation pending":"paymentPending",
    "ACCOUNT & PERSONALIZATION":"accountPersonalization","ONE ACCOUNT · SMARTER HUNT":"oneAccount","Your HUNT account.":"authTitle","For You":"forYou","Personal category ranking":"authForYouCopy","Keep your selected products":"authCartCopy","Truth first":"truthFirst","No fake discounts or fake popularity":"truthCopy","SIGN IN / CREATE ACCOUNT":"signInCreate","Continue with your account":"continueAccount","Email address":"emailAddress","Send secure magic link →":"sendMagic","or":"or","Checking…":"checking","SIGNED IN":"signedIn","BOOM personalization":"boomPersonalization","LOCAL DEVICE SIGNALS":"syncedAccount",
    "Privacy":"privacy","Terms":"terms","Returns & Cancellation":"returns","Withdrawal / Return request":"withdrawal","Partners":"partners","Deals":"deals","Price Lens":"priceLens"
  };
  const staticNodeKeys=new WeakMap();
  const placeholderNodeKeys=new WeakMap();
  const PLACEHOLDER_KEYS={
    "Search products, styles, brands or ideas…":"search",
    "Any":"max",
    "Recipient name":"fullName",
    "Email for order updates":"email",
    "Street and number":"address",
    "Apartment / unit (optional)":"address2",
    "you@example.com":"emailAddress"
  };

  function normalize(raw){
    const s=String(raw||"").toLowerCase();
    if(s.startsWith("he")||s.startsWith("iw"))return "he";
    if(s.startsWith("ar"))return "ar";
    if(s.startsWith("es"))return "es";
    if(s.startsWith("fr"))return "fr";
    if(s.startsWith("ja"))return "ja";
    if(s.startsWith("zh"))return "zh";
    return supported.has(s)?s:"en";
  }
  function current(){try{return normalize(localStorage.getItem("hunt_language")||navigator.language||"en")}catch{return normalize(navigator.language||"en")}}
  function dict(lang=current()){return {...EN,...(OV[normalize(lang)]||{})}}
  function t(key,lang=current()){return dict(lang)[key]??EN[key]??key}

  function ensureSelector(){
    if(document.querySelector("[data-lang-select]"))return;
    const host=document.querySelector(".hd-tools");
    if(!host)return;
    const select=document.createElement("select");
    select.className="hd-lang";
    select.setAttribute("data-lang-select","");
    select.setAttribute("aria-label","Language");
    select.innerHTML='<option value="en">EN</option><option value="ar">AR</option><option value="he">HE</option><option value="es">ES</option><option value="fr">FR</option><option value="ja">JA</option><option value="zh">中文</option>';
    host.prepend(select);
  }

  function translateStatic(d){
    if(!document.body)return;
    const skipSelector=".hd-shelf-card,.hd-market-product-card,.hd-shop-card,.hd-profile-product,.hd-product-title,#hd-product-title,[data-hunt-no-i18n]";
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const parent=node.parentElement;
      if(!parent||["SCRIPT","STYLE","TEXTAREA"].includes(parent.tagName)||parent.closest(skipSelector))continue;
      const raw=node.nodeValue||"";
      const trimmed=raw.trim();
      const key=staticNodeKeys.get(node)||TEXT_KEYS[trimmed];
      if(!key||d[key]===undefined)continue;
      if(!staticNodeKeys.has(node))staticNodeKeys.set(node,key);
      const before=raw.match(/^\s*/)?.[0]||"",after=raw.match(/\s*$/)?.[0]||"";
      node.nodeValue=before+d[key]+after;
    }
    document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el=>{
      const key=placeholderNodeKeys.get(el)||PLACEHOLDER_KEYS[el.getAttribute("placeholder")||""];
      if(!key||d[key]===undefined)return;
      if(!placeholderNodeKeys.has(el))placeholderNodeKeys.set(el,key);
      el.setAttribute("placeholder",d[key]);
    });
  }

  function apply(raw){
    const lang=normalize(raw),d=dict(lang);
    ensureSelector();
    document.documentElement.lang=lang;
    document.documentElement.dir=RTL.has(lang)?"rtl":"ltr";
    if(document.body)document.body.dataset.lang=lang;
    document.querySelectorAll("[data-hunt-i18n]").forEach(el=>{
      const v=d[el.dataset.huntI18n];
      if(v!==undefined&&!Array.isArray(v))el.textContent=v;
    });
    document.querySelectorAll("[data-hunt-i18n-placeholder]").forEach(el=>{
      const v=d[el.dataset.huntI18nPlaceholder];
      if(v!==undefined)el.setAttribute("placeholder",v);
    });
    document.querySelectorAll("[data-hunt-i18n-aria]").forEach(el=>{
      const v=d[el.dataset.huntI18nAria];
      if(v!==undefined)el.setAttribute("aria-label",v);
    });
    translateStatic(d);
    document.querySelectorAll("[data-lang-select]").forEach(el=>{if([...el.options].some(o=>o.value===lang))el.value=lang});
    try{localStorage.setItem("hunt_language",lang)}catch{}
    window.HuntAnalytics?.experience?.("language_change",{language:lang});
    window.dispatchEvent(new CustomEvent("hunt:experience-language",{detail:{lang,dict:d}}));
    return d;
  }

  function bind(){
    ensureSelector();
    document.querySelectorAll("[data-lang-select]").forEach(el=>{
      if(el.dataset.huntExperienceBound==="1")return;
      el.dataset.huntExperienceBound="1";
      el.addEventListener("change",()=>apply(el.value));
    });
    apply(current());
  }

  window.HuntExperienceI18n={apply,current,dict,t,normalize};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});
  else bind();
})();