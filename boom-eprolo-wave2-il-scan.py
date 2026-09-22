#!/usr/bin/env python3
import hashlib, json, math, re, time, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SECRET_FILE=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
COUNTRY="IL"

CANDIDATES=[
 {"department":"men","category":"men-tops","product_id":"25364597","supplier_category_id":1221},
 {"department":"men","category":"men-bottoms","product_id":"25354414","supplier_category_id":1230},
 {"department":"home","category":"lighting","product_id":"31495410","supplier_category_id":46},
 {"department":"home","category":"lighting","product_id":"31458459","supplier_category_id":109},
 {"department":"kitchen","category":"tableware","product_id":"28135745","supplier_category_id":127},
 {"department":"kitchen","category":"tableware","product_id":"30284442","supplier_category_id":112},
 {"department":"tech","category":"phone-accessories","product_id":"26647469","supplier_category_id":122},
 {"department":"tech","category":"camera-accessories","product_id":"8532420","supplier_category_id":39},
 {"department":"pets","category":"pet-accessories","product_id":"24181199","supplier_category_id":1234},
 {"department":"pets","category":"pet-accessories","product_id":"24167510","supplier_category_id":1234},
]

BLOCKED=re.compile(r"\b(lingerie|underwear|bikini|swimwear|weapon|knife|blade|gun|firearm|tactical|hunting|vape|cigarette|nicotine|cbd|thc|slimming|weight[- ]?loss|massage|therapy|medical|adult)\b",re.I)
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
    q=dict(params or {}); q["sign"]=sign; q["timestamp"]=ts
    url=BASE+path+"?"+urllib.parse.urlencode(q)
    req=urllib.request.Request(url,headers={"apiKey":key,"ContentType":"application/json","Accept":"application/json","User-Agent":"HUNT-DEAL-EPROLO-WAVE2/1.0"})
    with urllib.request.urlopen(req,timeout=20) as resp:
        return resp.status,json.loads(resp.read().decode("utf-8","replace"))

def cheapest_ship(data):
    opts=[]
    for v in (data or {}).get("variantlist") or []:
        for lg in v.get("logistics_cost_list") or []:
            for x in lg.get("cost_list") or []:
                try:c=float(x.get("cost"))
                except:continue
                if c<0:continue
                opts.append({"cost_usd":round(c,2),"method":str(x.get("ship_method") or ""),"shiptime":str(x.get("shiptime") or ""),"countrycode":str(x.get("countrycode") or "")})
    return min(opts,key=lambda x:x["cost_usd"]) if opts else None

def retail_shadow(cost):
    reserve=.91; target=.35; min_profit=4.0
    floor=max((cost+min_profit)/reserve,cost/(reserve-target))
    retail=max(.99,math.ceil(floor)-.01)
    profit=retail*reserve-cost
    return {"retail_usd":round(retail,2),"projected_product_profit_usd":round(profit,2),"projected_product_margin":round(profit/retail,4)}

def load_category(cat):
    rows=[]
    for page in range(1,4):
        st,b=signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeTwoId":cat})
        if st!=200 or str(b.get("code"))!="0":break
        data=b.get("data") or []; rows.extend(data)
        if len(data)<200:break
        time.sleep(.08)
    return {str(x.get("product_id") or x.get("id")):x for x in rows}

catalogs={}
for cat in sorted({x["supplier_category_id"] for x in CANDIDATES}):
    catalogs[cat]=load_category(cat)

def pool(row):
    raw=[]
    for v in row.get("variantlist") or []:
        title=str(v.get("title") or "")
        try:stock=max(0,int(float(v.get("inventory_quantity") or 0)))
        except:stock=0
        try:cost=float(v.get("cost"))
        except:cost=-1
        try:weight=float(v.get("weight") or 99999)
        except:weight=99999
        vid=str(v.get("id") or v.get("variantsid") or v.get("variantId") or "")
        if vid and stock>0 and cost>0:raw.append({"id":vid,"title":title,"stock":stock,"cost":cost,"weight":weight,"row":v})
    has_components=any(COMPONENT.search(x["title"]) for x in raw)
    has_fullset=any(FULLSET.search(x["title"]) for x in raw)
    if has_components and has_fullset:
        raw=[x for x in raw if FULLSET.search(x["title"])]
        scope="FULL_SET_REQUIRED"
    elif has_components and not has_fullset:
        scope="COMPONENT_VARIANTS_PRESENT"
    else:scope="SINGLE_PRODUCT_OR_COLOR_SIZE_VARIANTS"
    raw.sort(key=lambda x:(x["cost"],x["weight"],-x["stock"]))
    return raw,scope

results=[]
for c in CANDIDATES:
    row=catalogs.get(c["supplier_category_id"],{}).get(c["product_id"])
    if not row:
        results.append({**c,"status":"CATALOG_ROW_NOT_FOUND"});continue
    title=str(row.get("title") or "").strip()
    if not title or BLOCKED.search(title):
        results.append({**c,"title":title,"status":"BLOCKED_TITLE"});continue
    variants,scope=pool(row)
    image_map={str(x.get("id")):x.get("src") for x in row.get("imagelist") or []}
    picked=None; attempts=[]
    for x in variants[:8]:
        v=x["row"]; vid=x["id"]
        try:
            st,b=signed_get("get_product_shiping_fees.html",{"productid":c["product_id"],"variantId":vid,"countrycode":COUNTRY})
            ship=cheapest_ship(b.get("data") if isinstance(b,dict) else {})
            attempts.append({"variant_id":vid,"http":st,"code":b.get("code"),"ship":ship})
            if st==200 and str(b.get("code"))=="0" and ship:
                shadow=retail_shadow(x["cost"]); ratio=round(ship["cost_usd"]/shadow["retail_usd"],3)
                iid=str(v.get("imagesid") or "")
                exact=image_map.get(iid) or row.get("imagefirst")
                picked={**c,
                  "title":title,"status":"SHIPPING_VERIFIED_PRICE_SHADOW","variant_scope":scope,
                  "variant":{"id":vid,"title":v.get("title"),"sku":v.get("sku"),"supplier_cost_usd":round(x["cost"],2),"inventory_quantity":x["stock"],"weight_g":x["weight"],"imagesid":iid},
                  "exact_variant_image_url":exact,
                  "image_scope":"EXACT_VARIANT" if image_map.get(iid) else "PRODUCT_FALLBACK",
                  "shipping_il":ship,"shipping_to_retail_ratio":ratio,
                  "commercial_training_flag":"HIGH_SHIPPING_BURDEN" if ratio>=.8 else "NORMAL_SHIPPING_BURDEN",
                  "price_gate_shadow":shadow,
                  "customer_shipping_grossup_shadow_usd":round(ship["cost_usd"]/.91,2),
                  "final_profit_verified":False,"checkout":"DISABLED","fulfillment":"DISABLED"}
                break
        except Exception as e:attempts.append({"variant_id":vid,"error":type(e).__name__})
    results.append(picked or {**c,"title":title,"status":"NO_IL_SHIPPING_QUOTE","variant_scope":scope,"attempts":attempts})
    time.sleep(.1)

verified=[x for x in results if x.get("status")=="SHIPPING_VERIFIED_PRICE_SHADOW"]
out={"version":"HUNT-EPROLO-WAVE2-IL-SCAN-V1","date":"2026-09-22","mode":"READ_ONLY_SHADOW","destination":"IL","production_effect":False,
 "summary":{"checked":len(results),"shipping_verified":len(verified),"normal_shipping":sum(1 for x in verified if x.get("commercial_training_flag")=="NORMAL_SHIPPING_BURDEN"),"high_shipping_review":sum(1 for x in verified if x.get("commercial_training_flag")=="HIGH_SHIPPING_BURDEN"),"exact_variant_images":sum(1 for x in verified if x.get("image_scope")=="EXACT_VARIANT"),"final_profit_verified":0,"checkout_live":0},
 "results":results}
(ROOT/"evidence/HUNT-EPROLO-WAVE2-IL-SCAN-2026-09-22.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"summary":out["summary"],"results":[{"dept":x.get("department"),"id":x.get("product_id"),"title":x.get("title"),"variant":(x.get("variant") or {}).get("title"),"cost":(x.get("variant") or {}).get("supplier_cost_usd"),"ship":(x.get("shipping_il") or {}).get("cost_usd"),"retail":(x.get("price_gate_shadow") or {}).get("retail_usd"),"ratio":x.get("shipping_to_retail_ratio"),"flag":x.get("commercial_training_flag"),"image":x.get("image_scope"),"status":x.get("status")} for x in results]},ensure_ascii=False,indent=2))
