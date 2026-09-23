#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)

LEAFS={
 "women":[1242,1243,1244,1246,1247,1248,1254,1259],
 "men":[1220,1221,1223,1229,1230,1256,1219,1226]
}
PAGES=range(1,13)
BLOCK=re.compile(r"\b(vape|cigarette|nicotine|adult\s*toy|erotic|porn|gun|firearm|weapon|knife|blade|sword|machete|cbd|thc|marijuana|steroid|diet\s*pill|laxative|weight\s*loss)\b",re.I)

ROUTES=[
 ("women","women-jeans",re.compile(r"\b(jean|jeans|denim pants|denim trousers)\b",re.I)),
 ("women","women-bottoms",re.compile(r"\b(pants|trousers|shorts|joggers|bottoms|wide leg pants)\b",re.I)),
 ("women","women-skirts",re.compile(r"\b(skirt|skirts)\b",re.I)),
 ("women","women-knitwear",re.compile(r"\b(sweater|cardigan|knitwear|knitted|pullover)\b",re.I)),
 ("women","women-underwear",re.compile(r"\b(underwear|briefs|panties|bra|bras)\b",re.I)),
 ("women","women-sleepwear",re.compile(r"\b(pajama|pajamas|pyjama|nightgown|sleepwear|nightwear|robe)\b",re.I)),
 ("women","women-socks",re.compile(r"\b(sock|socks|stocking|stockings|pantyhose)\b",re.I)),
 ("women","women-hoodies",re.compile(r"\b(hoodie|hoodies|sweatshirt|sweatshirts)\b",re.I)),
 ("women","women-outerwear",re.compile(r"\b(jacket|coat|parka|windbreaker|outerwear)\b",re.I)),
 ("women","women-evening",re.compile(r"\b(evening dress|prom dress|party dress|cocktail dress|formal dress|occasion dress)\b",re.I)),
 ("women","women-clothing",re.compile(r"\b(set|outfit|jumpsuit|romper|clothing)\b",re.I)),

 ("men","men-jeans",re.compile(r"\b(jean|jeans|denim pants|denim trousers)\b",re.I)),
 ("men","men-bottoms",re.compile(r"\b(pants|trousers|shorts|joggers|bottoms|cargo pants)\b",re.I)),
 ("men","men-knitwear",re.compile(r"\b(sweater|cardigan|knitwear|knitted|pullover)\b",re.I)),
 ("men","men-boxers",re.compile(r"\b(boxer|boxers|boxer briefs)\b",re.I)),
 ("men","men-underwear",re.compile(r"\b(underwear|brief|briefs|underpants)\b",re.I)),
 ("men","men-sleepwear",re.compile(r"\b(pajama|pajamas|pyjama|sleepwear|nightwear|robe)\b",re.I)),
 ("men","men-socks",re.compile(r"\b(sock|socks|stocking|stockings)\b",re.I)),
 ("men","men-hoodies",re.compile(r"\b(hoodie|hoodies|sweatshirt|sweatshirts)\b",re.I)),
 ("men","men-outerwear",re.compile(r"\b(jacket|coat|parka|windbreaker|outerwear)\b",re.I)),
 ("men","men-suits",re.compile(r"\b(suit|tuxedo|blazer)\b",re.I)),
 ("men","men-tops",re.compile(r"\b(t[- ]?shirt|shirt|polo|tank top|top)\b",re.I)),
 ("men","men-clothing",re.compile(r"\b(set|outfit|clothing)\b",re.I)),
]
GENDER={
 "women":re.compile(r"\b(women|women's|woman|female|ladies|lady)\b",re.I),
 "men":re.compile(r"\b(men|men's|man|male|gentlemen)\b",re.I)
}

def num(v,d=0):
    try:return float(v)
    except:return d

def best_variant(row):
    arr=[]
    for v in row.get("variantlist") or []:
        vid=str(v.get("id") or v.get("variantsid") or v.get("variantId") or "")
        cost=num(v.get("cost"),-1);stock=max(0,int(num(v.get("inventory_quantity"),0)))
        if vid and cost>0 and stock>0:arr.append((cost,-stock,vid,v))
    arr.sort(key=lambda x:(x[0],x[1]))
    if not arr:return None
    cost,negstock,vid,v=arr[0]
    return {"id":vid,"title":v.get("title"),"sku":v.get("sku"),"supplier_cost_usd":round(cost,2),"inventory_quantity":-negstock,"weight_g":v.get("weight")}

def fetch(job):
    gender,cid,page=job
    try:
      _,b=api.signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeTwoId":cid})
      return gender,cid,page,b.get("data") or [],None
    except Exception as e:return gender,cid,page,[],type(e).__name__

def main():
    jobs=[(g,c,p) for g,ids in LEAFS.items() for c in ids for p in PAGES]
    pools={};errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
      for gender,cid,page,rows,err in ex.map(fetch,jobs):
        if err:errors.append({"gender":gender,"cid":cid,"page":page,"error":err});continue
        for row in rows:
          title=str(row.get("title") or "").strip()
          if not title or BLOCK.search(title):continue
          if not GENDER[gender].search(title):continue
          image=row.get("imagefirst") or next((x.get("src") for x in row.get("imagelist") or [] if x.get("src")),None)
          variant=best_variant(row)
          if not image or not variant:continue
          pid=str(row.get("product_id") or row.get("id") or "")
          if not pid:continue
          for rg,cat,rx in ROUTES:
            if rg!=gender or not rx.search(title):continue
            k=gender+"/"+cat
            rec={
              "provider":"EPROLO","item_id":pid,"department":gender,"category":cat,
              "title":title,"image_url":image,"availability_verified":True,
              "availability_basis":"FRESH_EPROLO_OFFICIAL_API_DEEP_PULL",
              "inventory_snapshot":sum(max(0,int(num(v.get("inventory_quantity"),0))) for v in row.get("variantlist") or []),
              "supplier_cost_min":variant["supplier_cost_usd"],"currency":"USD",
              "variant_count":len(row.get("variantlist") or []),"image_count":len(row.get("imagelist") or []),
              "exact_variant":variant,"supplier_category_id":cid,"source_page":page,
              "checkout_status":"DISABLED_DESTINATION_SHIPPING_RECHECK_REQUIRED","production_exposure":False
            }
            pools.setdefault(k,{})["EPROLO:"+pid]=rec
    rails={}
    for k,d in pools.items():
      rows=list(d.values());rows.sort(key=lambda x:(x["supplier_cost_min"],-x["inventory_snapshot"],x["title"]))
      rails[k]=rows[:80]
    out={"version":"HUNT-EPROLO-MEN-WOMEN-DEEP-PULL-V1","date":"2026-09-23","mode":"READ_ONLY_SHADOW","production_effect":False,
      "summary":{"rails_with_candidates":len(rails),"unique_candidates":len({x["item_id"] for rows in rails.values() for x in rows}),"errors":len(errors)},
      "rails":rails,"errors":errors,
      "rules":["Official EPROLO read-only API only","Pages 1-12 of known men/women leaf categories","Explicit gender term required","Exact in-stock variant required","Restricted terms blocked","No checkout/order/payment/Production mutation"]}
    (ROOT/"evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-PULL-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(out["summary"]))
    for k,v in sorted(rails.items()):print(k,len(v))
if __name__=="__main__":main()
