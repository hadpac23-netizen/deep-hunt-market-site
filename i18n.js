(() => {
  const RTL = new Set(["ar", "he"]);
  const common = {
    en: {
      language: "Language", live: "LIVE", loading: "Loading…", verified: "Verified",
      affiliateDisclosure: "Affiliate disclosure: qualifying outbound links may earn HUNT DEAL a commission at no extra cost to you.",
      nasaCredit: "Earth imagery: NASA / Earth Observatory."
    },
    ar: {
      language: "اللغة", live: "مباشر", loading: "جارٍ التحميل…", verified: "موثّق",
      affiliateDisclosure: "إفصاح: قد يحصل HUNT DEAL على عمولة من بعض الروابط المؤهلة دون تكلفة إضافية عليك.",
      nasaCredit: "صورة الأرض: NASA / Earth Observatory."
    },
    he: {
      language: "שפה", live: "פעיל", loading: "טוען…", verified: "מאומת",
      affiliateDisclosure: "גילוי נאות: HUNT DEAL עשוי לקבל עמלה מקישורים מתאימים, ללא עלות נוספת עבורך.",
      nasaCredit: "תמונת כדור הארץ: NASA / Earth Observatory."
    },
    es: {
      language: "Idioma", live: "EN VIVO", loading: "Cargando…", verified: "Verificado",
      affiliateDisclosure: "Divulgación: HUNT DEAL puede recibir una comisión por enlaces elegibles sin coste extra para ti.",
      nasaCredit: "Imagen de la Tierra: NASA / Earth Observatory."
    },
    fr: {
      language: "Langue", live: "EN DIRECT", loading: "Chargement…", verified: "Vérifié",
      affiliateDisclosure: "Divulgation : HUNT DEAL peut recevoir une commission sur certains liens, sans coût supplémentaire pour vous.",
      nasaCredit: "Image de la Terre : NASA / Earth Observatory."
    }
  };

  const pages = {
    deal: {
      en: {
        branch: "A BOOM branch · full BOOM coming later.",
        navDeals: "Deals Now", navPicks: "Smart Picks", navTrends: "Trend Radar", navCompare: "Price Lens",
        search: "Search products, brands, or categories…",
        kicker: "COMPARE SMARTER · SHOP BETTER · KEEP THE FACTS VISIBLE",
        hero1: "Better decisions", hero2: "before you spend.",
        heroCopy: "HUNT DEAL compares verified offers across approved marketplaces, explains why a deal is worth attention, and tracks what actually converts.",
        explore: "Explore Deals Now", how: "How it works",
        f1: "Price comparison", f2: "Global provider map", f3: "AI + Red Team", f4: "Truthful commission tracking",
        advisor: "HUNT Advisor", advisorSub: "REAL DEAL INTELLIGENCE · SMARTER SHOPPING",
        brief: "Today's Deal Intelligence Brief", best: "Best price right now", worth: "Worth testing", avoid: "What to avoid", confidence: "Confidence & value",
        noBest: "No verified live offer yet.", noWorth: "Provider feeds are being connected.", noAvoid: "Fake urgency and unsupported discounts.", noConfidence: "Evidence first",
        providers: "Providers mapped", qualified: "Qualified offers", clicks: "Outbound clicks", commission: "Confirmed commission",
        smartPicks: "Smart Deal Picks", smartPicksSub: "Only TEST/SELL candidates can appear here. Empty is better than fabricated.",
        all: "All Deals", tech: "Tech", home: "Home", fashion: "Fashion", travel: "Travel",
        noDeals: "No qualified live deals yet.", noDealsSub: "The engine is ready. Real products appear only after a provider feed and affiliate path are verified.",
        why: "Why this deal?", redTeam: "Red Team note", retailer: "Check retailer", onsiteCheckout: "Buy on HUNT DEAL", onsitePending: "On-site checkout pending", compare: "Compare", test: "TEST", sell: "SELL",
        radarTitle: "Trend Radar", radarSub: "Fresh shopping signals guide what HUNT DEAL researches next. Signals are not sales claims.", catalogTitle: "Products already connected", catalogSub: "Real catalog inventory from an approved API source. These are catalog candidates, not qualified deals yet.", catalogTruth: "Supplier base cost is source intelligence only. It is not a public retail price or a promised margin.", catalogBase: "Supplier base", catalogPending: "Checkout activation pending", liveCatalogConnected: "Live merchant catalog connected",
        footerTag: "A BOOM branch · commerce intelligence now, full BOOM later."
      },
      ar: {
        branch: "فرع من BOOM · المنصة الكاملة لاحقًا.",
        navDeals: "العروض الآن", navPicks: "اختيارات ذكية", navTrends: "رادار الترند", navCompare: "مقارنة الأسعار",
        search: "ابحث عن منتج أو علامة أو فئة…",
        kicker: "قارن بذكاء · اشترِ أفضل · خلّي الحقيقة ظاهرة",
        hero1: "قرارات أفضل", hero2: "قبل ما تدفع.",
        heroCopy: "HUNT DEAL يقارن العروض الموثقة بين المتاجر المعتمدة، يشرح لماذا العرض يستحق الانتباه، ويتابع ما الذي يتحول فعلًا إلى مبيعات وعمولة.",
        explore: "شاهد العروض", how: "كيف يعمل",
        f1: "مقارنة الأسعار", f2: "خريطة متاجر عالمية", f3: "AI + Red Team", f4: "تتبع عمولة حقيقية",
        advisor: "HUNT Advisor", advisorSub: "ذكاء عروض حقيقي · تسوق أذكى",
        brief: "ملخص ذكاء العروض اليوم", best: "أفضل سعر الآن", worth: "يستحق الاختبار", avoid: "ما الذي نتجنبه", confidence: "الثقة والقيمة",
        noBest: "لا يوجد عرض حي موثق بعد.", noWorth: "نربط مصادر المنتجات الرسمية.", noAvoid: "استعجال وهمي وخصومات غير مثبتة.", noConfidence: "الدليل أولًا",
        providers: "المصادر المربوطة", qualified: "العروض المؤهلة", clicks: "نقرات للخارج", commission: "عمولة مؤكدة",
        smartPicks: "اختيارات HUNT الذكية", smartPicksSub: "فقط المنتجات TEST/SELL تظهر هنا. الفراغ أفضل من بيانات مزيفة.",
        all: "الكل", tech: "تقنية", home: "منزل", fashion: "موضة", travel: "سفر",
        noDeals: "لا توجد عروض حية مؤهلة بعد.", noDealsSub: "المحرك جاهز. المنتج يظهر فقط بعد توثيق المصدر ومسار العمولة.",
        why: "لماذا هذا العرض؟", redTeam: "ملاحظة Red Team", retailer: "افتح المتجر", compare: "قارن", test: "اختبار", sell: "بيع",
        radarTitle: "رادار الترند", radarSub: "إشارات تسوق حديثة توجه ما يبحث عنه HUNT DEAL لاحقًا. الإشارة ليست ادعاء مبيعات.", catalogTitle: "منتجات متصلة الآن", catalogSub: "مخزون حقيقي من مصدر API معتمد. هذه منتجات كتالوج وليست صفقات مؤهلة بعد.", catalogTruth: "تكلفة المورد الأساسية معلومة مصدر فقط وليست سعر بيع أو هامش ربح مضمون.", catalogBase: "تكلفة المورد", catalogPending: "تفعيل الدفع قيد الانتظار", liveCatalogConnected: "تم ربط كتالوج تاجر حي",
        footerTag: "فرع من BOOM · ذكاء تجارة الآن، والمنصة الكاملة لاحقًا."
      },
      he: {
        branch: "ענף של BOOM · הפלטפורמה המלאה בהמשך.",
        navDeals: "דילים עכשיו", navPicks: "בחירות חכמות", navTrends: "רדאר טרנדים", navCompare: "השוואת מחירים",
        search: "חפש מוצר, מותג או קטגוריה…",
        kicker: "משווים חכם · קונים טוב יותר · משאירים את העובדות גלויות",
        hero1: "החלטות טובות יותר", hero2: "לפני שמוציאים כסף.",
        heroCopy: "HUNT DEAL משווה הצעות מאומתות בין מרקטפלייסים מאושרים, מסביר למה דיל שווה תשומת לב ועוקב אחרי מה שבאמת ממיר.",
        explore: "לדילים עכשיו", how: "איך זה עובד",
        f1: "השוואת מחירים", f2: "מפת ספקים גלובלית", f3: "AI + Red Team", f4: "מעקב עמלה אמיתי",
        advisor: "HUNT Advisor", advisorSub: "מודיעין דילים אמיתי · קנייה חכמה יותר",
        brief: "תקציר הדילים של היום", best: "המחיר הטוב כרגע", worth: "שווה בדיקה", avoid: "ממה להימנע", confidence: "ביטחון וערך",
        noBest: "עדיין אין הצעה חיה מאומתת.", noWorth: "מקורות המוצרים מתחברים.", noAvoid: "לחץ מזויף והנחות לא מוכחות.", noConfidence: "ראיות לפני הכול",
        providers: "ספקים ממופים", qualified: "הצעות מאושרות", clicks: "קליקים החוצה", commission: "עמלה מאושרת",
        smartPicks: "Smart Deal Picks", smartPicksSub: "רק TEST/SELL יכולים להופיע. עדיף ריק ממומצא.",
        all: "הכול", tech: "טכנולוגיה", home: "בית", fashion: "אופנה", travel: "נסיעות",
        noDeals: "אין עדיין דילים חיים מאושרים.", noDealsSub: "המנוע מוכן. מוצרים יופיעו רק לאחר אימות מקור וייחוס עמלה.",
        why: "למה הדיל הזה?", redTeam: "הערת Red Team", retailer: "לצפייה בחנות", compare: "השווה", test: "TEST", sell: "SELL",
        radarTitle: "רדאר טרנדים", radarSub: "סיגנלים עדכניים מכוונים את המחקר הבא של HUNT DEAL. סיגנל אינו טענת מכירות.", catalogTitle: "מוצרים שכבר מחוברים", catalogSub: "קטלוג אמיתי ממקור API מאושר. אלה מועמדי קטלוג, לא דילים מאושרים.", catalogTruth: "עלות בסיס ספק היא מידע מקור בלבד, לא מחיר קמעונאי ולא הבטחת מרווח.", catalogBase: "בסיס ספק", catalogPending: "הפעלת checkout בהמתנה", liveCatalogConnected: "קטלוג סוחר חי מחובר",
        footerTag: "ענף של BOOM · מודיעין מסחר עכשיו, BOOM המלא בהמשך."
      },
      es: {
        branch: "Una rama de BOOM · la plataforma completa llegará después.",
        navDeals: "Ofertas", navPicks: "Selecciones", navTrends: "Radar", navCompare: "Comparar precios",
        search: "Buscar productos, marcas o categorías…",
        kicker: "COMPARA MEJOR · COMPRA MEJOR · DATOS VISIBLES",
        hero1: "Mejores decisiones", hero2: "antes de gastar.",
        heroCopy: "HUNT DEAL compara ofertas verificadas entre marketplaces aprobados, explica por qué importan y mide lo que realmente convierte.",
        explore: "Ver ofertas", how: "Cómo funciona",
        f1: "Comparación de precios", f2: "Mapa global", f3: "AI + Red Team", f4: "Comisiones reales",
        advisor: "HUNT Advisor", advisorSub: "INTELIGENCIA REAL DE OFERTAS",
        brief: "Resumen de ofertas de hoy", best: "Mejor precio ahora", worth: "Vale la pena probar", avoid: "Qué evitar", confidence: "Confianza y valor",
        noBest: "Aún no hay una oferta en vivo verificada.", noWorth: "Conectando feeds oficiales.", noAvoid: "Urgencia falsa y descuentos sin prueba.", noConfidence: "Evidencia primero",
        providers: "Proveedores", qualified: "Ofertas calificadas", clicks: "Clics salientes", commission: "Comisión confirmada",
        smartPicks: "Selecciones inteligentes", smartPicksSub: "Solo TEST/SELL pueden aparecer. Mejor vacío que inventado.",
        all: "Todo", tech: "Tecnología", home: "Hogar", fashion: "Moda", travel: "Viajes",
        noDeals: "Aún no hay ofertas calificadas.", noDealsSub: "El motor está listo. Los productos aparecen solo con fuente y atribución verificadas.",
        why: "¿Por qué esta oferta?", redTeam: "Nota Red Team", retailer: "Ver tienda", compare: "Comparar", test: "TEST", sell: "SELL",
        radarTitle: "Radar de tendencias", radarSub: "Señales recientes orientan la próxima investigación de HUNT DEAL. Una señal no es una promesa de ventas.", catalogTitle: "Productos ya conectados", catalogSub: "Inventario real de una fuente API aprobada. Son candidatos de catálogo, no ofertas calificadas.", catalogTruth: "El coste base del proveedor es solo inteligencia de origen; no es precio minorista ni margen garantizado.", catalogBase: "Base proveedor", catalogPending: "Checkout pendiente de activación", liveCatalogConnected: "Catálogo comercial en vivo conectado",
        footerTag: "Una rama de BOOM · inteligencia comercial ahora, BOOM completo después."
      },
      fr: {
        branch: "Une branche de BOOM · la plateforme complète viendra plus tard.",
        navDeals: "Offres", navPicks: "Sélections", navTrends: "Radar", navCompare: "Comparer les prix",
        search: "Rechercher produits, marques ou catégories…",
        kicker: "COMPAREZ MIEUX · ACHETEZ MIEUX · GARDEZ LES PREUVES VISIBLES",
        hero1: "De meilleures décisions", hero2: "avant de dépenser.",
        heroCopy: "HUNT DEAL compare des offres vérifiées entre marketplaces approuvées, explique leur intérêt et mesure ce qui convertit réellement.",
        explore: "Voir les offres", how: "Comment ça marche",
        f1: "Comparaison de prix", f2: "Carte mondiale", f3: "AI + Red Team", f4: "Commissions réelles",
        advisor: "HUNT Advisor", advisorSub: "INTELLIGENCE D'OFFRES RÉELLE",
        brief: "Brief des offres du jour", best: "Meilleur prix actuel", worth: "À tester", avoid: "À éviter", confidence: "Confiance et valeur",
        noBest: "Aucune offre live vérifiée pour l'instant.", noWorth: "Connexion des flux officiels.", noAvoid: "Fausse urgence et remises non prouvées.", noConfidence: "Les preuves d'abord",
        providers: "Fournisseurs", qualified: "Offres qualifiées", clicks: "Clics sortants", commission: "Commission confirmée",
        smartPicks: "Sélections intelligentes", smartPicksSub: "Seuls TEST/SELL apparaissent. Mieux vaut vide qu'inventé.",
        all: "Tout", tech: "Tech", home: "Maison", fashion: "Mode", travel: "Voyage",
        noDeals: "Aucune offre qualifiée en direct.", noDealsSub: "Le moteur est prêt. Les produits n'apparaissent qu'après vérification de la source et de l'attribution.",
        why: "Pourquoi cette offre ?", redTeam: "Note Red Team", retailer: "Voir le marchand", compare: "Comparer", test: "TEST", sell: "SELL",
        radarTitle: "Radar des tendances", radarSub: "Des signaux récents orientent les prochaines recherches HUNT DEAL. Un signal n’est pas une promesse de vente.", catalogTitle: "Produits déjà connectés", catalogSub: "Inventaire réel depuis une source API approuvée. Ce sont des candidats catalogue, pas encore des offres qualifiées.", catalogTruth: "Le coût fournisseur est une donnée source uniquement, pas un prix public ni une marge garantie.", catalogBase: "Base fournisseur", catalogPending: "Activation du paiement en attente", liveCatalogConnected: "Catalogue marchand en direct connecté",
        footerTag: "Une branche de BOOM · intelligence commerciale maintenant, BOOM complet plus tard."
      }
    },
    ops: {
      en: {
        brandSub: "BUSINESS INTELLIGENCE", heroLabel: "BUSINESS DECISION PLATFORM", heroTitle: "Business Decision Control Room",
        heroSub: "REAL SIGNALS · CLEAR RISKS · SMARTER NEXT MOVES",
        navOverview: "Overview", navServices: "Services", navAdvisor: "Advisor", navProcess: "Process", navStart: "Start",
        active: "Active research", delivered: "Completed pilots", pipeline: "Business requests", risks: "Website requests",
        advisor: "HUNT Advisor", advisorSub: "YOUR AI BUSINESS DECISION ASSISTANT",
        advisorQuote: "Turn a messy business question into evidence, risks, buyers and clear next actions.",
        a1: "Summarize the decision", a2: "Find buyer evidence", a3: "Identify risks & blockers", a4: "Generate next actions",
        servicesTitle: "Business intelligence that ends with a decision.", service1: "Decision Check", service2: "Market Validation", service3: "Company Opportunity Review",
        service1p: "One focused business question, buyer/demand signals, competitors and Red Team.", service2p: "Deeper market, buyer, competition and commercial evidence with follow-up.", service3p: "Broader multi-market or high-stakes decision support with executive action memo.",
        processTitle: "From question to action", p1: "INTAKE", p2: "EVIDENCE", p3: "RED TEAM", p4: "ACTION",
        packages: "Free pilot phase", startTitle: "Tell HUNT OPS what decision you need to make.", submit: "Send free pilot request",
        name: "Your name", email: "Email", company: "Company / project", website: "Website", market: "Market / niche", package: "Pilot type", challenge: "What decision do you need help with?",
        truth: "No guaranteed outcomes. Evidence, assumptions and unknowns remain separate."
      },
      ar: {
        brandSub: "ذكاء أعمال", heroLabel: "منصة قرارات الأعمال", heroTitle: "غرفة تحكم لقرارات الأعمال",
        heroSub: "إشارات حقيقية · مخاطر واضحة · خطوة تالية أذكى",
        navOverview: "نظرة عامة", navServices: "الخدمات", navAdvisor: "المستشار", navProcess: "العملية", navStart: "ابدأ",
        active: "أبحاث نشطة", delivered: "تجارب مكتملة", pipeline: "طلبات أعمال", risks: "طلبات من الموقع",
        advisor: "HUNT Advisor", advisorSub: "مساعدك الذكي لقرارات الأعمال",
        advisorQuote: "نحوّل السؤال التجاري المعقد إلى دليل، مخاطر، مشترين وخطوات عملية واضحة.",
        a1: "تلخيص القرار", a2: "العثور على دليل المشتري", a3: "كشف المخاطر والعوائق", a4: "توليد الخطوات التالية",
        servicesTitle: "ذكاء أعمال ينتهي بقرار واضح.", service1: "فحص القرار", service2: "تحقق السوق", service3: "مراجعة فرصة للشركة",
        service1p: "سؤال تجاري واحد، إشارات طلب ومشترين، منافسون وRed Team.", service2p: "بحث أعمق للسوق والمشترين والمنافسة مع متابعة.", service3p: "قرارات كبيرة أو عدة أسواق مع مذكرة تنفيذية مرتبة.",
        processTitle: "من السؤال إلى التنفيذ", p1: "الطلب", p2: "الدليل", p3: "RED TEAM", p4: "التنفيذ",
        packages: "مرحلة التجربة المجانية", startTitle: "احكِ لـHUNT OPS ما القرار الذي تحتاج للمساعدة فيه.", submit: "أرسل طلب تجربة مجانية",
        name: "الاسم", email: "البريد", company: "الشركة / المشروع", website: "الموقع", market: "السوق / المجال", package: "نوع التجربة", challenge: "ما القرار الذي تريد المساعدة فيه؟",
        truth: "لا نضمن نتائج مالية. الدليل والافتراضات والمجهول تبقى منفصلة."
      },
      he: {
        brandSub: "מודיעין עסקי", heroLabel: "פלטפורמת החלטות עסקיות", heroTitle: "חדר בקרה להחלטות עסקיות",
        heroSub: "סיגנלים אמיתיים · סיכונים ברורים · צעדים חכמים יותר",
        navOverview: "סקירה", navServices: "שירותים", navAdvisor: "יועץ", navProcess: "תהליך", navStart: "התחל",
        active: "מחקרים פעילים", delivered: "פיילוטים שהושלמו", pipeline: "בקשות עסקיות", risks: "בקשות מהאתר",
        advisor: "HUNT Advisor", advisorSub: "עוזר AI להחלטות עסקיות",
        advisorQuote: "הופכים שאלה עסקית מבולגנת לראיות, סיכונים, קונים וצעדים ברורים.",
        a1: "סיכום ההחלטה", a2: "מציאת ראיות לקונים", a3: "זיהוי סיכונים וחסמים", a4: "יצירת צעדים הבאים",
        servicesTitle: "מודיעין עסקי שמסתיים בהחלטה.", service1: "בדיקת החלטה", service2: "אימות שוק", service3: "סקירת הזדמנות לחברה",
        service1p: "שאלה עסקית ממוקדת, ביקוש/קונים, מתחרים ו-Red Team.", service2p: "מחקר עמוק יותר על שוק, קונים, תחרות וראיות מסחריות עם follow-up.", service3p: "החלטה גדולה או מספר שווקים עם memo מנהלים ותעדוף.",
        processTitle: "משאלה לפעולה", p1: "קליטה", p2: "ראיות", p3: "RED TEAM", p4: "פעולה",
        packages: "שלב פיילוט חינמי", startTitle: "ספר ל-HUNT OPS איזו החלטה אתה צריך לקבל.", submit: "שלח בקשת פיילוט חינם",
        name: "שם", email: "אימייל", company: "חברה / פרויקט", website: "אתר", market: "שוק / תחום", package: "סוג פיילוט", challenge: "באיזו החלטה אתה צריך עזרה?",
        truth: "אין הבטחת תוצאה פיננסית. ראיות, הנחות ולא-ידוע נשארים נפרדים."
      },
      es: {
        brandSub: "INTELIGENCIA EMPRESARIAL", heroLabel: "PLATAFORMA DE DECISIONES", heroTitle: "Centro de control de decisiones empresariales",
        heroSub: "SEÑALES REALES · RIESGOS CLAROS · MEJORES PASOS",
        navOverview: "Resumen", navServices: "Servicios", navAdvisor: "Asesor", navProcess: "Proceso", navStart: "Empezar",
        active: "Investigaciones activas", delivered: "Pilotos completados", pipeline: "Solicitudes de negocio", risks: "Solicitudes web",
        advisor: "HUNT Advisor", advisorSub: "TU ASISTENTE DE DECISIÓN EMPRESARIAL",
        advisorQuote: "Convierte una pregunta compleja en evidencia, riesgos, compradores y próximos pasos claros.",
        a1: "Resumir decisión", a2: "Encontrar evidencia de compradores", a3: "Detectar riesgos", a4: "Generar próximos pasos",
        servicesTitle: "Inteligencia empresarial que termina en una decisión.", service1: "Chequeo de decisión", service2: "Validación de mercado", service3: "Revisión de oportunidad empresarial",
        service1p: "Una pregunta, señales de demanda/comprador, competidores y Red Team.", service2p: "Investigación más profunda con seguimiento.", service3p: "Decisiones grandes o multi-mercado con memo ejecutivo.",
        processTitle: "De pregunta a acción", p1: "ENTRADA", p2: "EVIDENCIA", p3: "RED TEAM", p4: "ACCIÓN",
        packages: "Fase piloto gratuita", startTitle: "Dile a HUNT OPS qué decisión necesitas tomar.", submit: "Enviar solicitud piloto gratis",
        name: "Nombre", email: "Email", company: "Empresa / proyecto", website: "Web", market: "Mercado / nicho", package: "Tipo de piloto", challenge: "¿Con qué decisión necesitas ayuda?",
        truth: "No garantizamos resultados financieros. Evidencia, supuestos e incógnitas permanecen separados."
      },
      fr: {
        brandSub: "INTELLIGENCE BUSINESS", heroLabel: "PLATEFORME DE DÉCISION", heroTitle: "Centre de contrôle des décisions business",
        heroSub: "SIGNAUX RÉELS · RISQUES CLAIRS · MEILLEURES ACTIONS",
        navOverview: "Vue", navServices: "Services", navAdvisor: "Conseiller", navProcess: "Processus", navStart: "Démarrer",
        active: "Recherches actives", delivered: "Pilotes terminés", pipeline: "Demandes business", risks: "Demandes du site",
        advisor: "HUNT Advisor", advisorSub: "VOTRE ASSISTANT DE DÉCISION BUSINESS",
        advisorQuote: "Transformez une question complexe en preuves, risques, acheteurs et prochaines actions claires.",
        a1: "Résumer la décision", a2: "Trouver des preuves acheteurs", a3: "Identifier les risques", a4: "Générer les actions",
        servicesTitle: "Une intelligence business qui se termine par une décision.", service1: "Vérification de décision", service2: "Validation de marché", service3: "Revue d'opportunité entreprise",
        service1p: "Une question ciblée, demande/acheteurs, concurrence et Red Team.", service2p: "Recherche plus profonde avec suivi.", service3p: "Décision majeure ou multi-marché avec memo exécutif.",
        processTitle: "De la question à l'action", p1: "ENTRÉE", p2: "PREUVES", p3: "RED TEAM", p4: "ACTION",
        packages: "Phase pilote gratuite", startTitle: "Dites à HUNT OPS quelle décision vous devez prendre.", submit: "Envoyer une demande pilote gratuite",
        name: "Nom", email: "Email", company: "Entreprise / projet", website: "Site", market: "Marché / niche", package: "Type de pilote", challenge: "Pour quelle décision avez-vous besoin d'aide ?",
        truth: "Aucun résultat financier garanti. Preuves, hypothèses et inconnues restent séparées."
      }
    }
  };

  function langFromBrowser() {
    const raw = (navigator.language || "en").toLowerCase();
    if (raw.startsWith("ar")) return "ar";
    if (raw.startsWith("he") || raw.startsWith("iw")) return "he";
    if (raw.startsWith("es")) return "es";
    if (raw.startsWith("fr")) return "fr";
    return "en";
  }

  function apply(page, lang) {
    const safe = pages[page]?.[lang] ? lang : "en";
    const dict = {...common[safe], ...pages[page][safe]};
    document.documentElement.lang = safe;
    document.documentElement.dir = RTL.has(safe) ? "rtl" : "ltr";
    document.body.dataset.lang = safe;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll("[data-lang-select]").forEach(el => { el.value = safe; });
    localStorage.setItem("hunt_language", safe);
    window.dispatchEvent(new CustomEvent("hunt:language", {detail:{lang:safe, dict}}));
    return dict;
  }

  window.HuntI18n = {
    start(page) {
      const selected = localStorage.getItem("hunt_language") || langFromBrowser();
      const run = lang => apply(page, lang);
      document.querySelectorAll("[data-lang-select]").forEach(el => {
        el.addEventListener("change", () => run(el.value));
      });
      return run(selected);
    },
    apply
  };
})();
