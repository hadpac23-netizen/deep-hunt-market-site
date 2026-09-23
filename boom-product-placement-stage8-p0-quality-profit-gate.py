#!/usr/bin/env python3
import io,json,re,urllib.request,urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed

ROOT=Path(__file__).resolve().parent
SHORT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QA-SHORTLIST-V2-2026-09-23.json"
SHIP=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SHIPPING-VERIFY-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QUALITY-PROFIT-GATE-2026-09-23.json"

short=json.load(open(SHORT))
ship=json.load(open(SHIP))
short_idx={(x["provider"],str(x["item_id"])):x for rows in short.get("rails",{}).values() for x in rows}
verified=[x for x in ship.get("results",[]) if x.get("status")=="VERIFIED_4_OF_4"]

SPAM=re.compile(r"\b(cheap|hot sale|factory direct|wholesale|dropshipping|free shipping)\b",re.I)

def image_dimensions(raw):
    if raw.startswith(b"\x89PNG\r\n\x1a\n") and len(raw)>=24:
        import struct
        return struct.unpack(">II",raw[16:24])+("PNG",)
    if raw[:2]==b"\xff\xd8":
        i=2
        import struct
        while i+9<len(raw):
            if raw[i]!=0xFF:
                i+=1; continue
            marker=raw[i+1]; i+=2
            if marker in (0xD8,0xD9): continue
            if i+2>len(raw): break
            seglen=struct.unpack(">H",raw[i:i+2])[0]
            if seglen<2 or i+seglen>len(raw): break
            if marker in list(range(0xC0,0xC4))+list(range(0xC5,0xC8))+list(range(0xC9,0xCC))+list(range(0xCD,0xD0)):
                if i+7<=len(raw):
                    h=struct.unpack(">H",raw[i+3:i+5])[0]
                    w=struct.unpack(">H",raw[i+5:i+7])[0]
                    return w,h,"JPEG"
            i+=seglen
    if raw[:4] in (b"RIFF",) and raw[8:12]==b"WEBP":
        chunk=raw[12:16]
        if chunk==b"VP8X" and len(raw)>=30:
            w=1+int.from_bytes(raw[24:27],"little")
            h=1+int.from_bytes(raw[27:30],"little")
            return w,h,"WEBP"
        if chunk==b"VP8 ":
            idx=raw.find(b"\x9d\x01\x2a",20,80)
            if idx!=-1 and idx+7<=len(raw):
                w=int.from_bytes(raw[idx+3:idx+5],"little")&0x3FFF
                h=int.from_bytes(raw[idx+5:idx+7],"little")&0x3FFF
                return w,h,"WEBP"
    return None,None,"UNKNOWN"

def image_check(x):
    url=x.get("image_url")
    base={"provider":x["provider"],"item_id":str(x["item_id"]),"rail":x["rail"],"title":x["title"],"image_url":url}
    if not url:return {**base,"image_state":"FAIL","reason":"NO_IMAGE"}
    try:
        parsed=urllib.parse.urlsplit(url)
        safe_path=urllib.parse.quote(parsed.path,safe="/%")
        safe_query=urllib.parse.quote_plus(parsed.query,safe="=&%")
        safe_url=urllib.parse.urlunsplit((parsed.scheme,parsed.netloc,safe_path,safe_query,parsed.fragment))
        req=urllib.request.Request(safe_url,headers={"User-Agent":"Mozilla/5.0","Accept":"image/*"})
        with urllib.request.urlopen(req,timeout=12) as r:
            raw=r.read(4_000_000)
            ctype=str(r.headers.get("Content-Type") or "")
            status=getattr(r,"status",200)
        if status!=200 or not raw:return {**base,"image_state":"FAIL","reason":"IMAGE_HTTP_FAIL","http":status}
        w,h,fmt=image_dimensions(raw)
        if not w or not h:return {**base,"image_state":"REVIEW","reason":"IMAGE_DIMENSION_PARSE_UNKNOWN","format":fmt,"content_type":ctype}
        if min(w,h)<500:return {**base,"image_state":"REVIEW","reason":"LOW_RESOLUTION","width":w,"height":h,"format":fmt,"content_type":ctype}
        if max(w,h)/max(1,min(w,h))>3.5:return {**base,"image_state":"REVIEW","reason":"EXTREME_ASPECT_RATIO","width":w,"height":h,"format":fmt,"content_type":ctype}
        return {**base,"image_state":"PASS","reason":"IMAGE_FETCH_DIMENSIONS_PASS","width":w,"height":h,"format":fmt,"content_type":ctype}
    except Exception as e:
        return {**base,"image_state":"REVIEW","reason":"IMAGE_FETCH_ERROR","error":type(e).__name__}

image_results=[]
with ThreadPoolExecutor(max_workers=10) as ex:
    futs=[ex.submit(image_check,x) for x in verified]
    for i,f in enumerate(as_completed(futs),1):
        image_results.append(f.result())
        if i%20==0:print("IMAGE",i,"/",len(verified),flush=True)
img_idx={(x["provider"],x["item_id"]):x for x in image_results}

results=[]
for s in verified:
    key=(s["provider"],str(s["item_id"]))
    q=short_idx.get(key)
    im=img_idx.get(key,{})
    reasons=[]
    if not q:reasons.append("NOT_IN_QA_V2_SHORTLIST")
    if im.get("image_state")!="PASS":reasons.append("IMAGE_NOT_PASS")
    v=s.get("exact_variant") or {}
    if not v.get("id") or float(v.get("supplier_cost_usd") or 0)<=0 or int(v.get("inventory_quantity") or 0)<=0:
        reasons.append("EXACT_VARIANT_STOCK_COST_FAIL")
    market_contrib=[]
    market_margin=[]
    shipping_ratios=[]
    for cc,m in (s.get("markets") or {}).items():
        if not m or m.get("state")!="STOCK_SHIPPING_VERIFIED":
            reasons.append("MARKET_NOT_VERIFIED_"+cc);continue
        market_contrib.append(float(m.get("projected_order_contribution_after_9pct_reserve_usd") or 0))
        market_margin.append(float(m.get("product_margin_shadow") or 0))
        retail=float(m.get("retail_shadow_usd") or 0)
        ship=float((m.get("shipping") or {}).get("cost_usd") or 0)
        shipping_ratios.append(ship/retail if retail else 999)
    min_contrib=min(market_contrib) if market_contrib else 0
    min_margin=min(market_margin) if market_margin else 0
    max_ship_ratio=max(shipping_ratios) if shipping_ratios else 999
    if min_contrib<3.99:reasons.append("PRODUCT_CONTRIBUTION_FLOOR_FAIL")
    if min_margin<0.35:reasons.append("MARGIN_FLOOR_FAIL")
    title_cleanup_required=bool(SPAM.search(s.get("title") or ""))
    state="SHADOW_ADMISSION_CANDIDATE" if not reasons else "HOLD_REVIEW"
    results.append({
      "provider":s["provider"],"item_id":str(s["item_id"]),"rail":s["rail"],"title":s["title"],
      "image_url":s.get("image_url"),"image_qa":im,
      "exact_variant":v,
      "verified_markets":s.get("verified_markets"),
      "min_projected_product_contribution_usd":round(min_contrib,2),
      "min_projected_product_margin":round(min_margin,4),
      "max_shipping_to_retail_ratio":round(max_ship_ratio,3),
      "state":state,"reasons":reasons,
      "title_cleanup_required":title_cleanup_required,
      "quality_state":"IMAGE_QA_PASS" if im.get("image_state")=="PASS" else "QUALITY_REVIEW",
      "shipping_state":"VERIFIED_4_OF_4",
      "profit_state":"PROJECTED_PRODUCT_CONTRIBUTION_PASS" if min_contrib>=3.99 and min_margin>=0.35 else "PROFIT_REVIEW",
      "final_net_profit_verified":False,
      "production_effect":False
    })

# Rank clean candidates within rail. High stock already enforced; prefer lower shipping ratio then higher contribution.
byrail={}
for r in results:
    byrail.setdefault(r["rail"],[]).append(r)
for rail,rows in byrail.items():
    rows.sort(key=lambda r:(0 if r["state"]=="SHADOW_ADMISSION_CANDIDATE" else 1,r["max_shipping_to_retail_ratio"],-r["min_projected_product_contribution_usd"],r["title"]))
    for i,r in enumerate(rows,1):r["rail_rank"]=i

clean=[r for r in results if r["state"]=="SHADOW_ADMISSION_CANDIDATE"]
summary={
 "shipping_verified_input":len(verified),
 "image_pass":sum(r.get("image_state")=="PASS" for r in image_results),
 "image_review_or_fail":sum(r.get("image_state")!="PASS" for r in image_results),
 "shadow_admission_candidates":len(clean),
 "hold_review":len(results)-len(clean),
 "rails_with_admission_candidates":len({r["rail"] for r in clean}),
 "final_net_profit_verified_products":0,
 "production_effect":False
}
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QUALITY-PROFIT-GATE-V1",
 "date":"2026-09-23","mode":"SHADOW_GATE_ONLY","production_effect":False,
 "summary":summary,
 "rules":[
   "Only EPROLO products verified shipping 4/4 are evaluated here.",
   "Main image must be fetchable and at least 500px on both dimensions.",
   "Exact variant cost and inventory must be positive.",
   "Projected Product Contribution floor is $3.99 and projected product margin floor is 35%.",
   "Projected contribution is not Final Net Profit.",
   "SHADOW_ADMISSION_CANDIDATE is not Production shelf admission.",
   "No Production mutation, checkout activation or supplier order."
 ],
 "by_rail":byrail,"results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
for rail,rows in sorted(byrail.items()):
    p=sum(r["state"]=="SHADOW_ADMISSION_CANDIDATE" for r in rows)
    h=len(rows)-p
    print("RAIL",rail,"pass",p,"hold",h,flush=True)
    for r in [x for x in rows if x["state"]=="SHADOW_ADMISSION_CANDIDATE"][:3]:
        print(" ",r["item_id"],"|",r["image_qa"].get("width"),"x",r["image_qa"].get("height"),"| min$",r["min_projected_product_contribution_usd"],"|",r["title"][:95])
