#!/usr/bin/env python3
import hashlib, json, subprocess
from collections import Counter, defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parent
E=ROOT/"evidence"
MARKETS=["IL","DE","US","SG"]
RESERVE=.09

def read(name):
    return json.load(open(E/name,encoding="utf-8"))

def sha(obj):
    raw=json.dumps(obj,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()

pilot=read("BOOM-BDIF-HUNT-1000-PILOT-CANDIDATES-2026-09-23.json")
shelves=read("HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json")
cj=read("HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json")
cj_idx={str(x["id"]):x for x in cj.get("results",[])}

# D5 freeze: freeze identity/order/market set. Do not freeze mutable outcome fields.
frozen_rows=[]
for p in pilot["products"]:
    frozen_rows.append({
      "pilot_id":p["pilot_id"],"provider":p["provider"],"item_id":str(p["item_id"]),
      "department":p.get("category",{}).get("value",{}).get("department"),
      "category":p.get("category",{}).get("value",{}).get("category"),
      "markets":list(pilot["target_markets"])
    })
assert len(frozen_rows)==1000
assert len({(x["provider"],x["item_id"]) for x in frozen_rows})==1000

base_commit=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
freeze={
 "version":"BOOM-BDIF-HUNT-1K-FREEZE-V1",
 "date":"2026-09-23",
 "mode":"SHADOW_FROZEN_DATASET",
 "production_effect":False,
 "base_commit":base_commit,
 "source":"evidence/BOOM-BDIF-HUNT-1000-PILOT-CANDIDATES-2026-09-23.json",
 "selected_products":1000,
 "markets":MARKETS,
 "product_market_pairs":4000,
 "identity_sha256":sha(frozen_rows),
 "rules":[
   "Product identity and cohort membership are frozen for D6 baseline evaluation.",
   "Supplier truth, stock, shipping, outcomes and labels may refresh as evidence but may not change cohort membership.",
   "New shelf-fill products are excluded from the frozen 1K unless Owner starts a new benchmark version.",
   "No Production/storefront/payment/order effect."
 ],
 "rows":frozen_rows
}
(E/"BOOM-BDIF-HUNT-1K-FROZEN-2026-09-23.json").write_text(json.dumps(freeze,ensure_ascii=False,indent=2)+"\n")

# Current Gate Ready set from actual shelves.
gate=[]
for dep in shelves["departments"]:
    for cat in dep["categories"]:
        for p in cat["products"]:
            if p.get("sell_state")=="GATE_READY_FINAL_PROFIT_RECHECK":
                gate.append((dep["slug"],cat["slug"],p))
assert len(gate)==709, len(gate)

def market_truth(p,market):
    # EPROLO fresh verification is embedded into destination_shipping.
    ds=(p.get("destination_shipping") or {}).get(market)
    if ds and ds.get("state")=="STOCK_SHIPPING_VERIFIED":
        supplier=float(ds.get("supplier_cost_usd") or p.get("supplier_cost_min") or 0)
        shipping=ds.get("shipping") or {}
        ship=float(shipping.get("cost_usd") if shipping.get("cost_usd") is not None else ds.get("supplier_shipping_usd") or 0)
        retail=float(ds.get("retail_shadow_usd") or p.get("profit_truth",{}).get("target_retail_shadow_usd") or 0)
        cust_ship=ds.get("customer_shipping_grossup_shadow_usd")
        if cust_ship is None and ship>=0:
            cust_ship=round(ship/(1-RESERVE),2)
        total=ds.get("customer_total_shadow_usd")
        if total is None:
            total=round(retail+float(cust_ship or 0),2)
        return {
          "source":"EPROLO_FRESH_SHIPPING_VERIFY",
          "supplier_cost_usd":supplier,
          "supplier_shipping_usd":ship,
          "target_retail_shadow_usd":retail,
          "customer_shipping_shadow_usd":float(cust_ship or 0),
          "customer_total_shadow_usd":float(total),
          "shipping_method":shipping.get("method"),
          "shipping_eta":shipping.get("eta"),
          "variant_id":str(ds.get("variant_id") or (p.get("exact_variant") or {}).get("id") or ""),
          "evidence_state":"VERIFIED_QUOTE_INPUTS"
        }
    # CJ 39 legacy verified products.
    c=cj_idx.get(str(p.get("item_id")))
    m=(c or {}).get("markets",{}).get(market)
    if m and m.get("state")=="STOCK_SHIPPING_VERIFIED":
        return {
          "source":"CJ_GAP_FILL_VERIFIED",
          "supplier_cost_usd":float(m["supplier_cost_usd"]),
          "supplier_shipping_usd":float(m["supplier_shipping_usd"]),
          "target_retail_shadow_usd":float(m["retail_shadow_usd"]),
          "customer_shipping_shadow_usd":float(m.get("customer_shipping_grossup_shadow_usd") or round(float(m["supplier_shipping_usd"])/(1-RESERVE),2)),
          "customer_total_shadow_usd":float(m.get("customer_total_shadow_usd") or (float(m["retail_shadow_usd"])+float(m.get("customer_shipping_grossup_shadow_usd") or 0))),
          "shipping_method":m.get("shipping_method"),
          "shipping_eta":m.get("shipping_aging"),
          "variant_id":str(m.get("variant_id") or ""),
          "evidence_state":"VERIFIED_QUOTE_INPUTS"
        }
    return None

pairs=[]
missing=[]
for dep,cat,p in gate:
    for market in MARKETS:
        mt=market_truth(p,market)
        if not mt:
            missing.append({"provider":p["provider"],"item_id":str(p["item_id"]),"market":market})
            continue
        gross=mt["customer_total_shadow_usd"]
        supplier=mt["supplier_cost_usd"]
        ship=mt["supplier_shipping_usd"]
        projected=round(gross*(1-RESERVE)-supplier-ship,2)
        blockers=[
          "PAYMENT_PROCESSOR_ACTUAL_FEE_NOT_REALIZED",
          "TAX_IMPORT_TREATMENT_NOT_VERIFIED",
          "FX_COST_NOT_REALIZED",
          "MARKETING_COST_PER_ORDER_NOT_REALIZED",
          "RETURNS_REFUNDS_REALIZED_COST_NOT_AVAILABLE",
          "DISCOUNT_COST_NOT_REALIZED",
          "SUPPLIER_FINAL_ORDER_COST_NOT_REALIZED"
        ]
        pairs.append({
          "provider":p["provider"],"item_id":str(p["item_id"]),
          "department":dep,"category":cat,"market":market,
          "variant_id":mt["variant_id"],
          "truth":{
            "supplier_cost":"VERIFIED_QUOTE_INPUT",
            "supplier_shipping":"VERIFIED_QUOTE_INPUT",
            "target_retail":"SHADOW_PRICE_GATE",
            "customer_shipping":"SHADOW_GROSSUP",
            "payment_fee":"UNKNOWN_ACTUAL",
            "tax_import":"UNKNOWN",
            "fx":"UNKNOWN_ACTUAL",
            "marketing_cost":"UNKNOWN_ACTUAL",
            "returns_refunds":"UNKNOWN_ACTUAL",
            "discount_cost":"UNKNOWN_ACTUAL",
            "supplier_final_order_cost":"UNKNOWN_UNTIL_ORDER_OR_FINAL_QUOTE"
          },
          "economics":{
            "supplier_cost_usd":round(supplier,2),
            "supplier_shipping_usd":round(ship,2),
            "target_retail_shadow_usd":round(mt["target_retail_shadow_usd"],2),
            "customer_shipping_shadow_usd":round(mt["customer_shipping_shadow_usd"],2),
            "customer_total_shadow_usd":round(gross,2),
            "projected_order_contribution_after_9pct_reserve_usd":projected,
            "reserve_rate":RESERVE,
            "final_net_profit_usd":None
          },
          "shipping":{"method":mt["shipping_method"],"eta":mt["shipping_eta"]},
          "state":"FINAL_PROFIT_INPUTS_PARTIAL",
          "final_profit_verified":False,
          "blockers":blockers,
          "production_effect":False
        })

assert not missing, f"missing verified market truth: {missing[:5]} total={len(missing)}"
assert len(pairs)==709*4, len(pairs)

by_provider=Counter(p["provider"] for p in pairs)
by_market=Counter(p["market"] for p in pairs)
contrib=[p["economics"]["projected_order_contribution_after_9pct_reserve_usd"] for p in pairs]
products_by_provider=Counter(p[2]["provider"] for p in gate)
blocker_counts=Counter(b for p in pairs for b in p["blockers"])

def median(vals):
    x=sorted(vals); n=len(x)
    return round((x[n//2] if n%2 else (x[n//2-1]+x[n//2])/2),2)

ledger={
 "version":"HUNT-FINAL-PROFIT-TRUTH-V1",
 "date":"2026-09-23","mode":"SHADOW","production_effect":False,
 "source_shelf":"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json",
 "gate_ready_products":709,
 "markets":MARKETS,
 "product_market_pairs":len(pairs),
 "summary":{
   "gate_ready_products":709,
   "gate_ready_products_by_provider":dict(products_by_provider),
   "verified_quote_input_pairs":len(pairs),
   "pairs_by_provider":dict(by_provider),
   "pairs_by_market":dict(by_market),
   "projected_order_contribution_min_usd":round(min(contrib),2),
   "projected_order_contribution_median_usd":median(contrib),
   "projected_order_contribution_max_usd":round(max(contrib),2),
   "final_profit_verified_products":0,
   "final_profit_verified_pairs":0,
   "final_profit_input_partial_pairs":len(pairs),
   "blocker_counts":dict(blocker_counts)
 },
 "interpretation":{
   "verified_now":"Exact Gate Ready product/variant plus supplier product cost and destination shipping quote are available for all 709 products in IL/DE/US/SG.",
   "projected_contribution":"A shadow contribution can be computed after the current 9% payment/refund reserve and shipping gross-up.",
   "not_final_profit":"The 9% reserve is not a substitute for realized payment fees, tax/import, FX, marketing, discounts, returns/refunds, or final supplier order cost.",
   "promotion_rule":"No pair may be labeled FINAL_NET_PROFIT_VERIFIED until all required cost inputs are verified or realized."
 },
 "pairs":pairs
}
(E/"HUNT-FINAL-PROFIT-TRUTH-709-2026-09-23.json").write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+"\n")

print(json.dumps({
 "freeze":{"selected_products":1000,"identity_sha256":freeze["identity_sha256"],"base_commit":base_commit},
 "final_profit":ledger["summary"]
},ensure_ascii=False,indent=2))
