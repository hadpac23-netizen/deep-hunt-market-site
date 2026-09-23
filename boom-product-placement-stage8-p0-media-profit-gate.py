#!/usr/bin/env python3
import concurrent.futures,json,os,re,statistics,subprocess,tempfile,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SHIP=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SHIPPING-VERIFY-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-MEDIA-PROFIT-GATE-2026-09-23.json"
ship=json.load(open(SHIP))
rows=[x for x in ship.get("results",[]) if x.get("status")=="VERIFIED_4_OF_4"]

def media(x):
    url=x.get("image_url")
    out={"state":"FAIL","http":None,"width":None,"height":None,"content_type":None,"bytes":0}
    if not url:return out
    path=None
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Accept":"image/*"})
        with urllib.request.urlopen(req,timeout=12) as r:
            out["http"]=getattr(r,"status",200)
            out["content_type"]=r.headers.get("Content-Type")
            data=r.read(10_000_001)
        out["bytes"]=len(data)
        if not str(out["content_type"] or "").lower().startswith("image/"):
            out["error"]="NOT_IMAGE_CONTENT_TYPE";return out
        if len(data)>10_000_000:
            out["error"]="IMAGE_TOO_LARGE_FOR_TECH_QA";return out
        fd,path=tempfile.mkstemp(prefix="hunt-stage8-",suffix=".img")
        os.write(fd,data);os.close(fd)
        p=subprocess.run(["/usr/bin/sips","-g","pixelWidth","-g","pixelHeight",path],capture_output=True,text=True,timeout=8)
        m1=re.search(r"pixelWidth:\s*(\d+)",p.stdout)
        m2=re.search(r"pixelHeight:\s*(\d+)",p.stdout)
        if not (m1 and m2):
            out["error"]="DIMENSION_PARSE_FAIL";return out
        out["width"],out["height"]=int(m1.group(1)),int(m2.group(1))
        min_side=min(out["width"],out["height"])
        out["state"]="PASS" if min_side>=600 else ("REVIEW" if min_side>=400 else "FAIL")
    except Exception as e:
        out["error"]=type(e).__name__
    finally:
        if path:
            try:os.unlink(path)
            except:pass
    return out

media_map={}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    futs={ex.submit(media,x):x for x in rows}
    for i,f in enumerate(concurrent.futures.as_completed(futs),1):
        x=futs[f];media_map[x["provider"]+":"+x["item_id"]]=f.result()
        if i%20==0:print("MEDIA",i,"/",len(rows),flush=True)

results=[]
for x in rows:
    key=x["provider"]+":"+x["item_id"];mq=media_map[key]
    contributions=[];margins=[]
    for m in x.get("markets",{}).values():
        if m and m.get("state")=="STOCK_SHIPPING_VERIFIED":
            contributions.append(float(m.get("projected_order_contribution_after_9pct_reserve_usd") or 0))
            margins.append(float(m.get("product_margin_shadow") or 0))
    min_contrib=min(contributions) if contributions else 0
    min_margin=min(margins) if margins else 0
    profit_pass=min_contrib>=3.99 and min_margin>=0.35
    gate="PASS" if mq["state"]=="PASS" and profit_pass else ("REVIEW" if mq["state"]=="REVIEW" and profit_pass else "FAIL")
    results.append({
      "provider":x["provider"],"item_id":x["item_id"],"rail":x["rail"],"title":x["title"],
      "image_url":x["image_url"],"exact_variant":x["exact_variant"],
      "media_technical":mq,"shipping_status":x["status"],
      "projected_contribution_min_usd":round(min_contrib,2),
      "projected_margin_min":round(min_margin,4),
      "profit_gate_v21_pass":profit_pass,"stage8_gate":gate,
      "final_net_profit_verified":False,"production_effect":False
    })

byrail={}
for r in results:
    s=byrail.setdefault(r["rail"],{"checked":0,"pass":0,"review":0,"fail":0})
    s["checked"]+=1;s[r["stage8_gate"].lower()]+=1
passed=[r for r in results if r["stage8_gate"]=="PASS"]
summary={
 "shipping_4_of_4_input":len(rows),
 "media_pass":sum(r["media_technical"]["state"]=="PASS" for r in results),
 "media_review":sum(r["media_technical"]["state"]=="REVIEW" for r in results),
 "media_fail":sum(r["media_technical"]["state"]=="FAIL" for r in results),
 "profit_gate_v21_pass":sum(r["profit_gate_v21_pass"] for r in results),
 "stage8_gate_pass":len(passed),
 "stage8_gate_review":sum(r["stage8_gate"]=="REVIEW" for r in results),
 "stage8_gate_fail":sum(r["stage8_gate"]=="FAIL" for r in results),
 "projected_contribution_min_usd":round(min([r["projected_contribution_min_usd"] for r in passed],default=0),2),
 "projected_contribution_median_usd":round(statistics.median([r["projected_contribution_min_usd"] for r in passed]),2) if passed else 0,
 "projected_margin_min":round(min([r["projected_margin_min"] for r in passed],default=0),4),
 "final_net_profit_verified_products":0,"production_effect":False
}
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-MEDIA-PROFIT-GATE-V1",
 "date":"2026-09-23","mode":"SHADOW_GATE_ONLY","production_effect":False,
 "summary":summary,"by_rail":byrail,"results":results,
 "rules":[
   "Only EPROLO candidates already VERIFIED_4_OF_4 for destination shipping are evaluated.",
   "Media Technical PASS requires a retrievable image with minimum side >=600px; this is not semantic visual-quality approval.",
   "Price Gate V2.1 pass is projected Product Contribution, not Final Net Profit.",
   "Final Net Profit remains unverified because PSP/tax/import/FX/CAC/returns and realized order economics are incomplete.",
   "No Production mutation, checkout activation or supplier order."
 ]
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
for rail,s in sorted(byrail.items()):print("RAIL",rail,s,flush=True)
