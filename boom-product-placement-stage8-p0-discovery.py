#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)

OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-DISCOVERY-2026-09-23.json"
CJ=ROOT/"evidence/HUNT-CJ-FOCUSED-THIN-SHELF-SCAN-2026-09-23.json"

BLOCK=re.compile(r"\b(vape|vaping|cigarette|nicotine|adult\s*toy|erotic|porn|gun|firearm|ammo|ammunition|weapon|knife|blade|sword|machete|taser|pepper spray|firework|explosives?|cbd|thc|marijuana|steroid|hormone|diet\s*pill|laxative|fat\s*burner|weight\s*loss|camp stove|gas stove|fuel canister|lighter|torch burner)\b",re.I)

# Strict product-type classifiers. Context exclusions matter more than density.
ROUTES=[
 ("accessories/belts", re.compile(r"\b(leather belt|canvas belt|dress belt|waist belt|fashion belt|men'?s belt|women'?s belt|buckle belt)\b",re.I),
  re.compile(r"\b(bag|shoe|sandal|boot|costume|cosplay|luggage|sports|posture|holster|tool|tactical|seat belt)\b",re.I)),
 ("accessories/gloves", re.compile(r"\b(fashion gloves?|winter gloves?|leather gloves?|knitted gloves?|thermal gloves?|mittens?)\b",re.I),
  re.compile(r"\b(oven|kitchen|pet|grooming|boxing|cycling|workout|medical|costume|cosplay|paw|work gloves?|safety gloves?)\b",re.I)),
 ("accessories/scarves", re.compile(r"\b(fashion scarf|winter scarf|silk scarf|neck scarf|women'?s scarf|men'?s scarf|shawl)\b",re.I),
  re.compile(r"\b(pet|dog|cat|bag|handbag|costume|cosplay|ski mask|face cover)\b",re.I)),
 ("home/furniture", re.compile(r"\b(sofa|couch|coffee table|side table|bedside table|nightstand|bookshelf|bookcase|storage cabinet|shoe cabinet|bed frame|dining chair|accent chair|stool|console table)\b",re.I),
  re.compile(r"\b(cover|protector|mat|pad|leg|feet|handle|hook|toy|tablecloth|display card|net|opener|miniature|dollhouse)\b",re.I)),
 ("men/men-bags", re.compile(r"\b(men'?s (bag|backpack|briefcase|messenger bag|crossbody bag|shoulder bag|chest bag|waist bag)|male (bag|backpack|briefcase)|business briefcase)\b",re.I),
  re.compile(r"\b(women|woman|female|girls?|jewelry|pendant|keychain|ornament|plush)\b",re.I)),
 ("men/men-clothing", re.compile(r"\b(men'?s|mens|male).{0,35}\b(clothing set|outfit set|two[- ]piece set|jumpsuit|overall|romper)\b|\b(clothing set|outfit set|two[- ]piece set|jumpsuit|overall)\b.{0,35}\b(men'?s|mens|male)\b",re.I),
  re.compile(r"\b(women|woman|female|girls?)\b",re.I)),
 ("office/office-furniture", re.compile(r"\b(office chair|office desk|computer desk|desk chair|office table|office cabinet|filing cabinet|file cabinet|standing desk)\b",re.I),
  re.compile(r"\b(mat|pad|holder|stand|decor|ornament|cushion|miniature|dollhouse)\b",re.I)),
 ("pets/pet-beds", re.compile(r"\b(pet bed|dog bed|cat bed|pet mattress|dog mattress|cat mattress|pet cushion|dog cushion|cat cushion|pet sleeping mat|dog sleeping mat|cat sleeping mat)\b",re.I),
  re.compile(r"\b(costume|clothes|clothing|blanket only|cover only)\b",re.I)),
 ("tech/smart-home", re.compile(r"\b(smart (plug|socket|switch|sensor|doorbell|lock|thermostat|curtain motor|light switch)|wifi (plug|socket|switch|doorbell|sensor)|zigbee (sensor|switch|hub|gateway)|tuya (sensor|switch|hub|gateway)|smart home hub|smart home gateway)\b",re.I),
  re.compile(r"\b(bracelet|watch|camera remote|tv remote|phone remote)\b",re.I)),
 ("women/women-clothing", re.compile(r"\b(women'?s|womens|female|ladies).{0,35}\b(clothing set|outfit set|two[- ]piece set|jumpsuit|romper|overall)\b|\b(clothing set|outfit set|two[- ]piece set|jumpsuit|romper|overall)\b.{0,35}\b(women'?s|womens|female|ladies)\b",re.I),
  re.compile(r"\b(men'?s|mens|male|girls?|kids?|baby)\b",re.I)),
]

# Official EPROLO category sources to scan. Categories are hints only; title must also pass.
EPROLO_JOBS=[]
for parent,label in [(20,"bags"),(24,"fashion"),(15,"home"),(13,"tech"),(21,"kids")]:
    for page in range(1,31):
        EPROLO_JOBS.append(("top",parent,label,page))
for leaf,label in [(56,"men_bags"),(41,"smart"),(110,"home"),(119,"home"),(126,"office"),(128,"pets"),(163,"office"),(1244,"fashion"),(1259,"fashion")]:
    for page in range(1,9):
        EPROLO_JOBS.append(("leaf",leaf,label,page))

def n(v,d=0):
    try:return float(v)
    except:return d

def best_variant(row):
    arr=[]
    for v in row.get("variantlist") or []:
        vid=str(v.get("id") or "")
        cost=n(v.get("cost"),-1); stock=max(0,int(n(v.get("inventory_quantity"),0)))
        if vid and cost>0 and stock>0:
            arr.append((cost,-stock,vid,v))
    if not arr:return None
    arr.sort(key=lambda z:(z[0],z[1]))
    cost,neg,vid,v=arr[0]
    return {"id":vid,"sku":v.get("sku"),"title":v.get("title"),"supplier_cost_usd":round(cost,2),"inventory_quantity":-neg,"weight_g":v.get("weight")}

def classify(title):
    if not title or BLOCK.search(title):return []
    out=[]
    for rail,pos,neg in ROUTES:
        if pos.search(title) and not neg.search(title):
            out.append(rail)
    return out

def fetch(job):
    typ,cid,label,page=job
    params={"page":page,"page_size":200,("wareTypeId" if typ=="top" else "wareTypeTwoId"):cid}
    try:
        _,b=api.signed_get("eprolo_product_list.html",params)
        return job,b.get("data") or [],None
    except Exception as e:
        return job,[],type(e).__name__

def eprolo_candidates():
    pools={rail:{} for rail,_,_ in ROUTES}; errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futs=[ex.submit(fetch,j) for j in EPROLO_JOBS]
        for fut in concurrent.futures.as_completed(futs):
            job,rows,err=fut.result()
            if err: errors.append({"job":job,"error":err});continue
            for row in rows:
                title=str(row.get("title") or "").strip()
                rails=classify(title)
                if not rails:continue
                var=best_variant(row)
                image=row.get("imagefirst")
                pid=str(row.get("id") or "")
                if not pid or not image or not var:continue
                total_stock=sum(max(0,int(n(v.get("inventory_quantity"),0))) for v in row.get("variantlist") or [])
                for rail in rails:
                    pools[rail][pid]={
                      "provider":"EPROLO","item_id":pid,"rail":rail,"title":title,"image_url":image,
                      "supplier_cost_min":var["supplier_cost_usd"],"currency":"USD",
                      "exact_variant":var,"inventory_snapshot":total_stock,"availability_verified":True,
                      "availability_basis":"FRESH_EPROLO_OFFICIAL_API_STAGE8_DISCOVERY",
                      "source_locator":{"type":job[0],"id":job[1],"label":job[2],"page":job[3]},
                      "placement_state":"CANDIDATE_STRICT_TITLE_MATCH","quality_state":"PENDING",
                      "shipping_state":"PENDING","profit_state":"PENDING","production_effect":False
                    }
    return pools,errors

def cj_candidates():
    pools={rail:{} for rail,_,_ in ROUTES}
    if not CJ.exists():return pools
    x=json.load(open(CJ))
    for row in x.get("unique_candidates") or []:
        title=str(row.get("title") or "").strip()
        rails=classify(title)
        if not rails:continue
        if not row.get("image_url") or n(row.get("price_amount"),0)<=0 or n(row.get("stock_quantity"),0)<=0:continue
        for rail in rails:
            pools[rail][str(row.get("item_id"))]={
              "provider":"CJdropshipping","item_id":str(row.get("item_id")),"rail":rail,"title":title,
              "image_url":row.get("image_url"),"supplier_catalog_price":round(n(row.get("price_amount")),2),
              "currency":row.get("currency") or "USD","inventory_snapshot":int(n(row.get("stock_quantity"),0)),
              "availability_verified":bool(row.get("availability_verified")),
              "availability_basis":"EXISTING_OFFICIAL_CJ_FOCUS_SNAPSHOT",
              "source_locator":{"focus_shelf":row.get("focus_shelf") or row.get("category")},
              "placement_state":"CANDIDATE_STRICT_TITLE_MATCH","quality_state":"PENDING",
              "shipping_state":"PENDING","profit_state":"PROVISIONAL_CATALOG_PRICE_ONLY","production_effect":False
            }
    return pools

ep,errors=eprolo_candidates(); cj=cj_candidates()
rails={}
for rail,_,_ in ROUTES:
    vals=list(ep[rail].values())+list(cj[rail].values())
    # Deduplicate by provider:id; rank exact supplier-cost EPROLO first, then stock.
    uniq={}
    for x in vals:uniq[x["provider"]+":"+x["item_id"]]=x
    rows=list(uniq.values())
    rows.sort(key=lambda x:(0 if x["provider"]=="EPROLO" else 1, x.get("supplier_cost_min",x.get("supplier_catalog_price",999999)), -x.get("inventory_snapshot",0)))
    rails[rail]=rows[:60]

out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-DISCOVERY-V1","date":"2026-09-23",
 "mode":"READ_ONLY_SUPPLIER_DISCOVERY","production_effect":False,
 "summary":{
   "target_rails":len(ROUTES),
   "rails_with_candidates":sum(1 for x in rails.values() if x),
   "total_candidates":sum(len(x) for x in rails.values()),
   "eprolo_candidates":sum(1 for xs in rails.values() for x in xs if x["provider"]=="EPROLO"),
   "cj_candidates":sum(1 for xs in rails.values() for x in xs if x["provider"]=="CJdropshipping"),
   "api_errors":len(errors)
 },
 "rules":[
   "Supplier category is only a discovery hint; strict product-type title match is mandatory.",
   "No candidate enters a shelf from this artifact.",
   "EPROLO exact in-stock variant is retained when available.",
   "CJ catalog price is provisional until product-detail/quote/shipping verification succeeds.",
   "Every candidate must pass Placement -> Quality -> Stock/Shipping -> Profit before canonical shelf admission.",
   "No Production mutation, payment, checkout activation, fulfillment or supplier order."
 ],
 "rails":rails,"errors":errors
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out["summary"],ensure_ascii=False))
for rail,rows in rails.items():
 print(rail,len(rows),"EP",sum(x["provider"]=="EPROLO" for x in rows),"CJ",sum(x["provider"]=="CJdropshipping" for x in rows))
 for x in rows[:3]:print(" ",x["provider"],x["item_id"],"|",x["title"][:110])
