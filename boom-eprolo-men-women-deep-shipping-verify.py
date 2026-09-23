#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, math, time
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
MARKETS=["IL","DE","US","SG"]
data=json.load(open(ROOT/"evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-PULL-2026-09-23.json"))
items={}
for rail,rows in data.get("rails",{}).items():
    for p in rows:
        items.setdefault("EPROLO:"+p["item_id"],(rail,p))

def cheapest(data):
    opts=[]
    for v in (data or {}).get("variantlist") or []:
      for lg in v.get("logistics_cost_list") or []:
        for x in lg.get("cost_list") or []:
          try:c=float(x.get("cost"))
          except:continue
          if c>=0:opts.append({"cost_usd":round(c,2),"method":str(x.get("ship_method") or ""),"eta":str(x.get("shiptime") or "")})
    return min(opts,key=lambda x:x["cost_usd"]) if opts else None

def gate(cost):
    reserve=.91;floor=.35;minp=4
    raw=max((cost+minp)/reserve,cost/(reserve-floor))
    retail=max(.99,math.ceil(raw)-.01)
    if retail*(reserve-floor)<cost:retail=round(retail+1,2)
    contribution=retail*reserve-cost
    return {"retail_shadow_usd":round(retail,2),"product_contribution_shadow_usd":round(contribution,2),"product_margin_shadow":round(contribution/retail,4)}

def one(item):
    _,(rail,p)=item
    pid=str(p["item_id"]);v=p["exact_variant"];vid=str(v["id"]);cost=float(v["supplier_cost_usd"])
    markets={}
    for cc in MARKETS:
      result=None
      for attempt in range(2):
        try:
          st,b=api.signed_get("get_product_shiping_fees.html",{"productid":pid,"variantId":vid,"countrycode":cc})
          sh=cheapest(b.get("data") if isinstance(b,dict) else {})
          if st==200 and str(b.get("code"))=="0" and sh:
            pg=gate(cost); ship=sh["cost_usd"];customer=round(ship/.91,2)
            result={"state":"STOCK_SHIPPING_VERIFIED","shipping":sh,"variant_id":vid,"supplier_cost_usd":round(cost,2),**pg,
                    "customer_shipping_grossup_shadow_usd":customer,
                    "customer_total_shadow_usd":round(pg["retail_shadow_usd"]+customer,2),
                    "projected_order_contribution_after_9pct_reserve_usd":pg["product_contribution_shadow_usd"],
                    "final_profit_verified":False}
            break
          result={"state":"NO_VERIFIED_SHIPPING","http":st,"code":b.get("code") if isinstance(b,dict) else None}
        except Exception as e:
          result={"state":"ERROR","error":type(e).__name__};time.sleep(.1)
      markets[cc]=result
    passes=sum(1 for x in markets.values() if x and x.get("state")=="STOCK_SHIPPING_VERIFIED")
    return {**p,"rail":rail,"markets":markets,"verified_markets":passes,
            "status":"VERIFIED_4_OF_4" if passes==4 else ("PARTIAL" if passes else "NO_MARKET_PASS"),
            "production_effect":False}

results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for r in ex.map(one,list(items.items())):results.append(r)
summary={
 "products_checked":len(results),
 "verified_4_of_4":sum(x["status"]=="VERIFIED_4_OF_4" for x in results),
 "partial":sum(x["status"]=="PARTIAL" for x in results),
 "no_market_pass":sum(x["status"]=="NO_MARKET_PASS" for x in results),
 "market_pass_counts":{cc:sum((x["markets"].get(cc) or {}).get("state")=="STOCK_SHIPPING_VERIFIED" for x in results) for cc in MARKETS},
 "final_profit_verified_products":0,"production_effect":False
}
out={"version":"HUNT-EPROLO-MEN-WOMEN-DEEP-SHIPPING-VERIFY-V1","date":"2026-09-23","mode":"READ_ONLY_SHADOW","provider":"EPROLO","markets":MARKETS,
     "summary":summary,"results":results,
     "rules":["Official EPROLO shipping API only","Exact in-stock variant from deep pull","Destination quote required","Projected contribution is not final net profit","No Production/order/payment/fulfillment"]}
(ROOT/"evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-SHIPPING-VERIFY-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary))
for x in results:
  if x["category"]=="men-jeans":print("MEN_JEANS",json.dumps({"item_id":x["item_id"],"title":x["title"],"status":x["status"],"markets":x["verified_markets"]},ensure_ascii=False))
