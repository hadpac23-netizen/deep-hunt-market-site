#!/usr/bin/env python3
import hashlib, json, math, re, time, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SECRET_FILE=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
COUNTRY="IL"

CANDIDATES=[
 ("22272694",90),("22272657",85),("19427493",82),("22274784",79),
 ("22272639",79),("22272701",79),("22272691",79),("22272693",79),
 ("22274780",77),("19404377",76),("19374567",75),("19999035",74),
]

BLOCKED=re.compile(r"\b(lingerie|underwear|bikini|swimwear|transparent|see[- ]?through|weapon|knife|vape|cbd|thc|slimming|weight[- ]?loss)\b",re.I)
COMPONENT=re.compile(r"\b(top|tops|skirt|skirts|bottom|bottoms)\b",re.I)
FULLSET=re.compile(r"\b(set|sets|2pcs|2 pcs|two piece|two-piece)\b",re.I)

def creds():
    vals={}
    for raw in SECRET_FILE.read_text(errors="ignore").splitlines():
        line=raw.strip()
        if not line or line.startswith("#"): continue
        if "=" in line: k,v=line.split("=",1)
        elif ":" in line: k,v=line.split(":",1)
        else: continue
        vals[k.strip()]=v.strip()
    key=vals.get("EPROLO_API_KEY") or vals.get("openApiKey")
    secret=vals.get("EPROLO_API_SECRET") or vals.get("openApiSecret")
    if not key or not secret: raise RuntimeError("EPROLO_CREDENTIALS_MISSING")
    return key,secret

def signed_get(path,params=None):
    key,secret=creds()
    ts=str(int(time.time()*1000))
    sign=hashlib.md5((key+ts+secret).encode()).hexdigest()
    q=dict(params or {})
    q["sign"]=sign;q["timestamp"]=ts
    url=BASE+path+"?"+urllib.parse.urlencode(q)
    req=urllib.request.Request(url,headers={"apiKey":key,"ContentType":"application/json","Accept":"application/json","User-Agent":"HUNT-DEAL-EPROLO-WOMEN-SCAN-V2/1.0"})
    with urllib.request.urlopen(req,timeout=20) as resp:
        return resp.status,json.loads(resp.read().decode("utf-8","replace"))

def fresh_image(row):
    # Image freshness is validated in a separate visual QA lane so CDN latency cannot block commerce truth.
    return row.get("imagefirst"), "VISUAL_QA_PENDING"

def cheapest_ship(data):
    options=[]
    for v in (data or {}).get("variantlist") or []:
        for lg in v.get("logistics_cost_list") or []:
            for x in lg.get("cost_list") or []:
                try: cost=float(x.get("cost"))
                except: continue
                if cost<0: continue
                options.append({
                    "cost_usd":round(cost,2),
                    "method":str(x.get("ship_method") or ""),
                    "shiptime":str(x.get("shiptime") or ""),
                    "countrycode":str(x.get("countrycode") or "")
                })
    return min(options,key=lambda x:x["cost_usd"]) if options else None

def retail_shadow(cost):
    reserve=.91; min_profit=4.0; target=.35
    contribution=(cost+min_profit)/reserve
    margin=cost/(reserve-target)
    retail=max(.99,math.ceil(max(contribution,margin))-0.01)
    profit=retail*reserve-cost
    return {
      "retail_usd":round(retail,2),
      "projected_product_profit_usd":round(profit,2),
      "projected_product_margin":round(profit/retail,4)
    }

def load_category():
    rows=[]
    for page in range(1,5):
        st,body=signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeTwoId":1241})
        if st!=200 or str(body.get("code"))!="0": break
        data=body.get("data") or []
        rows.extend(data)
        if len(data)<200: break
        time.sleep(.12)
    return {str(x.get("product_id") or x.get("id")):x for x in rows}

def select_variant_pool(row):
    raw=[]
    for v in row.get("variantlist") or []:
        title=str(v.get("title") or "")
        try: stock=max(0,int(float(v.get("inventory_quantity") or 0)))
        except: stock=0
        try: cost=float(v.get("cost"))
        except: cost=-1
        try: weight=float(v.get("weight") or 99999)
        except: weight=99999
        vid=str(v.get("id") or v.get("variantsid") or v.get("variantId") or "")
        if vid and stock>0 and cost>0:
            raw.append({"id":vid,"title":title,"stock":stock,"cost":cost,"weight":weight,"row":v})
    has_components=any(COMPONENT.search(x["title"]) for x in raw)
    has_fullset=any(FULLSET.search(x["title"]) for x in raw)
    if has_components and has_fullset:
        pool=[x for x in raw if FULLSET.search(x["title"])]
        scope="FULL_SET_REQUIRED"
    elif has_components and not has_fullset:
        pool=[]
        scope="COMPONENT_ONLY_NO_FULL_SET"
    else:
        pool=raw
        scope="SINGLE_PRODUCT_OR_COLOR_SIZE_VARIANTS"
    pool.sort(key=lambda x:(x["cost"],x["weight"],-x["stock"]))
    return pool,scope,len(raw)

catalog=load_category()
results=[]
for pid,score in CANDIDATES:
    row=catalog.get(pid)
    if not row:
        results.append({"product_id":pid,"curation_score":score,"status":"CATALOG_ROW_NOT_FOUND"})
        continue
    title=str(row.get("title") or "").strip()
    if not title or BLOCKED.search(title):
        results.append({"product_id":pid,"title":title,"curation_score":score,"status":"BLOCKED_TITLE"})
        continue
    img,img_state=fresh_image(row)
    variants,scope,total_variants=select_variant_pool(row)
    if not variants:
        results.append({
            "product_id":pid,"title":title,"curation_score":score,
            "status":"VARIANT_SCOPE_BLOCKED","variant_scope":scope,
            "variant_count":total_variants,"image_url":img,"image_state":img_state
        })
        continue
    picked=None
    attempts=[]
    for item in variants[:8]:
        vid=item["id"]; v=item["row"]; cost=item["cost"]
        try:
            st,body=signed_get("get_product_shiping_fees.html",{"productid":pid,"variantId":vid,"countrycode":COUNTRY})
            ship=cheapest_ship(body.get("data") if isinstance(body,dict) else {})
            attempts.append({"variant_id":vid,"http":st,"code":body.get("code"),"ship":ship})
            if st==200 and str(body.get("code"))=="0" and ship:
                shadow=retail_shadow(cost)
                ratio=round(ship["cost_usd"]/shadow["retail_usd"],3) if shadow["retail_usd"] else None
                picked={
                  "product_id":pid,"title":title,"curation_score":score,
                  "status":"SHIPPING_VERIFIED_PRICE_SHADOW",
                  "variant_scope":scope,
                  "variant_count":total_variants,
                  "variant":{
                    "id":vid,"title":v.get("title"),"sku":v.get("sku"),
                    "supplier_cost_usd":round(cost,2),"inventory_quantity":item["stock"],
                    "weight_g":item["weight"]
                  },
                  "shipping_il":ship,
                  "shipping_to_retail_ratio":ratio,
                  "commercial_training_flag":"HIGH_SHIPPING_BURDEN" if ratio is None or ratio>=.8 else "NORMAL_SHIPPING_BURDEN",
                  "price_gate_shadow":shadow,
                  "customer_shipping_grossup_shadow_usd":round(ship["cost_usd"]/.91,2),
                  "image_url":img,"image_state":img_state,
                  "visual_gate":"VISUAL_QA_PENDING" if img else "BLOCKED_IMAGE_FRESHNESS",
                  "final_profit_verified":False,
                  "checkout":"DISABLED","fulfillment":"DISABLED"
                }
                break
        except Exception as e:
            attempts.append({"variant_id":vid,"error":type(e).__name__})
    results.append(picked or {
      "product_id":pid,"title":title,"curation_score":score,
      "status":"NO_IL_SHIPPING_QUOTE","variant_scope":scope,
      "image_url":img,"image_state":img_state,"attempts":attempts
    })
    time.sleep(.12)

verified=[x for x in results if x.get("status")=="SHIPPING_VERIFIED_PRICE_SHADOW"]
fresh=[x for x in verified if x.get("commercial_training_flag")=="NORMAL_SHIPPING_BURDEN" and x.get("visual_gate")=="VISUAL_QA_PENDING"]
out={
 "version":"HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2",
 "date":"2026-09-22","mode":"READ_ONLY_SHADOW","destination":"IL","production_effect":False,
 "summary":{
   "checked":len(results),
   "shipping_verified":len(verified),
   "visual_qa_pending_candidates":sum(1 for x in verified if x.get("visual_gate")=="VISUAL_QA_PENDING" and x.get("commercial_training_flag")=="NORMAL_SHIPPING_BURDEN"),
   "high_shipping_review":sum(1 for x in verified if x.get("commercial_training_flag")=="HIGH_SHIPPING_BURDEN"),
   "image_freshness_blocked":sum(1 for x in verified if x.get("visual_gate")=="BLOCKED_IMAGE_FRESHNESS"),
   "final_profit_verified":0,
   "checkout_live":0
 },
 "results":results,
 "truth_rules":[
   "If a listing exposes both component variants and full-set variants, only full-set variants may represent the full-set listing.",
   "Fresh image required for shelf candidacy.",
   "Shipping must be live-quoted to IL.",
   "Price Gate remains shadow until final order-cost method is verified.",
   "No checkout or fulfillment."
 ]
}
(ROOT/"evidence/HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2-2026-09-22.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({
 "summary":out["summary"],
 "products":[{
   "id":x.get("product_id"),"title":x.get("title"),"status":x.get("status"),
   "variant_scope":x.get("variant_scope"),"variant":(x.get("variant") or {}).get("title"),
   "cost":(x.get("variant") or {}).get("supplier_cost_usd"),
   "ship":(x.get("shipping_il") or {}).get("cost_usd"),
   "retail":(x.get("price_gate_shadow") or {}).get("retail_usd"),
   "ratio":x.get("shipping_to_retail_ratio"),
   "image":x.get("image_state"),
   "flag":x.get("commercial_training_flag")
 } for x in results]},ensure_ascii=False,indent=2))
