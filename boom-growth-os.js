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
    const [mission, launch, econRes, dealRes, experimentRes, radarRes, briefRes, distributionRes, catalogRes, identityRes, savedCountRes, realOrdersCountRes, testOrdersCountRes, trackingCountRes, deliveredCountRes, creatorDraftCountRes, publishedDraftCountRes, merchantConversionCountRes, partnerRightsCountRes, seoAudit] = await Promise.all([
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
      client.from("hunt_product_actions").select("id",{count:"exact",head:true}).eq("saved",true),
      client.from("hunt_orders").select("id",{count:"exact",head:true}).eq("is_test",false),
      client.from("hunt_orders").select("id",{count:"exact",head:true}).eq("is_test",true),
      client.from("hunt_fulfillment_orders").select("id",{count:"exact",head:true}).not("tracking_number","is",null),
      client.from("hunt_fulfillment_orders").select("id",{count:"exact",head:true}).not("delivered_at","is",null),
      client.from("hunt_distribution_drafts").select("id",{count:"exact",head:true}).ilike("channel","%creator%"),
      client.from("hunt_distribution_drafts").select("id",{count:"exact",head:true}).not("published_at","is",null),
      client.from("merchant_conversion_events").select("id",{count:"exact",head:true}),
      client.from("hunt_partner_matrix").select("id",{count:"exact",head:true}).not("media_rights_verified_at","is",null),
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
    if (savedCountRes.error) throw savedCountRes.error;
    if (realOrdersCountRes.error) throw realOrdersCountRes.error;
    if (testOrdersCountRes.error) throw testOrdersCountRes.error;
    if (trackingCountRes.error) throw trackingCountRes.error;
    if (deliveredCountRes.error) throw deliveredCountRes.error;
    if (creatorDraftCountRes.error) throw creatorDraftCountRes.error;
    if (publishedDraftCountRes.error) throw publishedDraftCountRes.error;
    if (merchantConversionCountRes.error) throw merchantConversionCountRes.error;
    if (partnerRightsCountRes.error) throw partnerRightsCountRes.error;

    const MarketplaceSnapshotAdapter=window.HuntMarketplaceSnapshotAdapter;
    const marketplaceSnapshot=MarketplaceSnapshotAdapter?.load
      ? await MarketplaceSnapshotAdapter.load(client)
      : {adapter_ready:false,merchant_registry_ready:false,attribution_registry_ready:false,counts:{},errors:["marketplace_snapshot_adapter_unavailable"],read_only:true,writes:0,execute_actions:false};

    const PurchaseProofAdapter=window.HuntServerPurchaseProofAdapter;
    const serverPurchaseProof=PurchaseProofAdapter?.load
      ? await PurchaseProofAdapter.load(client)
      : {adapter_ready:false,server_purchase_confirmation:false,live_campaign_context_persisted:false,purchase_touchpoint_linkage:false,provider_payment_confirmation:false,paid_sessions:0,linked_real_orders:0,provider_confirmed_real_orders:0,purchases_with_campaign_context:0,errors:["server_purchase_proof_adapter_unavailable"],read_only:true,writes:0,execute_actions:false};

    const creatorSnapshot={
      creator_registry_ready:false,
      creator_registry_count:0,
      rights_ledger_ready:false,
      rights_verified_count:0,
      attribution_registry_ready:false,
      economics_ledger_ready:false,
      event_id_persistence_ready:false,
      confirmed_conversion_source_ready:false,
      confirmed_creator_conversions:0,
      creator_distribution_drafts:Number(creatorDraftCountRes.count||0),
      published_distribution_drafts:Number(publishedDraftCountRes.count||0),
      generic_merchant_conversion_rows:Number(merchantConversionCountRes.count||0),
      partner_media_rights_verified:Number(partnerRightsCountRes.count||0),
      publish_enabled:false,
      payout_enabled:false
    };

    const lifecycleSnapshot={
      saved_actions:Number(savedCountRes.count||0),
      real_orders:Number(realOrdersCountRes.count||0),
      test_orders:Number(testOrdersCountRes.count||0),
      fulfillment_with_tracking:Number(trackingCountRes.count||0),
      fulfillment_delivered:Number(deliveredCountRes.count||0),
      marketing_consent_registry_ready:false,
      send_history_ready:false,
      frequency_cap_ledger_ready:false,
      external_send_enabled:false
    };

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
    const lifecycleInfra={
      consent_registry_ready:lifecycleSnapshot.marketing_consent_registry_ready===true,
      send_history_ready:lifecycleSnapshot.send_history_ready===true,
      frequency_cap_ledger_ready:lifecycleSnapshot.frequency_cap_ledger_ready===true,
      channel_connected:false,
      channel_send_enabled:false
    };
    const lifecycleProbeSignals=[
      {
        trigger:"saved_reminder",
        channels:["email"],
        context:{
          user_identified:true,
          product_truth_ready:true,
          price_verified:true,
          safe_category:true,
          signal_at:new Date(Date.now()-48*60*60*1000).toISOString(),
          ...lifecycleInfra
        },
        consent:{marketing:{email:false}}
      },
      {
        trigger:"cart_reminder",
        channels:["email"],
        context:{
          user_identified:true,
          product_truth_ready:true,
          price_verified:true,
          safe_category:true,
          signal_at:new Date(Date.now()-6*60*60*1000).toISOString(),
          ...lifecycleInfra
        },
        consent:{marketing:{email:false}}
      },
      {
        trigger:"price_verified",
        channels:["email"],
        context:{
          user_identified:true,
          product_truth_ready:true,
          price_verified:true,
          price_change_verified:true,
          safe_category:true,
          ...lifecycleInfra
        },
        consent:{marketing:{email:false}}
      },
      {
        trigger:"back_in_stock",
        channels:["push"],
        context:{
          user_identified:true,
          product_truth_ready:true,
          price_verified:true,
          variant_stock_verified:false,
          safe_category:true,
          ...lifecycleInfra
        },
        consent:{marketing:{push:false}}
      },
      {
        trigger:"order_update",
        channels:["email"],
        context:{
          user_identified:true,
          is_test_order:lifecycleSnapshot.real_orders===0&&lifecycleSnapshot.test_orders>0,
          real_order_confirmed:lifecycleSnapshot.real_orders>0,
          order_status:lifecycleSnapshot.real_orders>0?"real_order_available":"test_only",
          ...lifecycleInfra
        },
        consent:{transactional:{email:false}}
      },
      {
        trigger:"tracking_update",
        channels:["email"],
        context:{
          user_identified:true,
          is_test_order:lifecycleSnapshot.real_orders===0&&lifecycleSnapshot.test_orders>0,
          real_order_confirmed:lifecycleSnapshot.real_orders>0,
          tracking_changed:lifecycleSnapshot.fulfillment_with_tracking>0&&lifecycleSnapshot.real_orders>0,
          tracking_status:lifecycleSnapshot.fulfillment_with_tracking>0?"tracking_available":"",
          event_id:lifecycleSnapshot.fulfillment_with_tracking>0?"tracking-readiness-probe":"",
          ...lifecycleInfra
        },
        consent:{transactional:{email:false}}
      },
      {
        trigger:"complementary_followup",
        channels:["email"],
        context:{
          user_identified:true,
          is_test_order:lifecycleSnapshot.real_orders===0&&lifecycleSnapshot.test_orders>0,
          real_order_confirmed:lifecycleSnapshot.real_orders>0,
          delivered:lifecycleSnapshot.fulfillment_delivered>0&&lifecycleSnapshot.real_orders>0,
          complement_truth_ready:false,
          delivered_at:lifecycleSnapshot.fulfillment_delivered>0?new Date(Date.now()-8*24*60*60*1000).toISOString():"",
          ...lifecycleInfra
        },
        consent:{marketing:{email:false}}
      }
    ];
    const lifecyclePlan=Lifecycle?.plan
      ? Lifecycle.plan(lifecycleProbeSignals,{now:Date.now()})
      : {version:"—",total:0,eligible:0,hold:0,rows:[],top_blockers:[],sends_executed:0,execute_actions:false,owner_gate:"REVIEW_REQUIRED"};

    const CreatorOS=window.BoomCreatorOS;
    const creatorSystem=CreatorOS?.systemReadiness
      ? CreatorOS.systemReadiness({
          creator_registry_ready:creatorSnapshot.creator_registry_ready,
          rights_ledger_ready:creatorSnapshot.rights_ledger_ready,
          attribution_registry_ready:creatorSnapshot.attribution_registry_ready,
          economics_ledger_ready:creatorSnapshot.economics_ledger_ready,
          claim_firewall_ready:Boolean(window.BoomClaimFirewall),
          event_id_persistence_ready:creatorSnapshot.event_id_persistence_ready,
          confirmed_conversion_source_ready:creatorSnapshot.confirmed_conversion_source_ready,
          creator_registry_count:creatorSnapshot.creator_registry_count,
          rights_verified_count:creatorSnapshot.rights_verified_count,
          confirmed_creator_conversions:creatorSnapshot.confirmed_creator_conversions
        })
      : {state:"HOLD",blockers:["creator_os_unavailable"],creator_registry_count:0,rights_verified_count:0,confirmed_creator_conversions:0,publish_actions:0,payouts:0,execute_actions:false,owner_gate:"REVIEW_REQUIRED"};

    const AgenticGateway=window.BoomAgenticCommerceGateway;
    const agenticGateway=AgenticGateway?.readiness
      ? AgenticGateway.readiness({
          protocol_version:"2026-04-08",
          service_endpoint:"",
          schema_url:"",
          merchant_identity_ready:identityReady,
          product_feed_ready:Number(googleFeedPreview.export_ready||0)>0,
          shipping_policy_ready:false,
          returns_policy_ready:false,
          source_freshness_ready:false,
          cart_endpoint_ready:false,
          cart_line_item_validation_ready:false,
          exact_variant_recheck_ready:true,
          continue_url_ready:false,
          ucp_auth_ready:false,
          merchant_center_ready:false,
          ucp_program_approved:false,
          native_checkout_endpoints_ready:false,
          payment_handler_ready:false,
          m2m_bearer_auth_ready:false,
          order_creation_ready:false,
          order_status_webhook_ready:false,
          real_money_owner_approved:false,
          public_well_known_profile_ready:false,
          google_ucp_profile_review_ready:false
        })
      : {state:"HOLD",blockers:["agentic_gateway_unavailable"],manifest:{capabilities:[],discovery:{ready:false},cart:{ready:false},checkout:{ready:false},well_known_publish:false,native_checkout_enabled:false,payment_enabled:false},external_profile_published:false,requests_served:0,checkout_sessions_created:0,payments_created:0,orders_created:0,execute_actions:false,owner_gate:"REVIEW_REQUIRED"};
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

    const LiveActivationProof=window.BoomLiveActivationProof;
    const liveActivation=LiveActivationProof?.evaluate?.()||{state:"HOLD",receipt:{},activation_verified:false,durable_ready:false,live_event_id_persistence:false,payments_live:false,payplus_callback_accept_paid:false,blockers:["live_activation_receipt_unavailable"],execute_actions:false};

    const LiveAttribution=window.BoomLiveAttributionContext;
    const liveAttribution=LiveAttribution?.evaluate?.()||{state:"HOLD",receipt:{},backend_live_verified:false,frontend_live_verified:false,live_context_end_to_end:false,conversion_claim_allowed:false,payments_live:false,blockers:["live_attribution_receipt_unavailable"],execute_actions:false};

    const FrontendFailover=window.BoomFreeFrontendFailover;
    const frontendFailover=FrontendFailover?.evaluate?.()||{state:"HOLD",receipt:{},fallback_frontend_live:false,attribution_e2e_verified:false,primary_netlify_available:false,free_hosting_path_active:false,paid_host_upgrade:false,conversion_claim_allowed:false,payments_live:false,blockers:["frontend_failover_receipt_unavailable"],execute_actions:false};

    const CampaignLedger=window.BoomCampaignAttributionLedger;
    const campaignAttributionLedger=CampaignLedger?.evaluate?.()||{state:"HOLD",receipt:{},ledger_ready:false,total_rows:0,with_click_digest:0,pending_provider_validation:0,provider_verified:0,server_confirmed_purchases:0,conversion_claim_allowed:0,provider_click_validation:false,payments_live:false,blockers:["campaign_attribution_ledger_unavailable"],execute_actions:false};

    const ProviderClick=window.BoomProviderClickValidation;
    const providerClickValidation=ProviderClick?.evaluateLedger?.({
      provider_verified:campaignAttributionLedger.provider_verified,
      pending_provider_validation:campaignAttributionLedger.pending_provider_validation
    })||{state:"HOLD",provider_click_validation:false,provider_verified:0,pending_provider_validation:0,official_api_evidence_required:true,raw_click_id_exposed:false,conversion_claim_allowed:false,paid_launch:false,paid_spend:false,execute_actions:false};

    const PurchaseBridge=window.BoomPurchaseAttributionBridge;
    const purchaseAttributionBridge=PurchaseBridge?.evaluate?.()||{state:"HOLD",bridge_ready:false,total_sessions:0,provider_payment_confirmed:0,paid_timestamp_present:0,real_orders_linked:0,server_confirmed_purchases:0,campaign_context_present:0,purchase_touchpoint_linked:0,provider_click_validated:0,finance_ledger_rows:0,profit_evidence_ready:0,conversion_claim_allowed:0,provider_status_mapping_ready:false,payments_live:false,blockers:["purchase_attribution_bridge_unavailable"],execute_actions:false};

    const PayPlusStatus=window.BoomPayPlusStatusReadiness;
    const payPlusStatus=PayPlusStatus?.evaluate?.()||{state:"HOLD",receipt:{},callback_hardened:false,sandbox_success_proven:false,sandbox_reject_proven:false,provider_status_mapping_ready:false,accepted_paid:false,payments_live:false,blockers:["payplus_status_readiness_unavailable"],execute_actions:false};

    const PayPlusSandbox=window.BoomPayPlusSandboxEvidence;
    const payPlusSandbox=PayPlusSandbox?.evaluate?.()||{state:"HOLD",receipt:{},harness_safe:false,config_ready:false,sandbox_success_proven:false,sandbox_reject_proven:false,provider_status_mapping_ready:false,payment_link_created:false,accepted_paid:false,payments_live:false,execute_actions:false};

    const SchemaActivation=window.BoomSchemaActivationReadiness;
    const schemaActivation=SchemaActivation?.evaluate?.({
      live_schema_inspected:true,
      rls_enabled:true,
      current_public_insert_policy_identified:true,
      public_insert_privileges_identified:true,
      event_id_absent_confirmed:true,
      unique_event_id_absent_confirmed:true,
      historical_event_id_absence_confirmed:true,
      sql_proposal_ready:true,
      public_canonical_guard_in_proposal:true,
      backend_secret_bypass_verified:true,
      feature_flag_default_off:true,
      edge_compatibility_patch_ready:true,
      operational_rollback_ready:true,
      schema_rollback_ready:true,
      table_specific_security_advisor_clear:true
    })||{state:"HOLD",checks:{},blockers:["schema_activation_runtime_unavailable"],activation_ready:false,live_schema_changed:false,migration_applied:false,function_deployed:false,feature_flag_enabled:false,preferred_rollback:"OPERATIONAL",execute_actions:false};

    const DurableIdentity=window.BoomDurableEventIdentity;
    const durableEventIdentity=DurableIdentity?.evaluate?.({
      browser_event_id_generation:true,
      schema_event_id_column:liveActivation.receipt?.schema_event_id_column===true,
      unique_event_id_constraint:liveActivation.receipt?.unique_event_id_constraint===true,
      public_canonical_insert_blocked:liveActivation.receipt?.public_top_level_event_id_blocked===true&&liveActivation.receipt?.public_metadata_event_id_blocked===true,
      local_sql_blueprint_ready:true,
      local_function_patch_ready:true,
      live_function_atomic_dedup:liveActivation.durable_ready===true,
      live_function_version:Number(liveActivation.receipt?.edge_function_version||0),
      historical_rows:5586,
      historical_rows_with_event_id:0
    })||{state:"HOLD",checks:{},blockers:["durable_event_identity_runtime_unavailable"],schema_ready:false,local_preview_ready:false,durable_ready:false,historical_rows:0,historical_rows_with_event_id:0,historical_backfill_allowed:false,execute_actions:false};

    const PaidAttribution=window.BoomPaidAttributionReadiness;
    const analyticsCfg=window.HUNT_ANALYTICS_CONFIG||{};
    const paidAttribution=PaidAttribution?.evaluate?.({
      browser_event_id_generation:true,
      ga4_configured:/^G-[A-Z0-9]+$/i.test(String(analyticsCfg.ga4MeasurementId||"").trim()),
      first_party_signal_live:true,
      live_event_id_persistence:liveActivation.live_event_id_persistence===true,
      durable_server_dedup:durableEventIdentity.durable_ready===true,
      server_purchase_confirmation:serverPurchaseProof.server_purchase_confirmation===true,
      campaign_touchpoint_persistence:serverPurchaseProof.live_campaign_context_persisted===true,
      purchase_touchpoint_linkage:serverPurchaseProof.purchase_touchpoint_linkage===true,
      provider_click_validation:providerClickValidation.provider_click_validation===true,
      paid_destination_connection:false,
      owner_paid_approval:false,
      local_preview_event_id_patch:true,
      live_function_version:8
    })||{state:"HOLD",checks:{},blockers:["paid_attribution_runtime_unavailable"],paid_attribution_ready:false,server_event_id_persisted:false,paid_launch:false,paid_spend:false,execute_actions:false};

    const AttributionContext=window.BoomAttributionContextReadiness;
    const attributionContext=AttributionContext?.evaluate?.({
      consent_gated_capture:true,
      browser_first_touch:true,
      browser_last_touch:true,
      checkout_payload_context:true,
      server_session_snapshot:true,
      live_server_session_snapshot:serverPurchaseProof.live_campaign_context_persisted===true,
      server_purchase_linkage:serverPurchaseProof.purchase_touchpoint_linkage===true,
      provider_click_validation:providerClickValidation.provider_click_validation===true
    })||{state:"HOLD",checks:{},blockers:["attribution_context_runtime_unavailable"],local_preview_ready:false,live_attribution_context_ready:false,conversion_claim_allowed:false,execute_actions:false};

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
      lifecycleSnapshot,
      lifecyclePlan,
      creatorSnapshot,
      creatorSystem,
      marketplaceSnapshot,
      serverPurchaseProof,
      liveActivation,
      liveAttribution,
      frontendFailover,
      campaignAttributionLedger,
      providerClickValidation,
      purchaseAttributionBridge,
      payPlusStatus,
      payPlusSandbox,
      schemaActivation,
      durableEventIdentity,
      paidAttribution,
      attributionContext,
      agenticGateway,
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
    const s=data.lifecycleSnapshot||{};
    const plan=data.lifecyclePlan||{version:"—",total:0,eligible:0,hold:0,rows:[],top_blockers:[],sends_executed:0,execute_actions:false};
    const state=$("#bg-lifecycle-state");
    if(state)state.textContent=s.external_send_enabled===true?"SEND ON":"SEND OFF";

    const stats=[
      ["Saved actions",s.saved_actions||0],
      ["Real orders",s.real_orders||0],
      ["Test orders",s.test_orders||0],
      ["Tracked / delivered",(s.fulfillment_with_tracking||0)+" / "+(s.fulfillment_delivered||0)]
    ];
    const host=$("#bg-lifecycle-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const labels={
      saved_reminder:"Saved reminder",
      cart_reminder:"Cart reminder",
      price_verified:"Verified price update",
      back_in_stock:"Back in stock",
      order_update:"Order update",
      tracking_update:"Tracking update",
      complementary_followup:"Complementary follow-up"
    };
    const triggerHost=$("#bg-lifecycle-triggers");
    if(triggerHost)triggerHost.innerHTML=(plan.rows||[]).map(row=>{
      const tone=row.eligible?"bg-passport-ready":"bg-passport-blocked";
      return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(labels[row.trigger]||row.trigger)+
        '</strong><span class="bg-score '+tone+'">'+H.esc(row.mode||"HOLD")+'</span></div><small>'+
        H.esc(row.channel||"")+" · execute "+H.esc(row.execute===true?"ON":"OFF")+
        ' · 30d cap '+H.esc(row.frequency?.max_30d??0)+'</small></article>';
    }).join("") || '<div class="bg-empty">No lifecycle readiness probes available.</div>';

    const blockers=$("#bg-lifecycle-blockers");
    const rows=Array.isArray(plan.top_blockers)?plan.top_blockers:[];
    const infra=[
      ["Consent registry",s.marketing_consent_registry_ready===true?"READY":"MISSING"],
      ["Send history",s.send_history_ready===true?"READY":"MISSING"],
      ["Frequency ledger",s.frequency_cap_ledger_ready===true?"READY":"MISSING"],
      ["Messages sent",plan.sends_executed||0]
    ];
    if(blockers)blockers.innerHTML=[
      ...infra.map(([label,value])=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div></article>'
      ),
      ...rows.slice(0,10).map(row=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.blocker||"").replaceAll("_"," "))+
        '</strong><span class="bg-score">'+H.esc(row.count||0)+'</span></div><small>Readiness probes affected</small></article>'
      )
    ].join("");
  }


  function renderCreatorOS(data){
    const s=data.creatorSnapshot||{};
    const system=data.creatorSystem||{state:"HOLD",blockers:[],creator_registry_count:0,rights_verified_count:0,confirmed_creator_conversions:0,publish_actions:0,payouts:0,execute_actions:false};
    const state=$("#bg-creator-state");
    if(state)state.textContent=system.state||"HOLD";

    const stats=[
      ["Creator registry",system.creator_registry_count||0],
      ["Rights verified",system.rights_verified_count||0],
      ["Creator conversions",system.confirmed_creator_conversions||0],
      ["Creator drafts",s.creator_distribution_drafts||0]
    ];
    const host=$("#bg-creator-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const readiness=$("#bg-creator-readiness");
    if(readiness){
      const rows=[
        ["Registry",s.creator_registry_ready===true?"READY":"MISSING"],
        ["Rights ledger",s.rights_ledger_ready===true?"READY":"MISSING"],
        ["Attribution registry",s.attribution_registry_ready===true?"READY":"MISSING"],
        ["Creator economics",s.economics_ledger_ready===true?"READY":"MISSING"],
        ["Publish",s.publish_enabled===true?"ON":"OFF"],
        ["Payout",s.payout_enabled===true?"ON":"OFF"]
      ];
      readiness.innerHTML=rows.map(([label,value])=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div></article>'
      ).join("");
    }

    const blockers=$("#bg-creator-blockers");
    const rows=[
      ...(system.blockers||[]).map(blocker=>({label:String(blocker).replaceAll("_"," "),value:"HOLD"})),
      {label:"Generic merchant conversions",value:s.generic_merchant_conversion_rows||0,note:"Not counted as creator attribution"},
      {label:"Published distribution drafts",value:s.published_distribution_drafts||0,note:"Not creator proof"},
      {label:"Partner media rights verified",value:s.partner_media_rights_verified||0,note:"Partner rights are not creator rights"}
    ];
    if(blockers)blockers.innerHTML=rows.map(row=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.label)+
      '</strong><span class="bg-score">'+H.esc(row.value)+'</span></div>'+
      (row.note?'<small>'+H.esc(row.note)+'</small>':"")+'</article>'
    ).join("");
  }



  function renderAgenticGateway(data){
    const g=data.agenticGateway||{state:"HOLD",blockers:[],manifest:{capabilities:[],discovery:{ready:false},cart:{ready:false},checkout:{ready:false}}};
    const m=g.manifest||{};
    const state=$("#bg-agentic-gateway-state");
    if(state)state.textContent=g.state||"HOLD";

    const stats=[
      ["Discovery",m.discovery?.ready===true?"READY":"HOLD"],
      ["Cart",m.cart?.ready===true?"READY":"HOLD"],
      ["Checkout",m.checkout?.ready===true?"READY":"HOLD"],
      ["Capabilities",(m.capabilities||[]).length]
    ];
    const host=$("#bg-agentic-gateway-stats");
    if(host)host.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const caps=$("#bg-agentic-gateway-capabilities");
    if(caps){
      const rows=[
        ["Protocol",m.protocol_version||"NOT CONFIGURED"],
        ["Manifest ready",m.manifest_ready===true?"YES":"NO"],
        ["Profile publish ready",m.profile_publish_ready===true?"YES":"NO"],
        ["Public profile",m.well_known_publish===true?"ON":"OFF"],
        ["Cart endpoint",m.cart_endpoint_enabled===true?"ON":"OFF"],
        ["Native checkout",m.native_checkout_enabled===true?"ON":"OFF"],
        ["Payment",m.payment_enabled===true?"ON":"OFF"],
        ["Order sync",m.order_sync_enabled===true?"ON":"OFF"]
      ];
      caps.innerHTML=rows.map(([label,value])=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div></article>'
      ).join("");
    }

    const blockers=$("#bg-agentic-gateway-blockers");
    const rows=Array.isArray(g.blockers)?g.blockers:[];
    if(blockers)blockers.innerHTML=[
      ...rows.slice(0,14).map(blocker=>
        '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(blocker).replaceAll("_"," "))+
        '</strong><span class="bg-score">HOLD</span></div></article>'
      ),
      '<article class="bg-row"><div class="bg-row-head"><strong>Requests served</strong><span class="bg-score">'+H.esc(g.requests_served||0)+'</span></div></article>',
      '<article class="bg-row"><div class="bg-row-head"><strong>Checkout sessions</strong><span class="bg-score">'+H.esc(g.checkout_sessions_created||0)+'</span></div></article>'
    ].join("");
  }

  function personalizationReadiness(data={}){
    const P=window.BoomPersonalizationBrain;
    if(!P?.readiness||!P?.rank)return {state:"HOLD",blockers:["personalization_brain_unavailable"],sample:{items:[]},execute:false,owner_gate:"REVIEW_REQUIRED"};
    const readiness=P.readiness({
      preference_controls_ready:true,
      reset_controls_ready:true,
      recommendation_impression_tracking_ready:true,
      outcome_tracking_ready:true,
      holdout_ready:false,
      market_eligibility_ready:false,
      product_truth_ready:Number(data.passportSummary?.total||0)>0,
      privacy_contract_ready:true
    });
    const catalog=(data.catalog||[]).slice(0,120).map(item=>({
      ...item,
      market_eligible:item.market_eligible!==false,
      retail_price_verified:item.retail_price_verified===true||String(item.profit_gate_status||"").toUpperCase()==="PASS",
      source_fresh:Boolean(item.source_fresh_at),
      media_quality_ready:Boolean(item.image_url)
    }));
    const sample=P.rank(catalog,{reduced_personalization:true},{limit:8,max_per_category:2,max_per_supplier:2,exploration_share:0,require_verified_truth:false});
    return {...readiness,sample};
  }

  function renderPersonalization(data){
    const p=personalizationReadiness(data);
    const state=$("#bg-personalization-state");
    if(state)state.textContent=p.state||"HOLD";
    const stats=$("#bg-personalization-stats");
    if(stats)stats.innerHTML=[
      ["Sensitive traits","BLOCKED"],
      ["Ranking","OFF"],
      ["Holdout","MISSING"],
      ["Sample ranked",p.sample?.items?.length||0]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const readiness=$("#bg-personalization-readiness");
    const blockers=p.blockers||[];
    if(readiness)readiness.innerHTML=(blockers.length?blockers:["measurement_ready"]).map(blocker=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(blocker).replaceAll("_"," "))+'</strong><span class="bg-score '+(blocker==="measurement_ready"?"bg-passport-ready":"bg-passport-prepare")+'">'+(blocker==="measurement_ready"?"READY":"GAP")+'</span></div></article>'
    ).join("");
    const sample=$("#bg-personalization-sample");
    if(sample)sample.innerHTML=(p.sample?.items||[]).slice(0,6).map(row=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.item?.title||row.item?.item_id||"Product")+'</strong><span class="bg-score">'+H.esc(Number(row.score||0).toFixed(1))+'</span></div><small>'+H.esc((row.reasons||[]).join(" · ").replaceAll("_"," ")||"balanced cold start")+'</small></article>'
    ).join("")||'<div class="bg-empty">No safe sample candidates yet.</div>';
    return p;
  }

  function studioCoverage(){
    const runtimeRows=[
      ["M01","Commerce Passport","BoomCommercePassport","PANEL"],
      ["M02","Google + AI Feed","BoomGoogleAiFeed","PANEL"],
      ["M03","Measurement Hub","BoomMeasurementHub","PANEL"],
      ["M03.5","Profit & Feed Control","BoomProfitFeedControlTower","PANEL"],
      ["M04","Creative Factory","BoomCreativeFactory","PANEL"],
      ["M04","Claim Firewall","BoomClaimFirewall","CONNECTED"],
      ["M05","Offer Chess","BoomOfferChess","PANEL"],
      ["M06","Lifecycle Brain","BoomLifecycleBrain","PANEL"],
      ["M07","Creator OS","BoomCreatorOS","PANEL"],
      ["M08","Growth Agent","BoomGrowthAgent","PANEL"],
      ["M09","Agentic Commerce Gateway","BoomAgenticCommerceGateway","PANEL"],
      ["M11","Personalization Brain","BoomPersonalizationBrain","PANEL"],
      ["M12","Free Growth Engine","BoomFreeGrowthEngine","PANEL"],
      ["M13","Sales & Advertising Brain","BoomSalesAdvertisingBrain","PANEL"],
      ["M14","Promotion Engine","HuntPromotionEngine","PANEL"],
      ["M15","Marketplace Brain","HuntMarketplaceBrain","PANEL"],
      ["M16","Digital Marketing University","BoomDigitalMarketingUniversity","PANEL"],
      ["M17","Evidence Ledger","BoomEvidenceLedger","PANEL"],
      ["M18","Evidence Decision Gate","BoomEvidenceDecisionGate","PANEL"],
      ["M19","Marketplace Snapshot Adapter","HuntMarketplaceSnapshotAdapter","CONNECTED"],
      ["M20","Paid Attribution Readiness","BoomPaidAttributionReadiness","PANEL"],
      ["M21","Attribution Context","BoomAttributionContextReadiness","PANEL"],
      ["M22","Server Purchase Proof","HuntServerPurchaseProofAdapter","PANEL"],
      ["M23","Durable Event Identity","BoomDurableEventIdentity","PANEL"],
      ["M24","Schema Activation Readiness","BoomSchemaActivationReadiness","PANEL"],
      ["M25","Live Activation Verification","BoomLiveActivationProof","PANEL"],
      ["M26","Live Attribution Context","BoomLiveAttributionContext","PANEL"],
      ["M27","Free Frontend Failover","BoomFreeFrontendFailover","PANEL"],
      ["M28","Campaign Attribution Ledger","BoomCampaignAttributionLedger","PANEL"],
      ["M28","Provider Click Validation","BoomProviderClickValidation","CONNECTED"],
      ["M29","Purchase Attribution Bridge","BoomPurchaseAttributionBridge","PANEL"],
      ["M30","PayPlus Status Mapping","BoomPayPlusStatusReadiness","PANEL"],
      ["M31","PayPlus Sandbox Evidence","BoomPayPlusSandboxEvidence","PANEL"],
      ["OPS","Marketing Brain","BoomMarketingBrain","CALLOUT"],
      ["OPS","SEO Brain","BoomSeoBrain","CALLOUT"],
      ["OPS","Love Engine","BoomLoveEngine","CALLOUT"],
      ["OPS","Everywhere Publisher","BoomEverywherePublisher","CALLOUT"],
      ["OPS","Learning Loop","BoomLearningLoop","CALLOUT"],
      ["LEGACY","Creative Brain","BoomCreativeBrain","LOADED_NO_PANEL"],
      ["LEGACY","Commerce Brain","BoomCommerceBrain","FILE_NOT_LOADED"],
      ["LEGACY","F35 Director","BoomF35Director","FILE_NOT_LOADED"],
      ["LEGACY","BOOM NET","BoomNet","FILE_NOT_LOADED"],
      ["LEGACY","Stylist","BoomStylist","FILE_NOT_LOADED"]
    ].map(([id,name,globalName,surface])=>{
      const loaded=Boolean(window[globalName]);
      return {id,name,globalName,surface,loaded,status:loaded?(surface==="PANEL"||surface==="CALLOUT"||surface==="CONNECTED"?"WIRED":"LOADED_NO_PANEL"):"NOT_LOADED"};
    });

    const existingTools=[
      {name:"World Commerce Radar",source:"boom-world-radar.html + boom-world-radar.js",status:"SEPARATE_TOOL",note:"Admin radar exists; Growth OS already consumes world-idea data."},
      {name:"Marketplace seller/admin",source:"seller.js + merchant-admin.js + merchant-program.html",status:"SEPARATE_TOOL",note:"Application/review/program workflows exist; M15 now provides the aggregate readiness brain, while live snapshot adapter remains gated."},
      {name:"Storefront promotions",source:"boom-promotions.js",status:"SEPARATE_TOOL",note:"Editorial/sponsored renderer exists; M14 now supplies the separate economics/experiment decision core."}
    ];
    const skillOnly=[];

    const wired=runtimeRows.filter(row=>row.status==="WIRED").length;
    const loadedNoPanel=runtimeRows.filter(row=>row.status==="LOADED_NO_PANEL").length;
    const notLoaded=runtimeRows.filter(row=>row.status==="NOT_LOADED").length;
    return Object.freeze({
      runtimeRows:Object.freeze(runtimeRows),
      existingTools:Object.freeze(existingTools),
      skillOnly:Object.freeze(skillOnly),
      totals:Object.freeze({runtime:runtimeRows.length,wired,loadedNoPanel,notLoaded,existingTools:existingTools.length,skillOnly:skillOnly.length}),
      complete:notLoaded===0&&loadedNoPanel===0&&skillOnly.length===0&&existingTools.every(x=>x.status==="SEPARATE_TOOL"),
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function renderStudioCoverage(){
    const c=studioCoverage();
    const state=$("#bg-studio-coverage-state");
    if(state)state.textContent=c.complete?"COMPLETE":"GAPS FOUND";
    const stats=$("#bg-studio-coverage-stats");
    if(stats)stats.innerHTML=[
      ["Wired",c.totals.wired],
      ["Loaded / no panel",c.totals.loadedNoPanel],
      ["Not loaded",c.totals.notLoaded],
      ["Partial / separate",c.totals.existingTools],
      ["Skill only",c.totals.skillOnly]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");

    const runtime=$("#bg-studio-runtime-coverage");
    if(runtime)runtime.innerHTML=c.runtimeRows.map(row=>{
      const tone=row.status==="WIRED"?"bg-passport-ready":row.status==="LOADED_NO_PANEL"?"bg-passport-prepare":"bg-passport-blocked";
      return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.id+" · "+row.name)+'</strong><span class="bg-score '+tone+'">'+H.esc(row.status.replaceAll("_"," "))+'</span></div><small>'+H.esc(row.globalName+" · "+row.surface.replaceAll("_"," "))+'</small></article>';
    }).join("");

    const skills=$("#bg-studio-skill-gaps");
    if(skills)skills.innerHTML=[
      ...c.existingTools.map(row=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.name)+'</strong><span class="bg-score bg-passport-prepare">'+H.esc(row.status.replaceAll("_"," "))+'</span></div><small>'+H.esc(row.source+" · "+row.note)+'</small></article>'),
      ...c.skillOnly.map(row=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.name)+'</strong><span class="bg-score bg-passport-blocked">SKILL ONLY</span></div><small>'+H.esc(row.source)+'</small></article>')
    ].join("");
    return c;
  }

  function renderGrowthAgent(decision){
    const d=decision||{primary_move:{code:"UNAVAILABLE",state:"HOLD",why:"Growth Agent unavailable.",next:"Restore the agent core."},lanes:{},diagnostics:{}};
    const state=$("#bg-growth-agent-state");
    if(state)state.textContent=d.recommendations_only===true?"RECOMMEND ONLY":"HOLD";

    const stats=[
      ["Verified economics",d.diagnostics?.verified_economics||0],
      ["Feed export ready",d.diagnostics?.feed_export_ready||0],
      ["Paid test candidates",d.diagnostics?.paid_test_candidates||0],
      ["Can scale",d.diagnostics?.can_scale===true?"YES":"NO"]
    ];
    const statsHost=$("#bg-growth-agent-stats");
    if(statsHost)statsHost.innerHTML=stats.map(([label,value])=>
      '<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>'
    ).join("");

    const primary=$("#bg-growth-agent-primary");
    const move=d.primary_move||{};
    if(primary)primary.innerHTML=
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(move.code||"").replaceAll("_"," "))+
      '</strong><span class="bg-score">'+H.esc(move.state||"HOLD")+'</span></div><small>'+
      H.esc(move.why||"")+'</small><small>Next: '+H.esc(move.next||"")+'</small></article>'+
      ((d.diagnostics?.reasons||[]).length
        ? '<article class="bg-row"><strong>Diagnostics</strong><small>'+H.esc(d.diagnostics.reasons.join(" · ").replaceAll("_"," "))+'</small></article>'
        : "");

    const labels={
      owned:"Owned / onsite",
      external_discovery:"External discovery",
      paid:"Paid media",
      lifecycle:"Lifecycle",
      creator:"Creator",
      agentic:"Agentic discovery"
    };
    const lanes=$("#bg-growth-agent-lanes");
    if(lanes)lanes.innerHTML=Object.entries(labels).map(([key,label])=>{
      const row=d.lanes?.[key]||{};
      const tone=/TEST|SCALE/.test(String(row.state||""))?"bg-passport-ready":row.state==="PREPARE"?"bg-passport-prepare":"bg-passport-blocked";
      return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+
        '</strong><span class="bg-score '+tone+'">'+H.esc(row.state||"HOLD")+'</span></div><small>'+
        H.esc(row.reason||"")+'</small></article>';
    }).join("");
  }

  function salesAdvertisingReadiness(data={}){
    const B=window.BoomSalesAdvertisingBrain;
    if(!B?.build)return {rows:[],owner_review_candidates:0,prepare_candidates:0,paid_launches:0,spend:0,execute_actions:false};
    const economicsMap=new Map();
    for(const row of data.economics||[]){
      economicsMap.set(String(row.provider||"")+":"+String(row.item_id||""),row);
    }
    const products=(data.catalog||[]).slice(0,160).map(item=>{
      const key=String(item.provider||"")+":"+String(item.item_id||"");
      const econ=economicsMap.get(key)||{};
      return {
        ...item,
        description:item.description||"",
        retail_price_verified:econ.inputs_verified===true&&String(econ.profit_gate_status||"").toUpperCase()==="PASS",
        profit_gate_status:econ.profit_gate_status||item.profit_gate_status||"",
        availability_verified:false
      };
    });
    return B.build({
      products,
      economics_map:economicsMap,
      context:{
        shipping_clarity_ready:false,
        returns_clarity_ready:false,
        mobile_readability_ready:true,
        attribution_ready:false,
        holdout_ready:false,
        landing_page_measurement_ready:false,
        owner_paid_approval:false,
        objective:"verified_contribution_value"
      }
    });
  }

  function renderSalesAdvertising(data){
    const result=salesAdvertisingReadiness(data);
    const state=$("#bg-sales-ad-state");
    if(state)state.textContent=result.owner_review_candidates>0?"OWNER REVIEW":result.prepare_candidates>0?"PREPARE":"HOLD";
    const stats=$("#bg-sales-ad-stats");
    if(stats)stats.innerHTML=[
      ["Owner review",result.owner_review_candidates||0],
      ["Prepare",result.prepare_candidates||0],
      ["Paid launches",result.paid_launches||0],
      ["Spend",money(result.spend||0)]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const candidates=$("#bg-sales-ad-candidates");
    if(candidates)candidates.innerHTML=(result.rows||[]).slice(0,8).map(row=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.product?.title||row.key||"Product")+'</strong><span class="bg-score">'+H.esc(row.plan?.state||"HOLD")+'</span></div><small>Page '+H.esc(row.plan?.readiness?.score||0)+'/100 · Max safe CAC '+H.esc(money(row.plan?.max_safe_cac||0))+'</small></article>'
    ).join("")||'<div class="bg-empty">No campaign candidates.</div>';
    const blockerCounts=new Map();
    for(const row of result.rows||[])for(const blocker of row.plan?.blockers||[])blockerCounts.set(blocker,(blockerCounts.get(blocker)||0)+1);
    const blockers=$("#bg-sales-ad-blockers");
    if(blockers)blockers.innerHTML=[...blockerCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>
      '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name.replaceAll("_"," "))+'</strong><span class="bg-score">'+H.esc(count)+'</span></div></article>'
    ).join("")||'<div class="bg-empty">No blockers.</div>';
    return result;
  }

  function promotionEngineReadiness(data={}){
    const P=window.HuntPromotionEngine;
    if(!P?.evaluate||!P?.summarize)return {rows:[],summary:{total:0,owner_review:0,prepare:0,hold:0,activated:0,execute_actions:false}};
    const econMap=new Map((data.economics||[]).map(row=>[String(row.provider||"")+":"+String(row.item_id||""),row]));
    const typeMap={COUPON_CANDIDATE:"threshold_reward",SHIPPING_CANDIDATE:"free_shipping_threshold",BUNDLE_CANDIDATE:"fixed_bundle"};
    const now=Date.now(), day=24*60*60*1000;
    const rows=(data.offerCandidates||[]).map(row=>{
      const econ=econMap.get(row.product_key)||{};
      const type=typeMap[row.result?.recommendation]||"category_event";
      const selected=row.result?.selected||{};
      const discount=Number(selected.max_discount_amount||selected.amount||0);
      const result=P.evaluate({
        promotion:{type,starts_at:new Date(now+day).toISOString(),ends_at:new Date(now+8*day).toISOString(),countdown_resets:false,fake_original_price:false,preselected_paid_extra:false},
        economics_input:{
          revenue:Number(econ.sale_price_per_unit||0)+Number(econ.customer_shipping_amount||0),
          landed_cost:Number(econ.supplier_cost_per_unit||0)+Number(econ.supplier_shipping_cost||0)+Number(econ.platform_cost||0),
          shipping_subsidy:0,
          payment_fees:econ.payment_reserve,
          returns_allowance:econ.refund_reserve,
          affiliate_cost:null,
          discount_cost:discount,
          tax_cost:null,
          margin_floor:econ.min_required_contribution
        },
        experiment_input:{
          hypothesis:"Verified promotion improves conversion or basket value without breaching contribution floor.",
          audience:"Eligible HUNT shoppers for this product/offer context.",
          control:"Same eligible traffic without the promotion.",
          primary_metric:"verified contribution per eligible session",
          margin_guardrail:"Contribution must remain above verified floor.",
          refund_guardrail:"Refund/return rate must not materially worsen.",
          stop_rule:"Stop on margin-floor breach, truth failure or guardrail deterioration.",
          rollback:"Disable campaign candidate and restore baseline experience."
        },
        context:{availability_verified:false,final_price_clear:true}
      });
      return {product_key:row.product_key,title:row.title,type,result};
    });
    return {rows,summary:P.summarize(rows.map(x=>x.result))};
  }

  function renderPromotionEngine(data){
    const p=promotionEngineReadiness(data),s=p.summary||{};
    const state=$("#bg-promotion-engine-state");
    if(state)state.textContent=s.owner_review>0?"OWNER REVIEW":s.prepare>0?"PREPARE":"HOLD";
    const stats=$("#bg-promotion-engine-stats");
    if(stats)stats.innerHTML=[["Total",s.total||0],["Owner review",s.owner_review||0],["Prepare",s.prepare||0],["Activated",s.activated||0]].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const candidates=$("#bg-promotion-engine-candidates");
    if(candidates)candidates.innerHTML=p.rows.map(row=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.title||row.product_key)+'</strong><span class="bg-score">'+H.esc(row.result.state)+'</span></div><small>'+H.esc(row.type.replaceAll("_"," "))+' · contribution '+H.esc(row.result.economics?.contribution==null?"—":money(row.result.economics.contribution))+'</small></article>').join("")||'<div class="bg-empty">No M05 promotion candidates.</div>';
    const counts=new Map();
    for(const row of p.rows)for(const blocker of row.result.blockers||[])counts.set(blocker,(counts.get(blocker)||0)+1);
    const blockers=$("#bg-promotion-engine-blockers");
    if(blockers)blockers.innerHTML=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name.replaceAll("_"," "))+'</strong><span class="bg-score">'+H.esc(count)+'</span></div></article>').join("")||'<div class="bg-empty">No promotion blockers.</div>';
    return p;
  }

  function marketplaceReadiness(data={}){
    const M=window.HuntMarketplaceBrain;
    if(!M?.summarize)return {readiness:{state:"HOLD",blockers:["marketplace_brain_unavailable"]},stores:0,products:0,eligible_products:0,published:0,payouts:0,execute_actions:false};
    const snap=data.marketplaceSnapshot||{adapter_ready:false,merchant_registry_ready:false,attribution_registry_ready:false,counts:{},errors:[]};
    const base=M.summarize({
      stores:[],products:[],
      config:{
        marketplace_snapshot_adapter_ready:snap.adapter_ready===true,
        merchant_registry_ready:snap.merchant_registry_ready===true,
        store_review_workflow_ready:true,
        product_review_workflow_ready:true,
        program_gate_ready:true,
        seller_api_secret_hashing_ready:false,
        seller_api_revocation_ready:false,
        seller_api_rate_limit_ready:false,
        attribution_registry_ready:snap.attribution_registry_ready===true,
        payout_controls_ready:false
      }
    });
    return {...base,stores:Number(snap.counts?.stores_total||0),products:Number(snap.counts?.products_total||0),eligible_products:Number(snap.counts?.products_approved||0),snapshot:snap};
  }

  function renderMarketplace(data){
    const m=marketplaceReadiness(data),r=m.readiness||{state:"HOLD",blockers:[]};
    const state=$("#bg-marketplace-state");
    if(state)state.textContent=r.state||"HOLD";
    const stats=$("#bg-marketplace-stats");
    if(stats)stats.innerHTML=[["Stores",m.stores||0],["Products",m.products||0],["Eligible",m.eligible_products||0],["Payouts",m.payouts||0]].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const readiness=$("#bg-marketplace-readiness");
    if(readiness)readiness.innerHTML=(r.blockers||[]).map(blocker=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(blocker.replaceAll("_"," "))+'</strong><span class="bg-score bg-passport-blocked">GAP</span></div></article>').join("")||'<div class="bg-empty">Marketplace readiness gates are complete.</div>';
    const workflows=$("#bg-marketplace-workflows");
    if(workflows)workflows.innerHTML=[
      ["Seller application + stores","EXISTS"],
      ["Admin store/product review","EXISTS"],
      ["Merchant program gate","EXISTS"],
      ["Aggregate snapshot adapter",m.snapshot?.adapter_ready?"READY":"GAP"],
      ["Seller API key security proof","UNVERIFIED"],
      ["Attribution registry",m.snapshot?.attribution_registry_ready?"READY":"GAP"],
      ["Payout controls","MISSING"]
    ].map(([name,status])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(["EXISTS","READY"].includes(status)?"bg-passport-ready":"bg-passport-prepare")+'">'+H.esc(status)+'</span></div></article>').join("");
    return m;
  }

  function universityReadiness(data={}){
    const U=window.BoomDigitalMarketingUniversity;
    if(!U?.systemReadiness)return {state:"HOLD",blockers:["university_runtime_unavailable"],levels:0,graduates:0,auto_adopt:false,execute_actions:false};
    return U.systemReadiness({
      measurement_foundation_ready:Boolean(window.BoomMeasurementHub),
      product_truth_ready:Number(data.passportSummary?.total||0)>0,
      experiment_registry_ready:Array.isArray(data.experiments),
      holdout_framework_ready:false,
      guardrail_measurement_ready:false,
      learning_archive_ready:false,
      source_verification_workflow_ready:false
    });
  }

  function renderUniversity(data){
    const U=window.BoomDigitalMarketingUniversity;
    const u=universityReadiness(data);
    const state=$("#bg-university-state");
    if(state)state.textContent=u.state||"HOLD";
    const stats=$("#bg-university-stats");
    if(stats)stats.innerHTML=[
      ["Curriculum levels",u.levels||0],
      ["Experiments",Array.isArray(data.experiments)?data.experiments.length:0],
      ["Graduates",u.graduates||0],
      ["Auto-adopt",u.auto_adopt?"ON":"OFF"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const readiness=$("#bg-university-readiness");
    if(readiness)readiness.innerHTML=(u.blockers||[]).map(blocker=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(blocker.replaceAll("_"," "))+'</strong><span class="bg-score bg-passport-prepare">GAP</span></div></article>').join("")||'<div class="bg-empty">Learning governance is structurally ready for owner review.</div>';
    const labels={
      measurement_foundations:"Measurement Foundations",product_feed_quality:"Product & Feed Quality",merchandising:"Merchandising",creative_strategy:"Creative Strategy",organic_growth:"Organic Growth",advertising_systems:"Advertising Systems",attribution_decision_science:"Attribution & Decision Science",lifecycle_retention:"Lifecycle & Retention",country_marketing:"Country Marketing",experiment_loop:"Experiment Loop"
    };
    const levels=$("#bg-university-levels");
    if(levels)levels.innerHTML=(U?.LEVELS||[]).map((level,index)=>'<article class="bg-row"><div class="bg-row-head"><strong>L'+(index+1)+' · '+H.esc(labels[level]||level.replaceAll("_"," "))+'</strong><span class="bg-score">CURRICULUM</span></div></article>').join("");
    return u;
  }

  function evidenceLedger(data={}){
    const E=window.BoomEvidenceLedger;
    if(!E?.matrix)return {rows:[],verified:0,stale:0,partial:0,structural:0,missing:0,usable_domains:[],execute_actions:false};
    const latest=(rows,key)=>{
      let max=0;
      for(const row of rows||[]){const ts=Date.parse(String(row?.[key]||""));if(Number.isFinite(ts)&&ts>max)max=ts;}
      return max?new Date(max).toISOString():"";
    };
    const econVerified=(data.economics||[]).filter(x=>x.inputs_verified===true&&String(x.profit_gate_status||"").toUpperCase()==="PASS");
    const catalogFresh=(data.catalog||[]).filter(x=>{const ts=Date.parse(String(x.source_fresh_at||""));return Number.isFinite(ts)&&Date.now()-ts<=7*24*60*60*1000;});
    const records=[
      {domain:"product_source_freshness",source_kind:"DIRECT_DB",source_ref:"hunt_catalog_products",available:(data.catalog||[]).length>0,truth_verified:catalogFresh.length>0,observed_count:catalogFresh.length,minimum_count:1,observed_at:latest(data.catalog,"source_fresh_at"),max_age_ms:7*24*60*60*1000},
      {domain:"verified_unit_economics",source_kind:"DIRECT_DB",source_ref:"hunt_unit_economics",available:(data.economics||[]).length>0,truth_verified:econVerified.length>0,observed_count:econVerified.length,minimum_count:1,observed_at:latest(data.economics,"calculated_at"),max_age_ms:7*24*60*60*1000},
      {domain:"deal_candidates",source_kind:"DIRECT_DB",source_ref:"hunt_deal_candidates",available:Array.isArray(data.deals),truth_verified:true,observed_count:(data.deals||[]).length,minimum_count:0,observed_at:latest(data.deals,"updated_at"),freshness_required:false},
      {domain:"experiment_registry",source_kind:"DIRECT_DB",source_ref:"hunt_marketing_experiments",available:Array.isArray(data.experiments),truth_verified:true,observed_count:(data.experiments||[]).length,minimum_count:0,observed_at:latest(data.experiments,"updated_at"),freshness_required:false},
      {domain:"world_radar",source_kind:"DIRECT_DB",source_ref:"hunt_boom_world_ideas",available:Array.isArray(data.worldIdeas),truth_verified:true,observed_count:(data.worldIdeas||[]).length,minimum_count:0,observed_at:latest(data.worldIdeas,"last_verified_at")||latest(data.worldIdeas,"updated_at"),freshness_required:false},
      {domain:"business_identity",source_kind:"DIRECT_DB",source_ref:"hunt_business_identity",available:Boolean(data.businessIdentity&&Object.keys(data.businessIdentity).length),truth_verified:data.businessIdentityReady===true,observed_count:data.businessIdentityReady?1:0,minimum_count:1,observed_at:data.businessIdentity?.updated_at||"",max_age_ms:365*24*60*60*1000},
      {domain:"lifecycle_observations",source_kind:"DIRECT_DB",source_ref:"hunt_product_actions + orders + fulfillment",available:true,truth_verified:true,observed_count:Number(data.lifecycleSnapshot?.saved_actions||0)+Number(data.lifecycleSnapshot?.real_orders||0)+Number(data.lifecycleSnapshot?.test_orders||0)+Number(data.lifecycleSnapshot?.fulfillment_with_tracking||0),minimum_count:0,observed_at:new Date().toISOString(),max_age_ms:60*60*1000},
      {domain:"creator_observations",source_kind:"DIRECT_DB",source_ref:"distribution_drafts + merchant_conversion_events + hunt_partner_matrix",available:true,truth_verified:true,observed_count:Number(data.creatorSnapshot?.creator_distribution_drafts||0)+Number(data.creatorSnapshot?.generic_merchant_conversion_rows||0)+Number(data.creatorSnapshot?.partner_media_rights_verified||0),minimum_count:0,observed_at:new Date().toISOString(),max_age_ms:60*60*1000},
      {domain:"seo_audit",source_kind:"STATIC_AUDIT",source_ref:"boom-seo-audit.json",available:Boolean(data.seoAudit),truth_verified:Boolean(data.seoAudit),freshness_required:false},
      {domain:"personalization_lift",source_kind:"STRUCTURAL",source_ref:"M11 runtime + analytics hooks",available:Boolean(window.BoomPersonalizationBrain),truth_verified:false,freshness_required:false},
      {domain:"marketplace_snapshot",source_kind:"DIRECT_DB",source_ref:"merchant_accounts + merchant_stores + merchant_products",available:data.marketplaceSnapshot?.adapter_ready===true,truth_verified:data.marketplaceSnapshot?.adapter_ready===true,observed_count:Number(data.marketplaceSnapshot?.counts?.stores_total||0)+Number(data.marketplaceSnapshot?.counts?.products_total||0),minimum_count:0,observed_at:new Date().toISOString(),max_age_ms:60*60*1000},
      {domain:"paid_attribution",source_kind:"DIRECT_DB",source_ref:"M20 canonical event + server conversion attribution",available:data.paidAttribution?.paid_attribution_ready===true,truth_verified:data.paidAttribution?.paid_attribution_ready===true,observed_count:data.paidAttribution?.paid_attribution_ready?1:0,minimum_count:1,observed_at:data.paidAttribution?.paid_attribution_ready?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"campaign_touchpoint_context",source_kind:"STRUCTURAL",source_ref:"M21 consent-gated browser → checkout → payment-session preview",available:data.attributionContext?.local_preview_ready===true,truth_verified:false,freshness_required:false},
      {domain:"campaign_attribution_ledger",source_kind:"DIRECT_DB",source_ref:"M28 hunt_attribution_ledger",available:data.campaignAttributionLedger?.ledger_ready===true,truth_verified:data.campaignAttributionLedger?.ledger_ready===true,observed_count:Number(data.campaignAttributionLedger?.total_rows||0),minimum_count:1,observed_at:data.campaignAttributionLedger?.ledger_ready?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"provider_click_validation",source_kind:"PROVIDER_API",source_ref:"M28 official provider evidence gate",available:Number(data.campaignAttributionLedger?.with_click_digest||0)>0,truth_verified:data.providerClickValidation?.provider_click_validation===true,observed_count:Number(data.providerClickValidation?.provider_verified||0),minimum_count:1,observed_at:data.providerClickValidation?.provider_click_validation?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"purchase_attribution_bridge",source_kind:"DIRECT_DB",source_ref:"M29 security-invoker purchase attribution bridge",available:data.purchaseAttributionBridge?.bridge_ready===true,truth_verified:data.purchaseAttributionBridge?.bridge_ready===true,observed_count:Number(data.purchaseAttributionBridge?.total_sessions||0),minimum_count:1,observed_at:data.purchaseAttributionBridge?.bridge_ready?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"profit_evidence",source_kind:"DIRECT_DB",source_ref:"M29 hunt_order_finance_ledger real non-preview evidence",available:Number(data.purchaseAttributionBridge?.finance_ledger_rows||0)>0,truth_verified:data.purchaseAttributionBridge?.profit_evidence_available===true,observed_count:Number(data.purchaseAttributionBridge?.profit_evidence_ready||0),minimum_count:1,observed_at:data.purchaseAttributionBridge?.profit_evidence_available?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"payplus_status_mapping",source_kind:"PROVIDER_API",source_ref:"M30 PayPlus HMAC + IPN FULL + sandbox mapping",available:data.payPlusStatus?.callback_hardened===true,truth_verified:data.payPlusStatus?.provider_status_mapping_ready===true,observed_count:data.payPlusStatus?.provider_status_mapping_ready?2:0,minimum_count:2,observed_at:data.payPlusStatus?.provider_status_mapping_ready?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"payplus_sandbox_evidence",source_kind:"PROVIDER_API",source_ref:"M31 isolated PayPlus staging harness",available:data.payPlusSandbox?.harness_safe===true,truth_verified:data.payPlusSandbox?.provider_status_mapping_ready===true,observed_count:(data.payPlusSandbox?.sandbox_success_proven?1:0)+(data.payPlusSandbox?.sandbox_reject_proven?1:0),minimum_count:2,observed_at:data.payPlusSandbox?.provider_status_mapping_ready?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"server_purchase_proof",source_kind:"DIRECT_DB",source_ref:"hunt_payment_sessions + hunt_payment_events + hunt_orders",available:data.serverPurchaseProof?.adapter_ready===true,truth_verified:data.serverPurchaseProof?.server_purchase_confirmation===true,observed_count:Number(data.serverPurchaseProof?.provider_confirmed_real_orders||0),minimum_count:1,observed_at:data.serverPurchaseProof?.adapter_ready?new Date().toISOString():"",max_age_ms:60*60*1000},
      {domain:"durable_event_identity",source_kind:data.durableEventIdentity?.durable_ready?"DIRECT_DB":"STRUCTURAL",source_ref:"M23 analytics_events.event_id + UNIQUE + guarded Edge insert",available:data.durableEventIdentity?.local_preview_ready===true||data.durableEventIdentity?.durable_ready===true,truth_verified:data.durableEventIdentity?.durable_ready===true,observed_count:data.durableEventIdentity?.durable_ready?1:0,minimum_count:data.durableEventIdentity?.durable_ready?1:0,observed_at:data.durableEventIdentity?.durable_ready?new Date().toISOString():"",freshness_required:data.durableEventIdentity?.durable_ready===true,max_age_ms:60*60*1000},
      {domain:"schema_activation_readiness",source_kind:"STRUCTURAL",source_ref:"M24 live schema preflight + security advisor + rollback plan",available:data.schemaActivation?.activation_ready===true,truth_verified:false,freshness_required:false},
      {domain:"source_verification_workflow",source_kind:"STRUCTURAL",source_ref:"M16 source verification workflow",available:Boolean(window.BoomDigitalMarketingUniversity),truth_verified:false,freshness_required:false}
    ];
    return E.matrix(records);
  }

  function renderEvidenceLedger(data){
    const e=evidenceLedger(data);
    const state=$("#bg-evidence-state");
    if(state)state.textContent=e.missing||e.structural||e.partial||e.stale?"GAPS FOUND":"VERIFIED";
    const stats=$("#bg-evidence-stats");
    if(stats)stats.innerHTML=[["Verified",e.verified||0],["Stale",e.stale||0],["Structural",e.structural||0],["Missing",e.missing||0]].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const rowHtml=row=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(row.domain.replaceAll("_"," "))+'</strong><span class="bg-score '+(row.state==="VERIFIED"?"bg-passport-ready":row.state==="MISSING"?"bg-passport-blocked":"bg-passport-prepare")+'">'+H.esc(row.state)+'</span></div><small>'+H.esc(row.source_kind+" · "+row.source_ref+(row.observed_count!=null?" · count "+row.observed_count:""))+'</small></article>';
    const verified=$("#bg-evidence-verified");
    if(verified)verified.innerHTML=e.rows.filter(x=>x.state==="VERIFIED").map(rowHtml).join("")||'<div class="bg-empty">No decision-grade evidence yet.</div>';
    const gaps=$("#bg-evidence-gaps");
    if(gaps)gaps.innerHTML=e.rows.filter(x=>x.state!=="VERIFIED").map(rowHtml).join("")||'<div class="bg-empty">No evidence gaps.</div>';
    return e;
  }

  function renderPayPlusSandbox(data={}){
    const m=data.payPlusSandbox||{state:"HOLD",receipt:{},harness_safe:false,config_ready:false,sandbox_success_proven:false,sandbox_reject_proven:false,provider_status_mapping_ready:false,payment_link_created:false,accepted_paid:false,payments_live:false};
    const r=m.receipt||{};
    const state=$("#bg-payplus-sandbox-state");
    if(state)state.textContent=m.provider_status_mapping_ready?"SANDBOX PROVEN":m.harness_safe?"CONFIG BLOCKED":"HOLD";
    const stats=$("#bg-payplus-sandbox-stats");
    if(stats)stats.innerHTML=[
      ["Harness","v"+String(r.harness_version||"?")],
      ["Config",m.config_ready?"READY":"MISSING"],
      ["Sandbox sessions",String(r.sandbox_sessions_created||0)],
      ["Accepted paid",String(r.accepted_paid_observations||0)]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-payplus-sandbox-proof");
    if(proof)proof.innerHTML=[
      ["Staging-only endpoint",r.staging_only===true],
      ["One-time token required",r.one_time_token_required===true],
      ["Runtime control disabled after preflight",r.runtime_control_enabled===false&&r.runtime_control_owner_approved===false],
      ["Token invalidated",r.token_invalidated===true],
      ["Payment link created",r.payment_link_created===true],
      ["Payments live",r.hunt_payment_live===true],
      ["Paid callback acceptance",r.hunt_payplus_callback_accept_paid===true]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+((name==="Payment link created"||name==="Payments live"||name==="Paid callback acceptance")?(ok?"bg-passport-blocked":"bg-passport-ready"):(ok?"bg-passport-ready":"bg-passport-blocked"))+'">'+((name==="Payment link created"||name==="Payments live"||name==="Paid callback acceptance")?(ok?"YES":"NO"):(ok?"VERIFIED":"MISSING"))+'</span></div></article>').join("");
    const blockers=$("#bg-payplus-sandbox-blockers");
    if(blockers)blockers.innerHTML=[
      ["PAYPLUS_API_KEY",r.payplus_api_key_configured?"CONFIGURED":"MISSING"],
      ["PAYPLUS_SECRET_KEY",r.payplus_secret_key_configured?"CONFIGURED":"MISSING"],
      ["PAYPLUS_PAYMENT_PAGE_UID",r.payplus_payment_page_uid_configured?"CONFIGURED":"MISSING"],
      ["Sandbox success proof",m.sandbox_success_proven?"VERIFIED":"PENDING"],
      ["Sandbox reject proof",m.sandbox_reject_proven?"VERIFIED":"PENDING"],
      ["Provider status mapping",m.provider_status_mapping_ready?"READY":"BLOCKED"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(["MISSING","PENDING","BLOCKED"].includes(value)?"bg-passport-prepare":"bg-passport-ready")+'">'+H.esc(value)+'</span></div></article>').join("");
    return m;
  }

  function renderPayPlusStatus(data={}){
    const p=data.payPlusStatus||{state:"HOLD",receipt:{},checks:{},callback_hardened:false,sandbox_success_proven:false,sandbox_reject_proven:false,provider_status_mapping_ready:false,accepted_paid:false,payments_live:false};
    const r=p.receipt||{};
    const state=$("#bg-payplus-status-state");
    if(state)state.textContent=p.provider_status_mapping_ready?"MAPPING READY":p.callback_hardened?"CALLBACK HARDENED":"HOLD";
    const stats=$("#bg-payplus-status-stats");
    if(stats)stats.innerHTML=[
      ["Callback","v"+String(r.callback_version||"?")],
      ["HMAC",p.callback_hardened?"PASS":"HOLD"],
      ["Sandbox success",p.sandbox_success_proven?"PASS":"PENDING"],
      ["Sandbox reject",p.sandbox_reject_proven?"PASS":"PENDING"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-payplus-status-proof");
    if(proof)proof.innerHTML=[
      ["HMAC + user-agent gate",r.hmac_user_agent_gate],
      ["Independent IPN FULL verification",r.independent_ipn_full_verification],
      ["Observation RLS",r.observation_rls_enabled],
      ["Public observation access blocked",r.observation_public_blocked],
      ["Fake callback rejected",Number(r.fake_callback_http_status)===401],
      ["J2 is not paid",r.j2_not_paid],
      ["J5 is not paid",r.j5_not_paid],
      ["Unknown status fails closed",r.unknown_status_holds]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"VERIFIED":"MISSING")+'</span></div></article>').join("");
    const sandbox=$("#bg-payplus-status-sandbox");
    if(sandbox)sandbox.innerHTML=[
      ["J4 success sandbox proof",p.sandbox_success_proven?"VERIFIED":"PENDING"],
      ["Rejected sandbox proof",p.sandbox_reject_proven?"VERIFIED":"PENDING"],
      ["Provider status mapping",p.provider_status_mapping_ready?"READY":"BLOCKED"],
      ["Accepted paid",p.accepted_paid?"YES":"NO"],
      ["hunt_payment_live",r.payment_live_enabled===false?"OFF":"ON"],
      ["Paid callback acceptance",r.payplus_callback_accept_paid===false?"OFF":"ON"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(["NO","OFF","BLOCKED","PENDING"].includes(value)?"bg-passport-prepare":value==="VERIFIED"||value==="READY"?"bg-passport-ready":"bg-passport-blocked")+'">'+H.esc(value)+'</span></div></article>').join("");
    return p;
  }

  function renderPurchaseAttributionBridge(data={}){
    const b=data.purchaseAttributionBridge||{state:"HOLD",receipt:{},bridge_ready:false,total_sessions:0,provider_payment_confirmed:0,paid_timestamp_present:0,real_orders_linked:0,server_confirmed_purchases:0,campaign_context_present:0,purchase_touchpoint_linked:0,provider_click_validated:0,finance_ledger_rows:0,profit_evidence_ready:0,conversion_claim_allowed:0,provider_status_mapping_ready:false,payments_live:false};
    const r=b.receipt||{};
    const state=$("#bg-purchase-bridge-state");
    if(state)state.textContent=b.bridge_ready?"BRIDGE READY":"HOLD";
    const stats=$("#bg-purchase-bridge-stats");
    if(stats)stats.innerHTML=[
      ["Sessions",b.total_sessions||0],
      ["Campaign context",b.campaign_context_present||0],
      ["Confirmed purchases",b.server_confirmed_purchases||0],
      ["Profit evidence",b.profit_evidence_ready||0]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-purchase-bridge-proof");
    if(proof)proof.innerHTML=[
      ["Security invoker view",r.security_invoker===true],
      ["Public read blocked",r.public_read_blocked===true],
      ["Provider payment confirmed",b.provider_payment_confirmed>0],
      ["paid_at present",b.paid_timestamp_present>0],
      ["Real non-test order linked",b.real_orders_linked>0],
      ["Purchase ↔ touchpoint linked",b.purchase_touchpoint_linked>0],
      ["Provider click validated",b.provider_click_validated>0]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-prepare")+'">'+(ok?"VERIFIED":"HOLD")+'</span></div></article>').join("");
    const profit=$("#bg-purchase-bridge-profit");
    if(profit)profit.innerHTML=[
      ["Provider status mapping",b.provider_status_mapping_ready?"READY":"BLOCKED"],
      ["Finance ledger rows",String(b.finance_ledger_rows||0)],
      ["Real profit evidence",String(b.profit_evidence_ready||0)],
      ["Conversion claims",String(b.conversion_claim_allowed||0)],
      ["Payments",b.payments_live?"ON":"OFF"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(value==="OFF"||value==="BLOCKED"?"bg-passport-prepare":"")+'">'+H.esc(value)+'</span></div></article>').join("");
    return b;
  }

  function renderCampaignAttributionLedger(data={}){
    const l=data.campaignAttributionLedger||{state:"HOLD",receipt:{},checks:{},ledger_ready:false,total_rows:0,with_click_digest:0,pending_provider_validation:0,provider_verified:0,server_confirmed_purchases:0,conversion_claim_allowed:0,payments_live:false};
    const v=data.providerClickValidation||{state:"HOLD",provider_click_validation:false,provider_verified:0,pending_provider_validation:0,official_api_evidence_required:true,raw_click_id_exposed:false,conversion_claim_allowed:false};
    const r=l.receipt||{};
    const state=$("#bg-attribution-ledger-state");
    if(state)state.textContent=l.ledger_ready?"LEDGER READY":"HOLD";
    const stats=$("#bg-attribution-ledger-stats");
    if(stats)stats.innerHTML=[
      ["Sessions",l.total_rows||0],
      ["Click digests",l.with_click_digest||0],
      ["Provider pending",l.pending_provider_validation||0],
      ["Provider verified",l.provider_verified||0]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-attribution-ledger-proof");
    if(proof)proof.innerHTML=[
      ["RLS enabled",l.checks?.rls_enabled],
      ["Anon blocked",l.checks?.anon_blocked],
      ["Authenticated blocked",l.checks?.authenticated_blocked],
      ["Service role only write path",l.checks?.service_role_granted],
      ["Raw click IDs excluded",l.checks?.raw_click_ids_excluded],
      ["1:1 payment-session link",l.checks?.payment_session_unique_link],
      ["Proof digest = 64 hex",Number(r.proof_digest_length)===64&&r.proof_digest_equals_raw===false]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"VERIFIED":"MISSING")+'</span></div></article>').join("");
    const provider=$("#bg-attribution-ledger-provider");
    if(provider)provider.innerHTML=[
      ["Detected provider",String(r.proof_click_provider||"—")],
      ["Click type",String(r.proof_click_id_type||"—")],
      ["Provider validation",v.provider_click_validation?"VERIFIED":v.state||"PENDING"],
      ["Official API evidence",v.official_api_evidence_required?"REQUIRED":"—"],
      ["Server-confirmed purchases",String(l.server_confirmed_purchases||0)],
      ["Conversion claims",String(l.conversion_claim_allowed||0)],
      ["Payments",l.payments_live?"ON":"OFF"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(value==="OFF"||value==="REQUIRED"||value==="PENDING_PROVIDER_VALIDATION"?"bg-passport-prepare":value==="VERIFIED"?"bg-passport-ready":"")+'">'+H.esc(value)+'</span></div></article>').join("");
    return {ledger:l,provider:v};
  }

  function renderFrontendFailover(data={}){
    const f=data.frontendFailover||{state:"HOLD",receipt:{},fallback_frontend_live:false,attribution_e2e_verified:false,primary_netlify_available:false,free_hosting_path_active:false,paid_host_upgrade:false,conversion_claim_allowed:false,payments_live:false,blockers:[]};
    const r=f.receipt||{};
    const state=$("#bg-frontend-failover-state");
    if(state)state.textContent=f.attribution_e2e_verified?"E2E VERIFIED":"HOLD";
    const stats=$("#bg-frontend-failover-stats");
    if(stats)stats.innerHTML=[
      ["Primary",f.primary_netlify_available?"UP":"503"],
      ["Fallback",f.fallback_frontend_live?"LIVE":"HOLD"],
      ["Browser E2E",f.attribution_e2e_verified?"PASS":"HOLD"],
      ["Paid host upgrade",f.paid_host_upgrade?"YES":"NO"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-frontend-failover-proof");
    if(proof)proof.innerHTML=[
      ["GitHub Pages build",r.fallback_build_status==="built"],
      ["Live files HTTP 200",r.fallback_files_http_200],
      ["Attribution code served",r.fallback_attribution_code_served],
      ["Consent + UTM captured",r.browser_consent_verified],
      ["Checkout verified in browser",r.browser_checkout_verified],
      ["Payment button disabled",r.browser_payment_button_disabled],
      ["DB attribution matched click ID",Boolean(r.browser_click_id)&&r.db_attribution_status==="browser_context_unverified"],
      ["Only prelaunch payment event",r.db_payment_event_type==="prelaunch_session_created"]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"VERIFIED":"MISSING")+'</span></div></article>').join("");
    const boundary=$("#bg-frontend-failover-boundary");
    if(boundary)boundary.innerHTML=[
      ["Netlify primary",String(r.primary_http_status||503)+" · "+String(r.primary_host_status||"unavailable")],
      ["Fallback branch",String(r.fallback_source_branch||"—")],
      ["Rollback Pages source",String(r.rollback_pages_source_branch||"main")+":"+String(r.rollback_pages_source_path||"/")],
      ["Payment mode",String(r.db_payment_mode||"—")],
      ["Paid attribution claim",f.conversion_claim_allowed?"ALLOWED":"BLOCKED"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(value==="BLOCKED"?"bg-passport-ready":"")+'">'+H.esc(value)+'</span></div></article>').join("");
    return f;
  }

  function renderLiveAttribution(data={}){
    const a=data.liveAttribution||{state:"HOLD",receipt:{},backend_live_verified:false,frontend_live_verified:false,live_context_end_to_end:false,conversion_claim_allowed:false,payments_live:false,blockers:[]};
    const r=a.receipt||{};
    const state=$("#bg-live-attribution-state");
    if(state)state.textContent=a.live_context_end_to_end?"E2E VERIFIED":a.backend_live_verified?"BACKEND VERIFIED":"HOLD";
    const stats=$("#bg-live-attribution-stats");
    if(stats)stats.innerHTML=[
      ["Payment session","v"+(r.edge_function_version||"?")],
      ["Backend",a.backend_live_verified?"VERIFIED":"HOLD"],
      ["Frontend",a.frontend_live_verified?"VERIFIED":"NOT VERIFIED"],
      ["Payments",a.payments_live?"ON":"OFF"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-live-attribution-proof");
    if(proof)proof.innerHTML=[
      ["Commerce Profit Gate preserved",r.commerce_gate_preserved],
      ["Payment live gate preserved",r.payment_live_gate_preserved],
      ["Consent required",r.consent_required],
      ["Attribution PII excluded",r.attribution_pii_excluded],
      ["Prelaunch payment_ready=false",r.prelaunch_probe_payment_ready===false],
      ["Snapshot stored unverified",r.attribution_status==="browser_context_unverified"&&r.attribution_verified===false],
      ["Only prelaunch event created",r.payment_event_type==="prelaunch_session_created"]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"VERIFIED":"MISSING")+'</span></div></article>').join("");
    const boundary=$("#bg-live-attribution-boundary");
    if(boundary)boundary.innerHTML=[
      ["Production frontend attribution",a.frontend_live_verified?"VERIFIED":"NOT VERIFIED"],
      ["End-to-end live context",a.live_context_end_to_end?"VERIFIED":"HOLD"],
      ["Conversion claim",a.conversion_claim_allowed?"ALLOWED":"BLOCKED"],
      ["hunt_payment_live",r.payment_live_enabled===false?"OFF":"ON"],
      ["PayPlus callback accept paid",r.payplus_callback_accept_paid===false?"OFF":"ON"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(["VERIFIED","OFF"].includes(value)?"bg-passport-ready":value==="ON"||value==="ALLOWED"?"bg-passport-blocked":"bg-passport-prepare")+'">'+H.esc(value)+'</span></div></article>').join("");
    return a;
  }

  function renderLiveActivation(data={}){
    const a=data.liveActivation||{state:"HOLD",receipt:{},activation_verified:false,durable_ready:false,live_event_id_persistence:false,payments_live:false,payplus_callback_accept_paid:false,blockers:[]};
    const r=a.receipt||{};
    const state=$("#bg-live-activation-state");
    if(state)state.textContent=a.activation_verified?"VERIFIED":"HOLD";
    const stats=$("#bg-live-activation-stats");
    if(stats)stats.innerHTML=[
      ["Migration",r.migration_version||"—"],
      ["Edge Function","v"+(r.edge_function_version||"?")],
      ["Duplicate proof",r.duplicate_proof_rows===1?"PASS":"FAIL"],
      ["Duplicate rows",r.duplicate_canonical_rows_observed??"—"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-live-activation-proof");
    if(proof)proof.innerHTML=[
      ["event_id column",r.schema_event_id_column],
      ["UNIQUE(event_id)",r.unique_event_id_constraint],
      ["Public top-level event_id blocked",r.public_top_level_event_id_blocked],
      ["Public metadata event_id blocked",r.public_metadata_event_id_blocked],
      ["Legacy noncanonical compatibility",r.legacy_noncanonical_compatible],
      ["Runtime control enabled",r.runtime_control_enabled&&r.runtime_control_owner_approved],
      ["Database durable dedup",r.durable_database_dedup_verified],
      ["Live event_id persistence",r.live_event_id_persistence_verified]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"VERIFIED":"MISSING")+'</span></div></article>').join("");
    const payment=$("#bg-live-activation-payment");
    if(payment)payment.innerHTML=[
      ["hunt_payment_live",r.payment_live_enabled===false?"OFF":"ON"],
      ["PayPlus callback accept paid",r.payplus_callback_accept_paid===false?"OFF":"ON"],
      ["Live payment changed",r.live_payment_unchanged===true?"NO":"YES"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(["OFF","NO"].includes(value)?"bg-passport-ready":"bg-passport-blocked")+'">'+H.esc(value)+'</span></div></article>').join("");
    return a;
  }

  function renderSchemaActivation(data={}){
    const a=data.schemaActivation||{state:"HOLD",checks:{},blockers:[],activation_ready:false,live_schema_changed:false,migration_applied:false,function_deployed:false,feature_flag_enabled:false,preferred_rollback:"OPERATIONAL"};
    const state=$("#bg-schema-activation-state");
    if(state)state.textContent=a.activation_ready?"OWNER REVIEW":a.state||"HOLD";
    const stats=$("#bg-schema-activation-stats");
    if(stats)stats.innerHTML=[
      ["Activation plan",a.activation_ready?"READY":"HOLD"],
      ["Migration applied",a.migration_applied?"YES":"NO"],
      ["Function deployed",a.function_deployed?"YES":"NO"],
      ["Durable flag",a.feature_flag_enabled?"ON":"OFF"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const labels={live_schema_inspected:"Live schema inspected",rls_enabled:"RLS enabled",current_public_insert_policy_identified:"Current broad INSERT policy identified",public_insert_privileges_identified:"Anon/auth INSERT privileges identified",event_id_absent_confirmed:"event_id absence confirmed",unique_event_id_absent_confirmed:"UNIQUE(event_id) absence confirmed",historical_event_id_absence_confirmed:"Historical canonical IDs absent",sql_proposal_ready:"SQL proposal ready",public_canonical_guard_in_proposal:"Public canonical-ID guard in proposal",backend_secret_bypass_verified:"Trusted backend secret path verified",feature_flag_default_off:"Durable flag defaults OFF",edge_compatibility_patch_ready:"Edge compatibility patch ready",operational_rollback_ready:"Operational rollback ready",schema_rollback_ready:"Schema rollback ready",table_specific_security_advisor_clear:"No table-specific security-advisor finding"};
    const checks=$("#bg-schema-activation-checks");
    if(checks)checks.innerHTML=Object.entries(labels).map(([key,label])=>{const ok=a.checks?.[key]===true;return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"READY":"MISSING")+'</span></div></article>';}).join("");
    const rollback=$("#bg-schema-activation-rollback");
    if(rollback)rollback.innerHTML=[
      ["Preferred rollback","OPERATIONAL: flag OFF → restore previous function → keep hardened schema"],
      ["Full schema rollback","LAST RESORT: disable writer first; review/export canonical IDs before dropping column"],
      ["Live schema changed",a.live_schema_changed?"YES":"NO"],
      ["Owner gate","REVIEW REQUIRED"]
    ].map(([name,value])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score">'+H.esc(value)+'</span></div></article>').join("");
    return a;
  }

  function renderDurableEventIdentity(data={}){
    const d=data.durableEventIdentity||{state:"HOLD",checks:{},blockers:[],schema_ready:false,local_preview_ready:false,durable_ready:false,historical_rows:0,historical_rows_with_event_id:0,historical_backfill_allowed:false,live_function_version:0};
    const state=$("#bg-durable-identity-state");
    if(state)state.textContent=d.durable_ready?"OWNER REVIEW":d.state||"HOLD";
    const stats=$("#bg-durable-identity-stats");
    if(stats)stats.innerHTML=[
      ["Historical rows",d.historical_rows||0],
      ["Stored event_id",d.historical_rows_with_event_id||0],
      ["Live function","v"+(d.live_function_version||"?")],
      ["Durable dedup",d.durable_ready?"READY":"OFF"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const labels={browser_event_id_generation:"Browser canonical event_id",schema_event_id_column:"analytics_events.event_id column",unique_event_id_constraint:"Database UNIQUE(event_id)",public_canonical_insert_blocked:"Public canonical insert guard",local_sql_blueprint_ready:"Local SQL proposal",local_function_patch_ready:"Feature-gated Edge patch",live_function_atomic_dedup:"Live atomic dedup"};
    const checks=$("#bg-durable-identity-checks");
    if(checks)checks.innerHTML=Object.entries(labels).map(([key,label])=>{const ok=d.checks?.[key]===true;return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"READY":"MISSING")+'</span></div></article>';}).join("");
    const blockers=$("#bg-durable-identity-blockers");
    if(blockers)blockers.innerHTML=(d.blockers||[]).map(blocker=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(blocker).replaceAll("_"," "))+'</strong><span class="bg-score bg-passport-blocked">HOLD</span></div></article>').join("")+'<article class="bg-row"><div class="bg-row-head"><strong>Historical backfill</strong><span class="bg-score bg-passport-blocked">FORBIDDEN</span></div><small>Original canonical event IDs were never persisted; old rows stay NULL.</small></article>';
    return d;
  }

  function renderServerPurchaseProof(data={}){
    const p=data.serverPurchaseProof||{adapter_ready:false,server_purchase_confirmation:false,live_campaign_context_persisted:false,purchase_touchpoint_linkage:false,provider_payment_confirmation:false,paid_sessions:0,linked_real_orders:0,provider_confirmed_real_orders:0,purchases_with_campaign_context:0,errors:[]};
    const state=$("#bg-server-purchase-state");
    if(state)state.textContent=p.server_purchase_confirmation?"VERIFIED":"HOLD";
    const stats=$("#bg-server-purchase-stats");
    if(stats)stats.innerHTML=[
      ["Paid sessions",p.paid_sessions||0],
      ["Real linked orders",p.linked_real_orders||0],
      ["Provider-confirmed",p.provider_confirmed_real_orders||0],
      ["Attributed purchases",p.purchases_with_campaign_context||0]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const proof=$("#bg-server-purchase-proof");
    if(proof)proof.innerHTML=[
      ["Read-only adapter",p.adapter_ready],
      ["Provider payment confirmation",p.provider_payment_confirmation],
      ["Server purchase confirmation",p.server_purchase_confirmation],
      ["Live campaign context persisted",p.live_campaign_context_persisted],
      ["Purchase ↔ touchpoint linkage",p.purchase_touchpoint_linkage]
    ].map(([name,ok])=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"VERIFIED":"MISSING")+'</span></div></article>').join("");
    const linkage=$("#bg-server-purchase-linkage");
    if(linkage)linkage.innerHTML=(p.errors||[]).map(error=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(error)+'</strong><span class="bg-score bg-passport-blocked">ERROR</span></div></article>').join("")||'<article class="bg-row"><div class="bg-row-head"><strong>Writes / execution</strong><span class="bg-score bg-passport-ready">0 / OFF</span></div><small>Adapter only reads minimal payment/order proof fields.</small></article>';
    return p;
  }

  function renderAttributionContext(data={}){
    const a=data.attributionContext||{state:"HOLD",checks:{},blockers:[],local_preview_ready:false,live_attribution_context_ready:false,conversion_claim_allowed:false};
    const state=$("#bg-attribution-context-state");
    if(state)state.textContent=a.live_attribution_context_ready?"OWNER REVIEW":a.state||"HOLD";
    const stats=$("#bg-attribution-context-stats");
    if(stats)stats.innerHTML=[
      ["Local chain",a.local_preview_ready?"READY":"HOLD"],
      ["Live server snapshot",a.checks?.live_server_session_snapshot?"READY":"OFF"],
      ["Purchase linkage",a.checks?.server_purchase_linkage?"READY":"MISSING"],
      ["Conversion claim",a.conversion_claim_allowed?"ALLOWED":"BLOCKED"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const labels={consent_gated_capture:"Consent-gated URL capture",browser_first_touch:"Browser first touch",browser_last_touch:"Browser last touch",checkout_payload_context:"Checkout attribution payload",server_session_snapshot:"Local payment-session snapshot",live_server_session_snapshot:"Live payment-session snapshot",server_purchase_linkage:"Server purchase linkage",provider_click_validation:"Provider click validation"};
    const checks=$("#bg-attribution-context-checks");
    if(checks)checks.innerHTML=Object.entries(labels).map(([key,label])=>{const ok=a.checks?.[key]===true;return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-prepare")+'">'+(ok?"READY":"GAP")+'</span></div></article>';}).join("");
    const blockers=$("#bg-attribution-context-blockers");
    if(blockers)blockers.innerHTML=(a.blockers||[]).filter(x=>!String(x).startsWith("browser_")&&!String(x).startsWith("consent_gated")&&!String(x).startsWith("checkout_payload")&&!String(x).startsWith("server_session_snapshot_")).map(blocker=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(blocker).replaceAll("_"," "))+'</strong><span class="bg-score bg-passport-blocked">HOLD</span></div></article>').join("")||'<div class="bg-empty">No remaining attribution-context blockers.</div>';
    return a;
  }

  function renderPaidAttribution(data={}){
    const p=data.paidAttribution||{state:"HOLD",checks:{},blockers:[],paid_attribution_ready:false,local_preview_event_id_patch:false,live_function_version:0};
    const state=$("#bg-paid-attribution-state");
    if(state)state.textContent=p.paid_attribution_ready?"OWNER REVIEW":p.state||"HOLD";
    const stats=$("#bg-paid-attribution-stats");
    if(stats)stats.innerHTML=[
      ["Live function","v"+(p.live_function_version||"?")],
      ["Local event_id patch",p.local_preview_event_id_patch?"READY":"NO"],
      ["Live event_id",p.server_event_id_persisted?"PERSISTED":"MISSING"],
      ["Paid attribution",p.paid_attribution_ready?"READY":"HOLD"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const labels={
      browser_event_id_generation:"Browser canonical event_id",ga4_configured:"GA4 configured",first_party_signal_live:"First-party signal live",live_event_id_persistence:"Live event_id persistence",durable_server_dedup:"Durable server dedup",server_purchase_confirmation:"Server purchase confirmation",campaign_touchpoint_persistence:"Campaign touchpoint persistence",purchase_touchpoint_linkage:"Purchase ↔ touchpoint linkage",paid_destination_connection:"Paid destination connection",owner_paid_approval:"Owner paid approval"
    };
    const checks=$("#bg-paid-attribution-checks");
    if(checks)checks.innerHTML=Object.entries(labels).map(([key,label])=>{const ok=p.checks?.[key]===true;return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(label)+'</strong><span class="bg-score '+(ok?"bg-passport-ready":"bg-passport-blocked")+'">'+(ok?"READY":"MISSING")+'</span></div></article>';}).join("");
    const blockers=$("#bg-paid-attribution-blockers");
    if(blockers)blockers.innerHTML=(p.blockers||[]).map(blocker=>'<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(blocker).replaceAll("_"," "))+'</strong><span class="bg-score bg-passport-blocked">HOLD</span></div></article>').join("")||'<div class="bg-empty">No paid-attribution blockers.</div>';
    return p;
  }

  function renderDecisionGate(rawDecision,gatedDecision,evidence){
    const raw=rawDecision||{primary_move:{code:"UNAVAILABLE",state:"HOLD"},lanes:{},diagnostics:{}};
    const gated=gatedDecision||raw;
    const gatedLanes=Object.entries(gated.lanes||{}).filter(([,lane])=>lane.state==="EVIDENCE_HOLD");
    const state=$("#bg-decision-gate-state");
    if(state)state.textContent=gatedLanes.length||gated.primary_move?.state==="EVIDENCE_HOLD"?"BLOCKING":"PASS";
    const stats=$("#bg-decision-gate-stats");
    if(stats)stats.innerHTML=[
      ["Raw move",raw.primary_move?.state||"HOLD"],
      ["Gated move",gated.primary_move?.state||"HOLD"],
      ["Gated lanes",gatedLanes.length],
      ["Verified evidence",evidence?.verified||0]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const primary=$("#bg-decision-gate-primary");
    if(primary)primary.innerHTML=[raw.primary_move,gated.primary_move].map((move,index)=>'<article class="bg-row"><div class="bg-row-head"><strong>'+(index===0?'RAW · ':'GATED · ')+H.esc(String(move?.code||"UNAVAILABLE").replaceAll("_"," "))+'</strong><span class="bg-score '+(move?.state==="EVIDENCE_HOLD"?"bg-passport-blocked":"")+'">'+H.esc(move?.state||"HOLD")+'</span></div><small>'+H.esc(move?.why||"")+'</small></article>').join("");
    const lanes=$("#bg-decision-gate-lanes");
    if(lanes)lanes.innerHTML=Object.entries(gated.lanes||{}).map(([name,lane])=>{
      const missing=lane.evidence_missing||[];
      return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(name.replaceAll("_"," "))+'</strong><span class="bg-score '+(lane.evidence_gate==="HOLD"?"bg-passport-blocked":lane.evidence_gate==="PASS"?"bg-passport-ready":"")+'">'+H.esc(lane.evidence_gate||"NOT REQUIRED")+'</span></div><small>'+H.esc(missing.length?missing.join(" · ").replaceAll("_"," "):"No evidence downgrade applied.")+'</small></article>';
    }).join("");
    return gated;
  }

  function renderFreeGrowth(plan,data,marketing,seoScore){
    const G=window.BoomFreeGrowthEngine;
    const result=G?.build?.({
      plan,data,marketing,seo_score:seoScore,
      crawlable_urls_ready:true,
      structured_data_ready:seoScore>=50,
      search_console_ready:false,
      sharing:{share_ready:false,attribution_ready:false,reward_economics_ready:false},
      localization:{language_ready:true,currency_ready:true,shipping_truth_ready:false},
      measurement:{earned_attribution_ready:false}
    })||{primary:null,opportunities:[],organic_test_candidates:0,paid_spend:false,execute_actions:false};
    const state=$("#bg-free-growth-state");
    if(state)state.textContent=result.primary?.state||"HOLD";
    const stats=$("#bg-free-growth-stats");
    if(stats)stats.innerHTML=[
      ["Test candidates",result.organic_test_candidates||0],
      ["Paid spend",result.paid_spend?"ON":"OFF"],
      ["External publish",result.external_publish?"ON":"OFF"],
      ["Owner gate",result.owner_gate||"REVIEW"]
    ].map(([label,value])=>'<article class="bg-passport-stat"><strong>'+H.esc(value)+'</strong><small>'+H.esc(label)+'</small></article>').join("");
    const primary=$("#bg-free-growth-primary");
    const p=result.primary;
    if(primary)primary.innerHTML=p
      ? '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(p.channel||"").replaceAll("_"," "))+'</strong><span class="bg-score">'+H.esc(p.state||"HOLD")+'</span></div><small>'+H.esc(p.reason||"")+'</small><small>Next: '+H.esc(p.next||"")+'</small></article>'
      : '<div class="bg-empty">No free-growth move available.</div>';
    const channels=$("#bg-free-growth-channels");
    if(channels)channels.innerHTML=(result.opportunities||[]).map(row=>{
      const tone=row.state==="TEST_CANDIDATE"?"bg-passport-ready":row.state==="PREPARE"?"bg-passport-prepare":"bg-passport-blocked";
      return '<article class="bg-row"><div class="bg-row-head"><strong>'+H.esc(String(row.channel||"").replaceAll("_"," "))+'</strong><span class="bg-score '+tone+'">'+H.esc(row.state||"HOLD")+'</span></div><small>'+H.esc((row.blockers||[]).join(" · ").replaceAll("_"," ")||row.reason||"")+'</small></article>';
    }).join("");
    return result;
  }

  function renderOperating(plan, data) {
    const Marketing = window.BoomMarketingBrain;
    const GrowthAgent = window.BoomGrowthAgent;
    const Seo = window.BoomSeoBrain;
    const Love = window.BoomLoveEngine;
    const Publisher = window.BoomEverywherePublisher;
    const Learning = window.BoomLearningLoop;

    const marketing = Marketing?.build?.({plan,data,passportSummary:data.passportSummary}) || {channels:[],primary:null,eligibleDeals:0,agentic:{}};
    const rawGrowthDecision=GrowthAgent?.decide?.({
      plan,
      data,
      marketing,
      measurement:{
        paid_attribution_ready:false,
        server_event_id_persisted:false,
        owner_paid_approval:false,
        incrementality_ready:false,
        post_acquisition_profit_ready:false
      }
    })||null;
    const decisionEvidence=evidenceLedger(data);
    const DecisionGate=window.BoomEvidenceDecisionGate;
    const growthDecision=DecisionGate?.apply?.(rawGrowthDecision||{},decisionEvidence)||rawGrowthDecision;
    renderGrowthAgent(growthDecision);
    renderDecisionGate(rawGrowthDecision,growthDecision,decisionEvidence);
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
    const freeGrowth=renderFreeGrowth(plan,data,marketing,seoScore);

    const exp = plan.recommendedExperiment;
    const learning = exp
      ? (Learning?.decide?.(exp,{sampleSize:Number(plan.funnel.sessions||0)}) || {decision:"collect",reason:"Learning engine unavailable.",next:"Collect evidence."})
      : {decision:"prepare",reason:"No active experiment selected.",next:"Prepare a measurable experiment."};

    const brainRows = [
      ["Marketing", marketing.primary ? "LIVE" : "READY"],
      ["Growth Agent", growthDecision?.primary_move?.state || "HOLD"],
      ["Free Growth", freeGrowth.primary?.state || "HOLD"],
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
    renderCreatorOS(data);
    renderAgenticGateway(data);
    renderPersonalization(data);
    renderSalesAdvertising(data);
    renderPromotionEngine(data);
    renderMarketplace(data);
    renderUniversity(data);
    renderEvidenceLedger(data);
    renderPayPlusSandbox(data);
    renderPayPlusStatus(data);
    renderPurchaseAttributionBridge(data);
    renderCampaignAttributionLedger(data);
    renderFrontendFailover(data);
    renderLiveAttribution(data);
    renderLiveActivation(data);
    renderSchemaActivation(data);
    renderDurableEventIdentity(data);
    renderServerPurchaseProof(data);
    renderAttributionContext(data);
    renderPaidAttribution(data);
    renderStudioCoverage();
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
