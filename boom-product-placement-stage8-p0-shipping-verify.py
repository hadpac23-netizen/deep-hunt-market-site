#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, math, time
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)

IN=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QA-SHORTLIST-V2-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SHIPPING-VERIFY-2026-09-23.json"
MARKETS=["IL","DE","US","SG"]

def cheapest(data):
    opts=[]
    for v in (data or {}).get("variantlist") or []:
        for lg in v.get("logistics_cost_list") or []:
            for x in lg.get("cost_list") or []:
                try: c=float(x.get("cost"))
                except: continue
                if c>=0:
                    opts.append({
                      "cost_usd":round(c,2),
                      "method":str(x.get("ship_method") or ""),
                      "eta":str(x.get("shiptime") or "")
                    })
    return min(opts,key=lambda x:x["cost_usd"]) if opts else None

def price_gate_v21(cost):
    reserve=.91
    min_profit=4.0
    target=.35
    raw=max((cost+min_profit)/reserve,cost/(reserve-target))
    retail=max(.99,math.ceil(raw+0.01)-0.01)
    contribution=retail*reserve-cost
    return {
      "price_gate_version":"HUNT-CJ-RETAIL-PRICE-GATE-V2.1",
      "retail_shadow_usd":round(retail,2),
      "product_contribution_shadow_usd":round(contribution,2),
      "product_margin_shadow":round(contribution/retail,4)
    }

def verify(p):
    pid=str(p["item_id"])
    v=p["exact_variant"]
    vid=str(v["id"])
    cost=float(v["supplier_cost_usd"])
    markets={}
    for cc in MARKETS:
        result=None
        for attempt in range(2):
            try:
                st,b=api.signed_get("get_product_shiping_fees.html",{
                  "productid":pid,"variantId":vid,"countrycode":cc
                })
                ship=cheapest(b.get("data") if isinstance(b,dict) else {})
                if st==200 and str(b.get("code"))=="0" and ship:
                    result={"state":"STOCK_SHIPPING_VERIFIED","shipping":ship}
                    break
                result={"state":"NO_VERIFIED_SHIPPING","http":st,"code":b.get("code") if isinstance(b,dict) else None}
            except Exception as e:
                result={"state":"ERROR","error":type(e).__name__}
                time.sleep(.15*(attempt+1))
        pg=price_gate_v21(cost)
        if result and result.get("state")=="STOCK_SHIPPING_VERIFIED":
            ship=result["shipping"]["cost_usd"]
            customer_ship=round(ship/.91,2)
            total=round(pg["retail_shadow_usd"]+customer_ship,2)
            projected=round(total*.91-cost-ship,2)
            result.update({
              "variant_id":vid,
              "supplier_cost_usd":round(cost,2),
              **pg,
              "customer_shipping_grossup_shadow_usd":customer_ship,
              "customer_total_shadow_usd":total,
              "projected_order_contribution_after_9pct_reserve_usd":projected,
              "final_net_profit_verified":False
            })
        markets[cc]=result
    passes=sum(1 for x in markets.values() if x and x.get("state")=="STOCK_SHIPPING_VERIFIED")
    return {
      "provider":"EPROLO","item_id":pid,"rail":p["rail"],"title":p["title"],
      "image_url":p["image_url"],"exact_variant":v,
      "markets":markets,"verified_markets":passes,
      "status":"VERIFIED_4_OF_4" if passes==4 else ("PARTIAL" if passes else "NO_MARKET_PASS"),
      "quality_state":"PENDING_VISUAL_QA",
      "profit_state":"PROJECTED_PRODUCT_CONTRIBUTION_ONLY" if passes else "NOT_READY",
      "final_net_profit_verified":False,
      "production_effect":False
    }

short=json.load(open(IN))
items=[p for rows in short.get("rails",{}).values() for p in rows if p.get("provider")=="EPROLO"]
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for i,r in enumerate(ex.map(verify,items),1):
        results.append(r)
        if i%20==0: print("PROGRESS",i,"/",len(items),flush=True)

byrail={}
for r in results:
    s=byrail.setdefault(r["rail"],{"checked":0,"verified_4_of_4":0,"partial":0,"no_market_pass":0})
    s["checked"]+=1
    if r["status"]=="VERIFIED_4_OF_4":s["verified_4_of_4"]+=1
    elif r["status"]=="PARTIAL":s["partial"]+=1
    else:s["no_market_pass"]+=1

summary={
 "products_checked":len(results),
 "verified_4_of_4":sum(r["status"]=="VERIFIED_4_OF_4" for r in results),
 "partial":sum(r["status"]=="PARTIAL" for r in results),
 "no_market_pass":sum(r["status"]=="NO_MARKET_PASS" for r in results),
 "market_pass_counts":{cc:sum(r["markets"][cc] and r["markets"][cc].get("state")=="STOCK_SHIPPING_VERIFIED" for r in results) for cc in MARKETS},
 "final_net_profit_verified_products":0,
 "checkout_live":0,"payment_live":0,"fulfillment_live":0,"production_effect":False
}
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SHIPPING-VERIFY-V1",
 "date":"2026-09-23","mode":"READ_ONLY_SHADOW","production_effect":False,"provider":"EPROLO",
 "markets":MARKETS,"summary":summary,"by_rail":byrail,"results":results,
 "rules":[
   "Official EPROLO shipping API only.",
   "Exact in-stock variant from Stage8 QA shortlist.",
   "All four markets must return real shipping options for VERIFIED_4_OF_4.",
   "Price Gate V2.1 produces projected Product Contribution, not Final Net Profit.",
   "Visual QA remains pending.",
   "No order, checkout, payment, fulfillment or Production mutation."
 ]
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
for rail,s in sorted(byrail.items()):print("RAIL",rail,s,flush=True)
