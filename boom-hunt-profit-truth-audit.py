#!/usr/bin/env python3
import json,statistics
from collections import Counter,defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
CJ=ROOT/"evidence/HUNT-CJ-GAP-FILL-VERIFIED-2026-09-23.json"
EP=ROOT/"evidence/HUNT-EPROLO-GLOBAL-PRODUCT-MARKET-MATRIX-2026-09-23.json"
THIN_SHIP=ROOT/"evidence/HUNT-EPROLO-THIN-RAIL-SHIPPING-VERIFY-2026-09-23.json"
DEEP_SHIP=ROOT/"evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-SHIPPING-VERIFY-2026-09-23.json"

s=json.load(open(SHELVES)); cj=json.load(open(CJ)); ep=json.load(open(EP)); thin=json.load(open(THIN_SHIP)) if THIN_SHIP.exists() else {"results":[],"summary":{}}; deep=json.load(open(DEEP_SHIP)) if DEEP_SHIP.exists() else {"results":[],"summary":{}}
rows=[]
seen=set()
for dep in s["departments"]:
    for cat in dep["categories"]:
        for p in cat["products"]:
            key=f'{p.get("provider")}:{p.get("item_id")}'
            if key in seen:continue
            seen.add(key)
            pt=p.get("profit_truth") or {}
            rows.append((dep["slug"],cat["slug"],p,pt))

verified_rows=[(d,c,p,pt) for d,c,p,pt in rows if pt.get("state")=="PROJECTED_PRODUCT_CONTRIBUTION_ONLY"]
provisional_rows=[(d,c,p,pt) for d,c,p,pt in rows if pt.get("state")=="PROVISIONAL_CATALOG_PRICE_PROJECTION"]
vals=[float(pt["projected_product_contribution_usd"]) for _,_,_,pt in verified_rows]
marg=[float(pt["projected_product_margin"]) for _,_,_,pt in verified_rows]
providers=Counter(p.get("provider","UNKNOWN") for _,_,p,_ in rows)
bydep=defaultdict(list)
for dep,_,p,pt in rows:
    if pt.get("projected_product_contribution_usd") is not None:bydep[dep].append(float(pt["projected_product_contribution_usd"]))

pair_rows=[]
for pr in cj.get("results",[]):
    for cc,m in (pr.get("markets") or {}).items():
        if m.get("state")!="STOCK_SHIPPING_VERIFIED":continue
        retail=float(m["retail_shadow_usd"])
        customer_ship=float(m["customer_shipping_grossup_shadow_usd"])
        supplier=float(m["supplier_cost_usd"])
        ship=float(m["supplier_shipping_usd"])
        gross=retail+customer_ship
        projected_after_reserves=gross*.91-supplier-ship
        pair_rows.append({
          "product_id":str(pr["id"]),"market":cc,
          "customer_total_shadow_usd":round(gross,2),
          "supplier_product_usd":round(supplier,2),"supplier_shipping_usd":round(ship,2),
          "projected_order_contribution_after_9pct_reserve_usd":round(projected_after_reserves,2),
          "final_profit_verified":False
        })

ep_shipping_pairs=0
for pr in ep.get("products",[]):
    for cc,m in (pr.get("market_truth") or {}).items():
        if (m.get("shipping") or {}).get("cost_usd") is not None:ep_shipping_pairs+=1
thin_verified_pairs=sum(1 for pr in thin.get("results",[]) for cc,m in (pr.get("markets") or {}).items() if (m or {}).get("state")=="STOCK_SHIPPING_VERIFIED")
thin_verified_4=sum(1 for pr in thin.get("results",[]) if pr.get("status")=="VERIFIED_4_OF_4")
gate_ready=sum(1 for _,_,p,_ in rows if p.get("sell_state")=="GATE_READY_FINAL_PROFIT_RECHECK")
deep_verified_pairs=sum(1 for pr in deep.get("results",[]) for cc,m in (pr.get("markets") or {}).items() if (m or {}).get("state")=="STOCK_SHIPPING_VERIFIED")
deep_verified_4=sum(1 for pr in deep.get("results",[]) if pr.get("status")=="VERIFIED_4_OF_4")
destination_contrib=[]
for dataset in (thin,deep):
    for pr in dataset.get("results",[]):
        for cc,m in (pr.get("markets") or {}).items():
            if (m or {}).get("state")=="STOCK_SHIPPING_VERIFIED" and m.get("projected_order_contribution_after_9pct_reserve_usd") is not None:
                destination_contrib.append(float(m["projected_order_contribution_after_9pct_reserve_usd"]))
for pr in cj.get("results",[]):
    for cc,m in (pr.get("markets") or {}).items():
        if (m or {}).get("state")=="STOCK_SHIPPING_VERIFIED" and m.get("product_contribution_shadow_usd") is not None:
            destination_contrib.append(float(m["product_contribution_shadow_usd"]))

out={
 "version":"HUNT-PROFIT-TRUTH-AUDIT-V1",
 "date":"2026-09-23","mode":"SHADOW","production_effect":False,
 "summary":{
   "unique_shelf_products":len(rows),
   "provider_counts":dict(providers),
   "projected_product_contribution_checked":len(vals),
   "provisional_catalog_price_projection_products":len(provisional_rows),
   "projected_contribution_min_usd":round(min(vals),2) if vals else None,
   "projected_contribution_median_usd":round(statistics.median(vals),2) if vals else None,
   "projected_contribution_p90_usd":round(statistics.quantiles(vals,n=10)[8],2) if len(vals)>=10 else None,
   "projected_contribution_max_usd":round(max(vals),2) if vals else None,
   "projected_margin_min":round(min(marg),4) if marg else None,
   "projected_margin_median":round(statistics.median(marg),4) if marg else None,
   "projected_margin_max":round(max(marg),4) if marg else None,
   "price_gate_tolerance_pass":sum(1 for _,_,_,pt in verified_rows if float(pt.get("projected_product_contribution_usd",-1))>=4.0 and float(pt.get("projected_product_margin",-1))>=.35),
   "cj_stock_shipping_verified_market_pairs":len(pair_rows),
   "eprolo_existing_shipping_shadow_pairs":ep_shipping_pairs,
   "eprolo_thin_rail_verified_market_pairs":thin_verified_pairs,
   "eprolo_thin_rail_verified_4_of_4_products":thin_verified_4,
   "eprolo_deep_verified_market_pairs":deep_verified_pairs,
   "eprolo_deep_verified_4_of_4_products":deep_verified_4,
   "destination_aware_projected_order_contribution_pairs":len(destination_contrib),
   "destination_aware_projected_order_contribution_min_usd":round(min(destination_contrib),2) if destination_contrib else None,
   "destination_aware_projected_order_contribution_median_usd":round(statistics.median(destination_contrib),2) if destination_contrib else None,
   "destination_aware_projected_order_contribution_max_usd":round(max(destination_contrib),2) if destination_contrib else None,
   "gate_ready_final_profit_recheck_products":gate_ready,
   "final_profit_verified_products":sum(1 for _,_,_,pt in rows if pt.get("final_profit_verified") is True),
   "checkout_live":0,"payment_live":0,"fulfillment_live":0
 },
 "department_projected_contribution_median_usd":{
   dep:round(statistics.median(v),2) for dep,v in sorted(bydep.items()) if v
 },
 "cj_verified_market_pair_examples":pair_rows[:20],
 "profit_layers":{
   "PROJECTED_PRODUCT_CONTRIBUTION":"Price Gate V2 supplier-cost projection after 9% payment/refund reserve; shipping is priced separately.",
   "PROJECTED_ORDER_CONTRIBUTION":"For CJ verified market pairs, customer shipping gross-up offsets supplier shipping after the same 9% reserve; still excludes tax/import, FX, marketing and realized returns.",
   "FINAL_NET_PROFIT_VERIFIED":"Requires complete attributed order economics. None are verified yet."
 },
 "final_profit_blockers":[
   "tax_and_import_by_destination_not_fully_verified",
   "payment_processor_actual_fee_not_realized",
   "fx_cost_not_realized",
   "marketing_cost_per_order_not_realized",
   "returns_refunds_not_realized",
   "supplier_final_order_cost_api_not_verified_for_EPROLO"
 ],
 "rules":[
   "Never label projected contribution as final net profit.",
   "No live price change from this audit.",
   "No checkout/payment/order/fulfillment activation.",
   "Unknown final-cost components keep FINAL_NET_PROFIT_VERIFIED=false."
 ]
}
(ROOT/"evidence/HUNT-PROFIT-TRUTH-AUDIT-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out["summary"],ensure_ascii=False,indent=2))
