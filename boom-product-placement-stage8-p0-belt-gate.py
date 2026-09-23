#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, math, re, urllib.request, urllib.parse, struct
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)

IN=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-DEEP-DISCOVERY-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-BELT-GATE-2026-09-23.json"
MARKETS=["IL","DE","US","SG"]

def is_primary_belt(t):
    return bool(re.search(r"\b(belt|waist belt)\b",t,re.I)
      and not re.search(r"\b(dress|jacket|jumpsuit|pantsuit|coat|vest|clothing set|outfit|camisole|shorts set|shirt dress|trench)\b",t,re.I)
      and not re.search(r"\b(dog|pet|leash|massage|slimming|therapy|fitness|sports|posture|tool|tactical|luggage|seat belt|shoe|bag)\b",t,re.I))

def cheapest(data):
    opts=[]
    for v in (data or {}).get("variantlist") or []:
        for lg in v.get("logistics_cost_list") or []:
            for x in lg.get("cost_list") or []:
                try:c=float(x.get("cost"))
                except:continue
                if c>=0:opts.append((c,str(x.get("ship_method") or ""),str(x.get("shiptime") or "")))
    return min(opts) if opts else None

def price_gate(cost):
    reserve=.91; raw=max((cost+4)/reserve,cost/(reserve-.35))
    retail=max(.99,math.ceil(raw+.01)-.01)
    return retail,retail*reserve-cost,(retail*reserve-cost)/retail

def dims(raw):
    if raw.startswith(b"\x89PNG\r\n\x1a\n") and len(raw)>=24:
        w,h=struct.unpack(">II",raw[16:24]);return w,h,"PNG"
    if raw[:2]==b"\xff\xd8":
        i=2
        while i+9<len(raw):
            if raw[i]!=0xFF:i+=1;continue
            m=raw[i+1];i+=2
            if m in (0xD8,0xD9):continue
            if i+2>len(raw):break
            seg=struct.unpack(">H",raw[i:i+2])[0]
            if seg<2 or i+seg>len(raw):break
            if m in list(range(0xC0,0xC4))+list(range(0xC5,0xC8))+list(range(0xC9,0xCC))+list(range(0xCD,0xD0)):
                h=struct.unpack(">H",raw[i+3:i+5])[0];w=struct.unpack(">H",raw[i+5:i+7])[0];return w,h,"JPEG"
            i+=seg
    if raw[:4]==b"RIFF" and raw[8:12]==b"WEBP":
        if raw[12:16]==b"VP8X" and len(raw)>=30:
            return 1+int.from_bytes(raw[24:27],"little"),1+int.from_bytes(raw[27:30],"little"),"WEBP"
    return None,None,"UNKNOWN"

def image_check(url):
    try:
        p=urllib.parse.urlsplit(url)
        safe=urllib.parse.urlunsplit((p.scheme,p.netloc,urllib.parse.quote(p.path,safe="/%"),urllib.parse.quote_plus(p.query,safe="=&%"),p.fragment))
        req=urllib.request.Request(safe,headers={"User-Agent":"Mozilla/5.0","Accept":"image/*"})
        with urllib.request.urlopen(req,timeout=12) as r:raw=r.read(4_000_000)
        w,h,fmt=dims(raw)
        if not w or not h:return {"state":"REVIEW","reason":"DIMENSION_PARSE_UNKNOWN"}
        if min(w,h)<500:return {"state":"REVIEW","reason":"LOW_RESOLUTION","width":w,"height":h,"format":fmt}
        return {"state":"PASS","reason":"IMAGE_PASS","width":w,"height":h,"format":fmt}
    except Exception as e:return {"state":"REVIEW","reason":"IMAGE_FETCH_ERROR","error":type(e).__name__}

src=json.load(open(IN))
items=[x for x in src["rails"].get("accessories/belts",[]) if is_primary_belt(x["title"])]

def verify(x):
    pid=str(x["item_id"]);v=x["exact_variant"];vid=str(v["id"]);cost=float(v["supplier_cost_usd"])
    markets={}; passn=0; contrib=[]; margin=[]
    for cc in MARKETS:
        try:
            st,b=api.signed_get("get_product_shiping_fees.html",{"productid":pid,"variantId":vid,"countrycode":cc})
            sh=cheapest(b.get("data") if isinstance(b,dict) else {})
            if st==200 and str(b.get("code"))=="0" and sh:
                retail,pc,mg=price_gate(cost)
                ship=sh[0]; total=retail+ship/.91; order_pc=total*.91-cost-ship
                markets[cc]={"state":"VERIFIED","shipping_cost_usd":round(ship,2),"method":sh[1],"eta":sh[2],
                             "retail_shadow_usd":round(retail,2),"projected_order_contribution_usd":round(order_pc,2),"product_margin_shadow":round(mg,4)}
                passn+=1;contrib.append(order_pc);margin.append(mg)
            else:markets[cc]={"state":"NO_VERIFIED_SHIPPING"}
        except Exception as e:markets[cc]={"state":"ERROR","error":type(e).__name__}
    img=image_check(x["image_url"])
    reasons=[]
    if passn<4:reasons.append("SHIPPING_NOT_4_OF_4")
    if img["state"]!="PASS":reasons.append("IMAGE_NOT_PASS")
    if not contrib or min(contrib)<3.99:reasons.append("PRODUCT_CONTRIBUTION_FAIL")
    if not margin or min(margin)<.35:reasons.append("MARGIN_FAIL")
    return {**x,"markets":markets,"verified_markets":passn,"image_qa":img,
            "min_projected_product_contribution_usd":round(min(contrib),2) if contrib else 0,
            "min_projected_product_margin":round(min(margin),4) if margin else 0,
            "state":"SHADOW_ADMISSION_CANDIDATE" if not reasons else "HOLD_REVIEW",
            "reasons":reasons,"final_net_profit_verified":False,"production_effect":False}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:results=list(ex.map(verify,items))
clean=[x for x in results if x["state"]=="SHADOW_ADMISSION_CANDIDATE"]
out={"version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-BELT-GATE-V1","date":"2026-09-23","mode":"SHADOW_GATE_ONLY","production_effect":False,
     "summary":{"primary_belt_candidates":len(items),"shadow_admission_candidates":len(clean),"hold_review":len(results)-len(clean),"final_net_profit_verified_products":0},
     "rules":["Belt must be the primary product, not an accessory mentioned in a clothing title.","Shipping must verify 4/4 IL/DE/US/SG.","Image >=500px both dimensions.","Projected contribution floor $3.99 and margin floor 35%.","Not Final Net Profit.","No Production mutation or supplier order."],
     "results":results}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out["summary"]))
for x in results:print(x["state"],x["item_id"],x["verified_markets"],x["image_qa"],"min$",x["min_projected_product_contribution_usd"],"|",x["title"][:120])
