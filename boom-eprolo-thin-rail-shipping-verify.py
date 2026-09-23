#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, math, time
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
MARKETS=["IL","DE","US","SG"]

shelves=json.load(open(ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"))
thin=json.load(open(ROOT/"evidence/HUNT-EPROLO-THIN-RAIL-PULL-2026-09-23.json"))

selected=set()
for d in shelves["departments"]:
    for c in d["categories"]:
        for p in c["products"]:
            selected.add(f'{p.get("provider")}:{p.get("item_id")}')

index={}
for rail,rows in thin["rails"].items():
    for p in rows:
        key=f'{p["provider"]}:{p["item_id"]}'
        if key in selected:index[key]=(rail,p)

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
    reserve=.91;min_profit=4.;target=.35
    raw=max((cost+min_profit)/reserve,cost/(reserve-target))
    retail=max(.99,math.ceil(raw)-.01)
    contribution=retail*reserve-cost
    return {"retail_shadow_usd":round(retail,2),"product_contribution_shadow_usd":round(contribution,2),"product_margin_shadow":round(contribution/retail,4)}

def one(item):
    key,(rail,p)=item
    pid=str(p["item_id"]);v=p["exact_variant"];vid=str(v["id"]);cost=float(v["supplier_cost_usd"])
    markets={}
    for cc in MARKETS:
        result=None
        for attempt in range(2):
            try:
                st,b=api.signed_get("get_product_shiping_fees.html",{"productid":pid,"variantId":vid,"countrycode":cc})
                ship=cheapest(b.get("data") if isinstance(b,dict) else {})
                if st==200 and str(b.get("code"))=="0" and ship:
                    result={"state":"STOCK_SHIPPING_VERIFIED","shipping":ship}
                    break
                result={"state":"NO_VERIFIED_SHIPPING","http":st,"code":b.get("code") if isinstance(b,dict) else None}
            except Exception as e:
                result={"state":"ERROR","error":type(e).__name__}
                time.sleep(.15*(attempt+1))
        pg=gate(cost)
        if result and result.get("state")=="STOCK_SHIPPING_VERIFIED":
            ship=result["shipping"]["cost_usd"]
            customer_ship=round(ship/.91,2)
            gross=round(pg["retail_shadow_usd"]+customer_ship,2)
            projected=round(gross*.91-cost-ship,2)
            result.update({
              "variant_id":vid,"supplier_cost_usd":round(cost,2),
              **pg,
              "customer_shipping_grossup_shadow_usd":customer_ship,
              "customer_total_shadow_usd":gross,
              "projected_order_contribution_after_9pct_reserve_usd":projected,
              "shipping_to_retail_ratio":round(ship/pg["retail_shadow_usd"],3) if pg["retail_shadow_usd"] else None,
              "final_profit_verified":False
            })
        markets[cc]=result
    passes=sum(1 for x in markets.values() if x.get("state")=="STOCK_SHIPPING_VERIFIED")
    return {
      "provider":"EPROLO","item_id":pid,"rail":rail,"title":p["title"],
      "exact_variant":v,"markets":markets,
      "verified_markets":passes,
      "status":"VERIFIED_4_OF_4" if passes==4 else ("PARTIAL" if passes else "NO_MARKET_PASS"),
      "production_effect":False
    }

results=[]
items=list(index.items())
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for i,r in enumerate(ex.map(one,items),1):
        results.append(r)
        if i%50==0: print("PROGRESS",i,"/",len(items),flush=True)

summary={
 "products_checked":len(results),
 "verified_4_of_4":sum(1 for x in results if x["status"]=="VERIFIED_4_OF_4"),
 "partial":sum(1 for x in results if x["status"]=="PARTIAL"),
 "no_market_pass":sum(1 for x in results if x["status"]=="NO_MARKET_PASS"),
 "market_pass_counts":{cc:sum(1 for x in results if x["markets"][cc].get("state")=="STOCK_SHIPPING_VERIFIED") for cc in MARKETS},
 "final_profit_verified_products":0,
 "checkout_live":0,"payment_live":0,"fulfillment_live":0,"production_effect":False
}
out={
 "version":"HUNT-EPROLO-THIN-RAIL-SHIPPING-VERIFY-V1","date":"2026-09-23","mode":"READ_ONLY_SHADOW",
 "provider":"EPROLO","markets":MARKETS,"summary":summary,"results":results,
 "rules":[
  "Official EPROLO shipping API only",
  "Exact in-stock variant selected from fresh official catalog pull",
  "Destination shipping must return a real option to pass",
  "Price Gate V2 contribution remains projected, not final net profit",
  "No order, checkout, payment, fulfillment or Production mutation"
 ]
}
(ROOT/"evidence/HUNT-EPROLO-THIN-RAIL-SHIPPING-VERIFY-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
