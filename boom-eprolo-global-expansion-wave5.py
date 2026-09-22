#!/usr/bin/env python3
import hashlib,json,time,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SECRET=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
MARKETS=["DE","FR","IT","ES","NL","GB","US","CA","AU","AE","JP","SG","SE","DK","FI","AT","BE","PL","PT","IE","CZ","GR","NO","CH","NZ","KR","HK","MY","TH","SA","MX","BR"]
COUNTRY_GATE=json.loads((ROOT/"boom-country-market-gate-contract.json").read_text())
POLICY=COUNTRY_GATE["eprolo_state"]["market_policy_states"]

PRODUCTS=[
 {"department":"women","product_id":"19999035","variant_id":"574938742","variant_title":"Apricot-XL","retail_shadow_usd":16.99},
 {"department":"women","product_id":"22274784","variant_id":"603592081","variant_title":"Set-M","retail_shadow_usd":24.99},
 {"department":"women","product_id":"22272693","variant_id":"603568523","variant_title":"Begonia red-M","retail_shadow_usd":24.99},
 {"department":"women","product_id":"22272701","variant_id":"603568575","variant_title":"Black-M","retail_shadow_usd":14.99},
 {"department":"women","product_id":"22274780","variant_id":"603592044","variant_title":"as picture-M-China","retail_shadow_usd":18.99},
 {"department":"pets","product_id":"24181199","variant_id":"625408065","variant_title":"rose-S","retail_shadow_usd":6.99},
 {"department":"pets","product_id":"24167510","variant_id":"625257020","variant_title":"Green-S","retail_shadow_usd":6.99},
 {"department":"tech","product_id":"31417803","variant_id":"712438901","variant_title":"Green","retail_shadow_usd":6.99},
 {"department":"tech","product_id":"26935524","variant_id":"658376303","variant_title":"USB3.0","retail_shadow_usd":9.99},
 {"department":"tech","product_id":"26972478","variant_id":"658737737","variant_title":"4","retail_shadow_usd":10.99},
 {"department":"tech","product_id":"26972443","variant_id":"658737654","variant_title":"two-in-one","retail_shadow_usd":10.99},
]

def creds():
    vals={}
    for raw in SECRET.read_text(errors="ignore").splitlines():
        line=raw.strip()
        if not line or line.startswith("#"): continue
        if "=" in line:k,v=line.split("=",1)
        elif ":" in line:k,v=line.split(":",1)
        else:continue
        vals[k.strip()]=v.strip()
    return vals.get("EPROLO_API_KEY") or vals.get("openApiKey"), vals.get("EPROLO_API_SECRET") or vals.get("openApiSecret")

def signed_get(path,params):
    key,secret=creds()
    ts=str(int(time.time()*1000))
    sign=hashlib.md5((key+ts+secret).encode()).hexdigest()
    q=dict(params); q["sign"]=sign; q["timestamp"]=ts
    req=urllib.request.Request(
        BASE+path+"?"+urllib.parse.urlencode(q),
        headers={"apiKey":key,"Accept":"application/json","User-Agent":"HUNT-GLOBAL-EXPANSION-WAVE5/1.0"}
    )
    with urllib.request.urlopen(req,timeout=15) as resp:
        return resp.status,json.loads(resp.read().decode("utf-8","replace"))

def cheapest(data):
    opts=[]
    for v in (data or {}).get("variantlist") or []:
        for lg in v.get("logistics_cost_list") or []:
            for x in lg.get("cost_list") or []:
                try:c=float(x.get("cost"))
                except:continue
                if c>=0:
                    opts.append({
                        "cost_usd":round(c,2),
                        "method":str(x.get("ship_method") or ""),
                        "shiptime":str(x.get("shiptime") or "")
                    })
    return min(opts,key=lambda x:x["cost_usd"]) if opts else None

results=[]
out_path=ROOT/"evidence/HUNT-EPROLO-GLOBAL-EXPANSION-WAVE5-2026-09-23.json"
for i,p in enumerate(PRODUCTS,1):
    print(f"START {i}/{len(PRODUCTS)} {p['department']} {p['product_id']}",flush=True)
    markets={}
    for j,cc in enumerate(MARKETS,1):
        try:
            st,b=signed_get("get_product_shiping_fees.html",{
                "productid":p["product_id"],"variantId":p["variant_id"],"countrycode":cc
            })
            sh=cheapest(b.get("data") if isinstance(b,dict) else {})
            ratio=round(sh["cost_usd"]/p["retail_shadow_usd"],3) if sh else None
            state="NORMAL" if ratio is not None and ratio<.8 else "HIGH_OR_MISSING"
            markets[cc]={
                "shipping":sh,
                "shipping_to_retail_ratio":ratio,
                "shipping_state":state,
                "market_policy_state":POLICY.get(cc,"HOLD_UNMAPPED"),
                "shadow_eligible":state=="NORMAL",
                "live_eligible":False
            }
        except Exception as e:
            markets[cc]={
                "error":type(e).__name__,
                "shipping_state":"ERROR",
                "market_policy_state":POLICY.get(cc,"HOLD_UNMAPPED"),
                "shadow_eligible":False,
                "live_eligible":False
            }
        time.sleep(.03)
    row={**p,"markets":markets}
    results.append(row)
    partial={
      "version":"HUNT-EPROLO-GLOBAL-EXPANSION-WAVE5-V1",
      "date":"2026-09-23","mode":"READ_ONLY_GLOBAL_SHADOW","provider":"EPROLO",
      "markets":MARKETS,"production_effect":False,
      "completed_products":len(results),"products_total":len(PRODUCTS),
      "results":results
    }
    out_path.write_text(json.dumps(partial,ensure_ascii=False,indent=2)+"\n")
    print("DONE",json.dumps({
      "id":p["product_id"],
      "normal_count":sum(1 for m in markets.values() if m.get("shipping_state")=="NORMAL"),
      "normal":[cc for cc,m in markets.items() if m.get("shipping_state")=="NORMAL"]
    }),flush=True)

summary={
  "products_checked":len(results),
  "markets_checked":len(MARKETS),
  "shipping_shadow_pairs":sum(
      1 for p in results for m in p["markets"].values() if m.get("shipping_state")=="NORMAL"
  ),
  "live_eligible_products":0,
  "production_effect":False
}
out={
 "version":"HUNT-EPROLO-GLOBAL-EXPANSION-WAVE5-V1",
 "date":"2026-09-23","mode":"READ_ONLY_GLOBAL_SHADOW","provider":"EPROLO",
 "markets":MARKETS,"production_effect":False,"summary":summary,"results":results
}
out_path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
