(() => {
  "use strict";

  const H = window.HuntCore;
  const Core = window.BoomGrowthOSCore;
  const sb = window.supabase;
  if (!H || !Core || !sb?.createClient) return;

  const BASE = "https://zszlnahjqmwozwubetkm.supabase.co";
  const client = window.HuntSupabaseClient || sb.createClient(BASE, H.publishableKey);
  if (!window.HuntSupabaseClient) window.HuntSupabaseClient = client;
  const $ = (q) => document.querySelector(q);
  let session = null;

  function status(text, tone = "") {
    const el = $("#bg-status");
    if (!el) return;
    el.hidden = false;
    el.dataset.tone = tone;
    el.innerHTML = "<strong>" + H.esc(text) + "</strong>";
  }

  function money(value, currency = "USD") {
    return Number.isFinite(Number(value)) ? H.money(Number(value), currency) : "—";
  }

  function percent(value) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(1) + "%" : "—";
  }

  async function ownerFunction(slug) {
    const res = await fetch(BASE + "/functions/v1/" + slug, {
      headers: {
        apikey: H.publishableKey,
        Authorization: "Bearer " + session.access_token
      },
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok !== true) throw new Error(data.error || slug + " failed");
    return data;
  }

  async function loadData() {
    const [mission, launch, econRes, dealRes, experimentRes, radarRes, briefRes, distributionRes, catalogRes, identityRes, seoAudit] = await Promise.all([
      ownerFunction("hunt-owner-mission-control"),
      ownerFunction("hunt-launch-readiness"),
      client.from("hunt_unit_economics")
        .select("provider,item_id,variant_id,destination_country,quantity,currency,sale_price_per_unit,supplier_cost_per_unit,customer_shipping_amount,supplier_shipping_cost,payment_reserve,refund_reserve,platform_cost,inputs_verified,profit_gate_status,contribution_before_coupon,contribution_margin,min_required_contribution,max_safe_cac,max_safe_coupon_amount,max_safe_coupon_rate,calculation,calculated_at")
        .order("calculated_at", {ascending:false})
        .limit(120),
      client.from("hunt_deal_candidates")
        .select("id,provider,item_id,title_snapshot,status,deal_score,current_price,reference_price,currency,discount_percent,profit_gate_status,max_safe_coupon_amount,truth_status,updated_at")
        .order("updated_at", {ascending:false})
        .limit(120),
      client.from("hunt_marketing_experiments")
        .select("id,title,channel,objective,paid,owner_approval_status,status,hypothesis,primary_kpi,updated_at")
        .order("updated_at", {ascending:false})
        .limit(80),
      client.from("hunt_boom_world_ideas")
        .select("id,title,domain,status,priority,user_value,complexity,next_action,evidence_note,last_verified_at,updated_at")
        .order("updated_at", {ascending:false})
        .limit(80),
      client.from("hunt_growth_daily_briefs")
        .select("day,generated_at,status,funnel,economics,marketing,creative,seo,love,publisher,learning,next_move,notes")
        .order("day",{ascending:false})
        .limit(1)
        .maybeSingle(),
      client.from("hunt_distribution_drafts")
        .select("id,day,channel,provider,item_id,status,owner_approved,utm_source,utm_medium,utm_campaign,utm_content,created_at")
        .order("created_at",{ascending:false})
        .limit(80),
      client.from("hunt_catalog_products")
        .select("provider,item_id,category,title,image_url,price_amount,currency,price_basis,availability_verified,source_fresh_at,updated_at,brand,ean,supplier_sku,product_line,volume_ml,concentration,gender,stock_quantity,source_region,authenticity_status,market_eligibility_status,market_restrictions,last_stock_check_at")
        .order("source_fresh_at",{ascending:false,nullsFirst:false})
        .limit(300),
      client.from("hunt_business_identity")
        .select("id,legal_entity_name,registration_number,registered_country,business_address,support_email,returns_address,privacy_contact_email,status,owner_approved,updated_at")
        .eq("id","primary")
        .maybeSingle(),
      fetch("boom-seo-audit.json?v=os3",{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]);

    if (econRes.error) throw econRes.error;
    if (dealRes.error) throw dealRes.error;
    if (experimentRes.error) throw experimentRes.error;
    if (radarRes.error) throw radarRes.error;
    if (briefRes.error) throw briefRes.error;
    if (distributionRes.error) throw distributionRes.error;
    if (catalogRes.error) throw catalogRes.error;
    if (identityRes.error) throw identityRes.error;

    const economics = econRes.data || [];
    const econMap = new Map();
    for (const row of economics) {
      const key = String(row.provider || "") + ":" + String(row.item_id || "");
      if (!econMap.has(key)) econMap.set(key, row);
    }
    const deals = (dealRes.data || []).map((row) => {
      const econ = econMap.get(String(row.provider || "") + ":" + String(row.item_id || "")) || {};
      return {
        ...row,
        inputs_verified: econ.inputs_verified === true,
        contribution_before_coupon: econ.contribution_before_coupon,
        max_safe_cac: econ.max_safe_cac,
        profit_gate_status: row.profit_gate_status || econ.profit_gate_status || ""
      };
    });

    const catalog = catalogRes.data || [];
    const identity = identityRes.data || {};
    const Passport = window.BoomCommercePassport;
    const identityReady = identity.owner_approved === true
      && Boolean(identity.legal_entity_name)
      && Boolean(identity.registration_number)
      && Boolean(identity.business_address)
      && Boolean(identity.support_email)
      && Boolean(identity.privacy_contact_email)
      && Boolean(identity.returns_address);

    const isSourceFresh = (value) => {
      const ts = Date.parse(String(value || ""));
      return Number.isFinite(ts) && Date.now() - ts <= 7 * 24 * 60 * 60 * 1000;
    };
    const canonicalBase = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname) ? "" : location.origin;
    const passports = Passport?.build ? catalog.map((row) => {
      const key = String(row.provider || "") + ":" + String(row.item_id || "");
      const econ = econMap.get(key) || {};
      let canonicalUrl = "";
      try {
        if (canonicalBase) canonicalUrl = new URL(H.productUrl(row), canonicalBase + "/").href;
      } catch {}
      const product = {
        ...row,
        description: "",
        sku: row.supplier_sku || "",
        gtin: row.ean || "",
        retail_price_verified: econ.inputs_verified === true && String(econ.profit_gate_status || "").toUpperCase() === "PASS",
        retail_price_amount: econ.sale_price_per_unit,
        retail_currency: econ.currency || row.currency || "USD",
        profit_gate_status: econ.profit_gate_status || "",
        stock_check_required: true
      };
      return Passport.build(product, {
        canonical_url: canonicalUrl,
        merchant_identity_ready: identityReady,
        shipping_policy_ready: false,
        returns_policy_ready: false,
        source_fresh: isSourceFresh(row.source_fresh_at),
        feed_availability_verified: false,
        variant_availability_feed_ready: false,
        checkout_ready: false,
        payment_ready: false,
        order_ready: false,
        tracking_ready: false,
        attribution_ready: false,
        owner_paid_approval: false,
        connected_channels: {
          google_free_listings: false,
          google_ai: false,
          meta_catalog: false,
          tiktok_catalog: false,
          pinterest_catalog: false,
          agentic_ucp: false,
          organic_social: false,
          paid_media: false
        },
        unit_economics: econ
      });
    }) : [];

    const passportSummary = Passport?.summarize?.(passports) || {total:0,channels:{}};
    const GoogleFeed = window.BoomGoogleAiFeed;
    const configuredFeedLabel = String(
      launch.summary?.google_feed_label ||
      launch.summary?.merchant_feed_label ||
      ""
    ).trim();
    const googleFeedPreview = GoogleFeed?.buildBatch
      ? GoogleFeed.buildBatch(passports,{
          feedLabel:configuredFeedLabel,
          contentLanguage:String(launch.summary?.content_language||"en")
        })
      : {total:passports.length,export_ready:0,publish_ready:0,blocked:passports.length,top_blockers:[],network_calls:0,external_publish:false,owner_gate:"REVIEW_REQUIRED"};

    const Control=window.BoomProfitFeedControlTower;
    const controlRows=Control?.evaluate ? passports.map(passport=>{
      const econ=econMap.get(passport.product_key)||{};
      const feedInput=GoogleFeed?.buildProductInput
        ? GoogleFeed.buildProductInput(passport,{
            feedLabel:configuredFeedLabel,
            contentLanguage:String(launch.summary?.content_language||"en")
          })
        : null;
      return Control.evaluate({
        passport,
        econ,
        feedInput,
        measurement:{
          attribution_ready:false,
          server_event_id_persisted:false,
          owner_paid_approval:false
        },
        performance:{}
      });
    }) : [];
    const controlSummary=Control?.summarize?.(controlRows)||{
      total:0,
      external:{promote_candidate:0,prepare:0,hold:0,stop:0},
      paid:{test_candidate:0,hold:0},
      scale:{scale_candidate:0,hold:0},
      verified_economics:0,
      safe_cac_range:null,
      top_reasons:[],
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    };

    const CreativeFactory=window.BoomCreativeFactory;
    const ClaimFirewall=window.BoomClaimFirewall;
    const creativeInputs=passports.map((passport,index)=>({
      passport,
      control:controlRows[index]||{},
      firewall:ClaimFirewall
    }));
    const creativeBatch=CreativeFactory?.buildBatch
      ? CreativeFactory.buildBatch(creativeInputs)
      : {total:creativeInputs.length,candidates:0,safe_drafts:0,blocked_drafts:0,outputs:[],external_publish:false,owner_gate:"REVIEW_REQUIRED"};
    const creativeBlockers=new Map();
    for(const row of creativeBatch.outputs||[]){
      for(const reason of row?.candidate?.reasons||[]){
        creativeBlockers.set(reason,(creativeBlockers.get(reason)||0)+1);
      }
      for(const draft of row?.drafts||[]){
        for(const violation of draft?.claim_firewall?.violations||[]){
          const code="claim:"+String(violation);
          creativeBlockers.set(code,(creativeBlockers.get(code)||0)+1);
        }
      }
    }
    const creativeTopBlockers=[...creativeBlockers.entries()]
      .map(([reason,count])=>({reason,count}))
      .sort((a,b)=>b.count-a.count||a.reason.localeCompare(b.reason))
      .slice(0,12);

    const OfferChess=window.BoomOfferChess;
    const offerRows=OfferChess?.evaluate ? passports.map((passport,index)=>{
      const econ=econMap.get(passport.product_key)||{};
      return {
        product_key:passport.product_key,
        title:passport.identity?.title||passport.product_key,
        result:OfferChess.evaluate({
          econ,
          control:controlRows[index]||{},
          context:{
            objective:"conversion_test",
            shipping_verified:econ.inputs_verified===true,
            bundle_preview_verified:false,
            min_meaningful_coupon_amount:0.50,
            min_meaningful_coupon_rate:0.05
          }
        })
      };
    }) : [];
    const offerSummary=OfferChess?.summarize?.(offerRows.map(x=>x.result))||{
      total:0,hold:0,no_offer:0,coupon_candidate:0,shipping_candidate:0,bundle_candidate:0,
      safe_coupon_range:null,application_enabled:false,external_publish:false,owner_gate:"REVIEW_REQUIRED"
    };
    const offerCandidates=offerRows.filter(row=>!["HOLD","NO_OFFER"].includes(row.result?.recommendation)).slice(0,12);
    const offerBlockers=new Map();
    for(const row of offerRows){
      for(const blocker of row.result?.blockers||[])offerBlockers.set(blocker,(offerBlockers.get(blocker)||0)+1);
    }
    const offerTopBlockers=[...offerBlockers.entries()]
      .map(([blocker,count])=>({blocker,count}))
      .sort((a,b)=>b.count-a.count||a.blocker.localeCompare(b.blocker))
      .slice(0,10);
    const Lifecycle=window.BoomLifecycleBrain;
    const lifecycleRows=Lifecycle?.systemReadiness?.({
      marketing_consent_infrastructure:false,
      real_order_events_ready:false,
      tracking_events_ready:false,
      channels:{
        email:{connected:false,send_enabled:false},
        push:{connected:false,send_enabled:false},
        sms:{connected:false,send_enabled:false},
        whatsapp:{connected:false,send_enabled:false}
      }
    })||[];
    const lifecycleSummary=Lifecycle?.summarize?.(lifecycleRows)||{
      total:0,prepare:0,draft_ready:0,send_candidate:0,locked_or_hold:0,external_send:false,owner_gate:"REVIEW_REQUIRED"
    };
    const lifecycleBlockerCounts=new Map();
    for(const row of lifecycleRows){
      for(const blocker of row.blockers||[])lifecycleBlockerCounts.set(blocker,(lifecycleBlockerCounts.get(blocker)||0)+1);
    }
    const lifecycleTopBlockers=[...lifecycleBlockerCounts.entries()]
      .map(([blocker,count])=>({blocker,count}))
      .sort((a,b)=>b.count-a.count||a.blocker.localeCompare(b.blocker))
      .slice(0,10);
    const blockerCounts = new Map();
    for (const passport of passports) {
      const productBlockers = new Set();
      for (const channel of ["google_free_listings","google_ai","agentic_ucp","organic_social","paid_media"]) {
        for (const blocker of passport?.channels?.[channel]?.blockers || []) productBlockers.add(blocker);
        for (const blocker of passport?.channels?.[channel]?.transaction_blockers || []) productBlockers.add(blocker);
      }
      for (const blocker of productBlockers) blockerCounts.set(blocker, (blockerCounts.get(blocker) || 0) + 1);
    }
    const passportBlockers = [...blockerCounts.entries()]
      .map(([blocker,count]) => ({blocker,count}))
      .sort((a,b) => b.count - a.count || a.blocker.localeCompare(b.blocker))
      .slice(0,12);

    return {
      snapshot: mission.snapshot || {},
      missionRecommendation: mission.recommendation || {},
      launchSummary: launch.summary || {},
      economics,
      deals,
      experiments: experimentRes.data || [],
      worldIdeas: radarRes.data || [],
      dailyBrief: briefRes.data || null,
      distributionDrafts: distributionRes.data || [],
      catalog,
      businessIdentity: identity,
      businessIdentityReady: identityReady,
      passports,
      passportSummary,
      passportBlockers,
      configuredFeedLabel,
      googleFeedPreview,
      controlRows,
      controlSummary,
      creativeBatch,
      creativeTopBlockers,
      offerRows,
      offerSummary,
      offerCandidates,
      offerTopBlockers,
      lifecycleRows,
      lifecycleSummary,
      lifecycleTopBlockers,
      seoAudit
    };
  }

  function renderFunnel(f) {
    const rows = [
      ["Sessions", f.sessions, "100% entry"],
      ["Product views", f.productViews, f.productViewsPerSession == null ? "—" : f.productViewsPerSession.toFixed(2) + " / session"],
      ["Add to cart", f.carts, percent(f.productViewToCartPct) + " of product views"],
      ["Checkout", f.checkouts, percent(f.cartToCheckoutPct) + " of carts"],
      ["Orders", f.orders, percent(f.checkoutToOrderPct) + " of checkout"]
    ];
    $("#bg-funnel").innerHTML = rows.map(([label, value, meta]) =>
      '<div class="bg-step"><small>' + H.esc(label) + '</small><strong>' + H.esc(value) + '</strong><small>' + H.esc(meta) + '</small></div>'
    ).join("");
  }

  function renderMilestones(rows) {
    $("#bg-milestones").innerHTML = rows.map((row) =>
      '<div class="bg-row"><div class="bg-row-head"><strong>' + money(row.target) + ' net/day</strong><span class="bg-score">' +
      (row.minimumOrdersAtContribution == null ? "—" : H.esc(row.minimumOrdersAtContribution)) +
      '</span></div><small>' +
      (row.minimumOrdersAtContribution == null
        ? "Need verified positive contribution data first."
        : "minimum orders/day at verified contribution of " + money(row.contributionPerOrder) + " before acquisition cost and remaining overhead") +
      '</small></div>'
    ).join("");
  }

  function renderDeals(rows) {
    const active = rows.filter((row) => !["rejected","expired"].includes(String(row.status || "").toLowerCase())).slice(0, 12);
    $("#bg-deal-list").innerHTML = active.length ? active.map((row) => {
      const b = row.boom;
      const blockers = b.blockers.length ? " · Blockers: " + b.blockers.join(", ") : "";
      return '<article class="bg-row"><div class="bg-row-head"><div><strong>' +
        H.esc(row.title_snapshot || row.item_id || "Deal candidate") +
        '</strong><small>' + H.esc(row.provider || "HUNT") + ' · ' + H.esc(row.status || "candidate") + '</small></div><span class="bg-score">' +
        H.esc(b.score) + '/100</span></div><small>Profit gate: ' +
        H.esc(row.profit_gate_status || "unknown") + ' · Safe CAC: ' + money(row.max_safe_cac, row.currency || "USD") +
        H.esc(blockers) + '</small></article>';
    }).join("") : '<div class="bg-empty">No active deal candidates yet. BOOM will not invent them.</div>';
  }

  function renderLaunch(launch) {
    const states = [
      ["Soft launch", launch.soft],
      ["Real money", launch.money],
      ["Paid marketing", launch.paid]
    ];
    $("#bg-launch").innerHTML = states.map(([label, state]) =>
      '<div class="bg-row"><div class="bg-row-head"><strong>' + H.esc(label) + '</strong><span class="bg-score">' + H.esc(state) + '</span></div></div>'
    ).join("");
  }


  function renderPassports(data) {
    const summary = data.passportSummary || {total:0,channels:{}};
    const version = window.BoomCommercePassport?.VERSION || "—";
    const versionEl = $("#bg-passport-version");
    if (versionEl) versionEl.textContent = version;

    const stats = [
      ["Catalog passports", summary.total || 0],
      ["Verified retail", summary.price_verified || 0],
      ["Feed-safe availability", summary.availability_exportable || 0],
      ["Merchant identity ready", summary.merchant_identity_ready || 0]
    ];
    const statHost = $("#bg-passport-stats");
    if (statHost) statHost.innerHTML = stats.map(([label,value]) =>
      '<article class="bg-passport-stat"><strong>' + H.esc(value) + '</strong><small>' + H.esc(label) + '</small></article>'
    ).join("");

    const labels = {
      google_free_listings:"Google Free Listings",
      google_ai:"Google AI commerce",
      agentic_ucp:"Agentic / UCP",
      organic_social:"Organic social",
      pinterest_catalog:"Pinterest catalog",
      paid_media:"Paid media"
    };
    const channelHost = $("#bg-passport-channels");
    if (channelHost) channelHost.innerHTML = Object.entries(labels).map(([key,label]) => {
      const row = summary.channels?.[key] || {};
      const dataReady = Number(row.data_ready || 0);
      const ready = Number(row.ready || 0);
      const txReady = Number(row.transaction_ready || 0);
      const state = ready > 0 ? "READY" : dataReady > 0 ? "PREPARE" : "BLOCKED";
      const tone = ready > 0 ? "bg-passport-ready" : dataReady > 0 ? "bg-passport-prepare" : "bg-passport-blocked";
      const tx = key === "agentic_ucp" ? " · Transaction " + txReady : "";
      return '<article class="bg-row"><div class="bg-row-head"><strong>' + H.esc(label) +
        '</strong><span class="bg-score ' + tone + '">' + H.esc(state) + '</span></div><small>Data ready ' +
        H.esc(dataReady) + ' · Connected ready ' + H.esc(ready) + H.esc(tx) + '</small></article>';
    }).join("");

    const blockerHost = $("#bg-passport-blockers");
    const blockers = Array.isArray(data.passportBlockers) ? data.passportBlockers : [];
    if (blockerHost) blockerHost.innerHTML = blockers.length
      ? blockers.map(row => '<article class="bg-row"><div class="bg-row-head"><strong>' +
          H.esc(String(row.blocker || "").replaceAll("_"," ")) +
          '</strong><span class="bg-score">' + H.esc(row.count || 0) + '</span></div><small>SKUs affected</small></article>').join("")
      : '<div class="bg-empty">No passport blockers found.</div>';
  }


  function renderGoogleFeed(data) {
    const feed=data.googleFeedPreview||{total:0,export_ready:0,publish_ready:0,blocked:0,top_blockers:[],network_calls:0,external_publish:false};
    const state=$("#bg-google-feed-state");
    if(state)state.textContent=feed.publish_ready>0?"READY FOR OWNER REVIEW":feed.export_ready>0?"EXPORT DRAFT READY":"BLOCKED";

    const stats=[
      ["Passports checked",feed.total||0],
      ["Export ready",feed.export_ready||0],
      ["Publish ready",feed.publish_ready||0],
      ["Blocked",feed.blocked||0]
    ];
    const statsHost=$("#bg-google-feed-stats");
    if(statsHost)statsHost.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const contract=$("#bg-google-feed-contract");
    if(contract){
      const label=data.configuredFeedLabel||"NOT CONFIGURED";
      const rows=[
        ["Feed label",label,data.configuredFeedLabel?"explicit target market/config":"must be configured; HUNT does not assume a country"],
        ["Network calls",feed.network_calls||0,"validator only"],
        ["External publish",feed.external_publish===true?"ON":"OFF","owner-gated"],
        ["Owner gate",feed.owner_gate||"REVIEW_REQUIRED","required before any live insert"]
      ];
      contract.innerHTML=rows.map(([name,value,note])=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div><small>'+H.esc(note)+'</small></article>'
      ).join("");
    }

    const blockers=$("#bg-google-feed-blockers");
    const rows=Array.isArray(feed.top_blockers)?feed.top_blockers:[];
    if(blockers)blockers.innerHTML=rows.length
      ? rows.slice(0,10).map(row=>
          '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.blocker||"").replaceAll("_"," "))+
          '</strong><span class="bg-score">'+H.esc(row.count||0)+'</span></div><small>ProductInput drafts affected</small></article>'
        ).join("")
      : '<div class="bg-empty">No feed blockers found in the current preview.</div>';
  }


  function measurementReadiness() {
    const Hub=window.BoomMeasurementHub;
    const cfg=window.HUNT_ANALYTICS_CONFIG||{};
    let consent=false;
    try{ consent=localStorage.getItem("hunt_analytics_consent_v1")==="granted"; }catch{}
    const ga4Configured=/^G-[A-Z0-9]+$/i.test(String(cfg.ga4MeasurementId||"").trim());
    const readiness=Hub?.destinationReadiness?.({
      consent_granted:consent,
      ga4_configured:ga4Configured,
      first_party_configured:true,
      server_event_id_persisted:false,
      google_ads_data_manager_connected:false,
      meta_capi_connected:false,
      tiktok_events_api_connected:false,
      pinterest_conversions_api_connected:false
    })||{};
    return {
      version:Hub?.VERSION||"—",
      consent,
      readiness,
      summary:Hub?.summarize?.(readiness)||{total:0,active:0,partial:0,locked:0,external_send_enabled:false}
    };
  }

  function renderMeasurementHub() {
    const data=measurementReadiness();
    const state=$("#bg-measurement-state");
    if(state)state.textContent=data.summary.external_send_enabled?"EXTERNAL SEND ON":"EXTERNAL SEND OFF";

    const stats=[
      ["Destinations",data.summary.total||0],
      ["Active",data.summary.active||0],
      ["Partial / prepare",data.summary.partial||0],
      ["Locked",data.summary.locked||0]
    ];
    const statsHost=$("#bg-measurement-stats");
    if(statsHost)statsHost.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const labels={
      ga4:"GA4",
      first_party:"HUNT first-party",
      google_ads_data_manager:"Google Ads / Data Manager",
      meta_capi:"Meta Conversions API",
      tiktok_events_api:"TikTok Events API",
      pinterest_conversions_api:"Pinterest Conversions API"
    };
    const host=$("#bg-measurement-destinations");
    if(host)host.innerHTML=Object.entries(labels).map(([key,label])=>{
      const row=data.readiness?.[key]||{};
      const tone=row.state==="ACTIVE"?"bg-passport-ready":row.state==="PARTIAL"||row.state==="PREPARE"?"bg-passport-prepare":"bg-passport-blocked";
      return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+
        '</strong><span class="bg-score '+tone+'">'+H.esc(row.state||"LOCKED")+'</span></div><small>'+
        'Connected '+H.esc(row.connected===true?"yes":"no")+
        ' · event_id '+H.esc(row.event_id_ready===true?"ready":"not persisted")+
        ' · send '+H.esc(row.send_enabled===true?"on":"off")+
        '</small></article>';
    }).join("");

    const gapCounts=new Map();
    for(const row of Object.values(data.readiness||{})){
      for(const blocker of row?.blockers||[])gapCounts.set(blocker,(gapCounts.get(blocker)||0)+1);
    }
    const gaps=[...gapCounts.entries()].map(([blocker,count])=>({blocker,count}))
      .sort((a,b)=>b.count-a.count||a.blocker.localeCompare(b.blocker));
    const gapHost=$("#bg-measurement-gaps");
    if(gapHost)gapHost.innerHTML=[
      '<article class="bg-row"><div class="bg-row-head"><strong>Measurement version</strong><span class="bg-score">'+H.esc(data.version)+'</span></div><small>Canonical event envelope</small></article>',
      '<article class="bg-row"><div class="bg-row-head"><strong>Analytics consent</strong><span class="bg-score">'+H.esc(data.consent?"GRANTED":"NOT GRANTED")+'</span></div><small>Runtime gate; no bypass</small></article>',
      ...gaps.map(row=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.blocker).replaceAll("_"," "))+
        '</strong><span class="bg-score">'+H.esc(row.count)+'</span></div><small>Destinations affected</small></article>')
    ].join("");
  }


  function renderControlTower(data){
    const s=data.controlSummary||{};
    const state=$("#bg-control-state");
    if(state)state.textContent=s.execute_actions===true?"EXECUTION ON":"EXECUTION OFF";

    const range=s.safe_cac_range
      ? "$"+Number(s.safe_cac_range.min||0).toFixed(2)+"–$"+Number(s.safe_cac_range.max||0).toFixed(2)
      : "—";
    const stats=[
      ["SKUs evaluated",s.total||0],
      ["Verified economics",s.verified_economics||0],
      ["External HOLD",(s.external?.hold||0)+(s.external?.stop||0)],
      ["Safe CAC range",range]
    ];
    const host=$("#bg-control-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const stateHost=$("#bg-control-states");
    if(stateHost){
      const rows=[
        ["External promote candidate",s.external?.promote_candidate||0],
        ["External prepare",s.external?.prepare||0],
        ["External hold / stop",(s.external?.hold||0)+(s.external?.stop||0)],
        ["Paid test candidate",s.paid?.test_candidate||0],
        ["Paid hold",s.paid?.hold||0],
        ["Scale candidate",s.scale?.scale_candidate||0],
        ["Scale hold",s.scale?.hold||0]
      ];
      stateHost.innerHTML=rows.map(([label,value])=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div></article>'
      ).join("");
    }

    const reasons=$("#bg-control-reasons");
    const rows=Array.isArray(s.top_reasons)?s.top_reasons:[];
    if(reasons)reasons.innerHTML=rows.length
      ? rows.slice(0,12).map(row=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.reason||"").replaceAll("_"," "))+
        '</strong><span class="bg-score">'+H.esc(row.count||0)+'</span></div><small>SKUs affected</small></article>'
      ).join("")
      : '<div class="bg-empty">No stop/hold reasons found.</div>';
  }


  function renderCreativeFactory(data){
    const batch=data.creativeBatch||{total:0,candidates:0,safe_drafts:0,blocked_drafts:0,outputs:[],external_publish:false};
    const state=$("#bg-creative-state");
    if(state)state.textContent=batch.external_publish===true?"PUBLISH ON":"DRAFT ONLY";

    const videoBriefs=(batch.outputs||[]).filter(x=>x?.video_brief).length;
    const stats=[
      ["SKUs checked",batch.total||0],
      ["Creative candidates",batch.candidates||0],
      ["Safe drafts",batch.safe_drafts||0],
      ["Blocked drafts",batch.blocked_drafts||0]
    ];
    const host=$("#bg-creative-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const output=$("#bg-creative-output");
    if(output){
      const rows=[
        ["Channel templates","Google asset · Meta Reels · TikTok · Pinterest · Onsite"],
        ["Video briefs",videoBriefs],
        ["External publish",batch.external_publish===true?"ON":"OFF"],
        ["Owner gate",batch.owner_gate||"REVIEW_REQUIRED"]
      ];
      output.innerHTML=rows.map(([label,value])=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div></article>'
      ).join("");
    }

    const blockers=$("#bg-creative-blockers");
    const rows=Array.isArray(data.creativeTopBlockers)?data.creativeTopBlockers:[];
    if(blockers)blockers.innerHTML=rows.length
      ? rows.map(row=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.reason||"").replaceAll("_"," "))+
        '</strong><span class="bg-score">'+H.esc(row.count||0)+'</span></div><small>SKUs / drafts affected</small></article>'
      ).join("")
      : '<div class="bg-empty">No creative blockers found.</div>';
  }


  function renderOfferChess(data){
    const s=data.offerSummary||{};
    const state=$("#bg-offer-state");
    if(state)state.textContent=s.application_enabled===true?"APPLICATION ON":"APPLICATION OFF";

    const range=s.safe_coupon_range
      ? "$"+Number(s.safe_coupon_range.min||0).toFixed(2)+"–$"+Number(s.safe_coupon_range.max||0).toFixed(2)
      : "—";
    const stats=[
      ["SKUs evaluated",s.total||0],
      ["NO OFFER",s.no_offer||0],
      ["Coupon candidates",s.coupon_candidate||0],
      ["Safe coupon range",range]
    ];
    const host=$("#bg-offer-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const candidates=$("#bg-offer-candidates");
    const rows=Array.isArray(data.offerCandidates)?data.offerCandidates:[];
    if(candidates)candidates.innerHTML=rows.length
      ? rows.map(row=>{
          const r=row.result||{};
          const selected=r.selected||{};
          const amount=Number(selected.max_discount_amount||selected.max_subsidy_amount||0);
          const amountText=amount>0?money(amount,r.economics?.currency||"USD"):"";
          return '<article class="bg-row"><div class="bg-row-head"><div><strong>'+H.esc(row.title||row.product_key)+
            '</strong><small>'+H.esc(row.product_key||"")+'</small></div><span class="bg-score">'+H.esc(r.recommendation||"HOLD")+
            '</span></div><small>'+H.esc(amountText?("Max safe value "+amountText):"Verified candidate; checkout revalidation required")+
            ' · application '+H.esc(r.application_enabled===true?"ON":"OFF")+'</small></article>';
        }).join("")
      : '<div class="bg-empty">No meaningful verified offer candidate yet. BOOM prefers no offer to a misleading or trivial discount.</div>';

    const blockers=$("#bg-offer-blockers");
    const blocked=Array.isArray(data.offerTopBlockers)?data.offerTopBlockers:[];
    const summaryRows=[
      {blocker:"HOLD",count:s.hold||0},
      {blocker:"Shipping candidates",count:s.shipping_candidate||0},
      {blocker:"Bundle candidates",count:s.bundle_candidate||0}
    ];
    if(blockers)blockers.innerHTML=[...summaryRows,...blocked].map(row=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.blocker||"").replaceAll("_"," "))+
      '</strong><span class="bg-score">'+H.esc(row.count||0)+'</span></div></article>'
    ).join("");
  }


  function renderLifecycleBrain(data){
    const s=data.lifecycleSummary||{};
    const rows=Array.isArray(data.lifecycleRows)?data.lifecycleRows:[];
    const state=$("#bg-lifecycle-state");
    if(state)state.textContent=s.external_send===true?"SEND ON":"SEND OFF";
    const service=rows.filter(x=>x.class==="service");
    const marketing=rows.filter(x=>x.class==="marketing");
    const stats=[
      ["Trigger lanes",s.total||0],
      ["Service lanes",service.length],
      ["Marketing lanes",marketing.length],
      ["Send candidates",s.send_candidate||0]
    ];
    const host=$("#bg-lifecycle-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");
    const lanes=$("#bg-lifecycle-lanes");
    if(lanes)lanes.innerHTML=rows.map(row=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.trigger||"").replaceAll("_"," "))+
      '</strong><span class="bg-score">'+H.esc(row.state||"LOCKED")+'</span></div><small>'+
      H.esc(row.class||"")+' · connected channels '+H.esc((row.connected_channels||[]).length)+'</small></article>'
    ).join("")||'<div class="bg-empty">No lifecycle lanes loaded.</div>';
    const blockers=$("#bg-lifecycle-blockers");
    const blocked=Array.isArray(data.lifecycleTopBlockers)?data.lifecycleTopBlockers:[];
    if(blockers)blockers.innerHTML=blocked.length?blocked.map(row=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.blocker||"").replaceAll("_"," "))+
      '</strong><span class="bg-score">'+H.esc(row.count||0)+'</span></div><small>Trigger lanes affected</small></article>'
    ).join(""):'<div class="bg-empty">No lifecycle blockers found.</div>';
  }

  function renderOperating(plan, data) {
    const Marketing = window.BoomMarketingBrain;
    const Seo = window.BoomSeoBrain;
    const Love = window.BoomLoveEngine;
    const Publisher = window.BoomEverywherePublisher;
    const Learning = window.BoomLearningLoop;

    const marketing = Marketing?.build?.({plan,data,passportSummary:data.passportSummary}) || {channels:[],primary:null,eligibleDeals:0};
    const creative = (data.creativeBatch?.outputs||[])
      .flatMap(row=>row?.drafts||[])
      .filter(draft=>draft?.claim_firewall?.pass===true);
    const publisherDrafts = Publisher?.buildDrafts?.(creative) || [];
    const backendDrafts = Array.isArray(data.distributionDrafts) ? data.distributionDrafts : [];
    const dailyBrief = data.dailyBrief || null;
    const love = Love?.measure?.(data.snapshot?.today || {}) || {score:0,confidence:"unknown",next:"No Love Engine data."};

    const pageSeo = (data.seoAudit?.pages || []).map(page => ({
      page:page.file,
      result:Seo?.evaluate?.(page) || {score:0,missing:[],actions:[]}
    }));
    const seoScore = pageSeo.length
      ? Math.round(pageSeo.reduce((sum,row)=>sum+Number(row.result.score||0),0)/pageSeo.length)
      : 0;
    const seoActions = [...new Set(pageSeo.flatMap(row=>row.result.actions||[]))];

    const exp = plan.recommendedExperiment;
    const learning = exp
      ? (Learning?.decide?.(exp,{sampleSize:Number(plan.funnel.sessions||0)}) || {decision:"collect",reason:"Learning engine unavailable.",next:"Collect evidence."})
      : {decision:"prepare",reason:"No active experiment selected.",next:"Prepare a measurable experiment."};

    const brainRows = [
      ["Marketing", marketing.primary ? "LIVE" : "READY"],
      ["Commerce Passport", (data.passportSummary?.total || 0) + " SKUs"],
      ["Creative", creative.length ? creative.length + " DRAFTS" : "WAIT EVIDENCE"],
      ["SEO", seoScore + "/100"],
      ["Love", love.confidence.toUpperCase()],
      ["Publisher", backendDrafts.length ? backendDrafts.length + " DRAFTS" : (publisherDrafts.length ? publisherDrafts.length + " READY" : "DRAFT-ONLY")],
      ["Learning", String(learning.decision || "READY").toUpperCase()]
    ];
    $("#bg-brains").innerHTML = brainRows.map(([name,state]) =>
      '<div class="bg-step"><small>' + H.esc(name) + '</small><strong>' + H.esc(state) + '</strong></div>'
    ).join("");

    $("#bg-marketing-title").textContent = marketing.primary
      ? String(marketing.primary.channel).replaceAll("_"," ") + " first"
      : "No channel selected";
    $("#bg-marketing-copy").textContent = marketing.primary
      ? marketing.primary.reason + " " + marketing.primary.action
      : "Waiting for verified growth evidence.";

    $("#bg-seo-title").textContent = "SEO " + seoScore + "/100";
    $("#bg-seo-copy").textContent = seoActions[0] || "Core audited pages have the required baseline SEO signals.";

    $("#bg-love-title").textContent = "Love score " + Number(love.score||0).toFixed(1);
    $("#bg-love-copy").textContent = love.next || "Collect more real return/save/like evidence.";

    const draftCount = backendDrafts.length || publisherDrafts.length;
    $("#bg-publisher-title").textContent = draftCount + " distribution drafts";
    $("#bg-publisher-copy").textContent = draftCount
      ? "Drafts have UTMs and remain owner-locked. No external post is sent automatically."
      : "No product is promotion-eligible yet, so BOOM correctly created zero outbound drafts.";

    $("#bg-learning-title").textContent = String(learning.decision || "prepare").replaceAll("_"," ");
    $("#bg-learning-copy").textContent = learning.reason + " " + learning.next;

    const nextMove = dailyBrief?.next_move || {};
    $("#bg-daily-title").textContent = nextMove.title || "Daily brief is ready";
    $("#bg-daily-status").textContent = String(nextMove.code || dailyBrief?.status || "READY").replaceAll("_"," ");
    $("#bg-daily-copy").textContent = nextMove.action
      ? nextMove.action + " · External publishing remains " + (dailyBrief?.publisher?.external_publish_enabled ? "ON" : "OFF") + "."
      : "BOOM has no daily recommendation yet.";

    $("#bg-exp-title").textContent = exp?.title || "No active experiment selected";
    $("#bg-exp-copy").textContent = exp
      ? (String(exp.paid ? "Paid" : "Free") + " · " + String(exp.channel || "channel") + " · KPI: " + String(exp.primary_kpi || "measurable outcome") + ". " + String(exp.hypothesis || ""))
      : "BOOM prefers free, measurable experiments before paid scale.";

    const radar = plan.radarFocus;
    $("#bg-radar-title").textContent = radar?.title || "No radar focus selected";
    $("#bg-radar-copy").textContent = radar
      ? (String(radar.domain || "growth") + " · " + String(radar.status || "scouted") + ". Next: " + String(radar.next_action || radar.evidence_note || "Review evidence."))
      : "Global ideas remain evidence-based and owner-controlled.";
  }

  function render(data) {
    const plan = Core.buildPlan(data);
    $("#bg-sessions").textContent = String(plan.funnel.sessions);
    $("#bg-product-views").textContent = String(plan.funnel.productViews);
    $("#bg-econ").textContent = String(plan.verifiedEconomicsCount);
    $("#bg-deals").textContent = String(plan.rankedDeals.filter((x) => !["rejected","expired"].includes(String(x.status || "").toLowerCase())).length);
    $("#bg-avg-profit").textContent = money(plan.avgVerifiedContribution);

    renderFunnel(plan.funnel);
    renderMilestones(plan.milestones);
    renderDeals(plan.rankedDeals);
    renderLaunch(plan.launch);
    renderPassports(data);
    renderGoogleFeed(data);
    renderMeasurementHub();
    renderControlTower(data);
    renderCreativeFactory(data);
    renderOfferChess(data);
    renderLifecycleBrain(data);
    renderOperating(plan, data);

    $("#bg-bottleneck-code").textContent = plan.bottleneck.code;
    $("#bg-bottleneck-title").textContent = plan.bottleneck.title;
    $("#bg-bottleneck-why").textContent = plan.bottleneck.why;
    $("#bg-bottleneck-action").textContent = plan.bottleneck.action;

    $("#bg-status").hidden = true;
    $("#bg-app").hidden = false;
  }

  async function init() {
    const [userResult, sessionResult] = await Promise.all([
      client.auth.getUser(),
      client.auth.getSession()
    ]);
    const user = userResult.data.user || null;
    session = sessionResult.data.session || null;
    if (!user || !session) {
      location.replace("auth.html?next=" + encodeURIComponent("/deep-hunt-market-site/boom-growth-os.html"));
      return;
    }

    const profile = await client.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!profile.data?.is_admin) {
      status("Owner/admin access required.", "error");
      return;
    }

    try {
      const data = await loadData();
      render(data);
    } catch (error) {
      status(error?.message || "Could not load BOOM Profit & Growth OS.", "error");
    }
  }

  init();
})();
