#!/usr/bin/env python3
import json,re,urllib.request,gzip,time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent
QUEUE=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE4-QUEUE-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json"

EXACT={
 "beauty/hair":[86],"beauty/makeup":[87],"beauty/skincare":[88],"beauty/fragrance":[89],"beauty/beauty-tools":[93],
 "sports/fitness":[69],"sports/cycling":[67],"camping/outdoors":[72],"travel/luggage":[154],
 "home/home-storage":[144],"home/cleaning":[117],"home/home-decor":[140],"home/home-textiles":[148],
 "tech/cameras":[39],"tech/audio":[40,44],"tech/wearables":[43],"tech/phone-cases":[36],"tech/power-banks":[38],
 "women/women-shoes":[64],"men/men-shoes":[63],
 "accessories/jewelry-rings":[33],"accessories/jewelry-necklaces":[47],"accessories/jewelry-earrings":[48],"accessories/watches":[49],"accessories/jewelry-bracelets":[50],
 "kids/baby-clothing":[165],"kids/baby":[95,97],"kitchen/kitchen-appliances":[115],"gifts/party":[145],"toys/toys":[100],
 "men/men-bags":[56],"accessories/bags":[55,58,62]
}
AMBIGUOUS={31,41,45,46,68,70,73,109,110,112,126,127,128,130,134,163}
BLOCKED={42,74,84,1236,142}
REV={}
for rail,cids in EXACT.items():
    for cid in cids: REV.setdefault(cid,set()).add(rail)

q=json.load(open(QUEUE))
previous={"results":[]}
if OUT.exists():
    try: previous=json.load(open(OUT))
    except Exception: previous={"results":[]}
done_ids={str(x.get("item_id")) for x in previous.get("results",[]) if x.get("state") in {
  "UNMAPPED_SUPPLIER_CATEGORY","AMBIGUOUS_SUPPLIER_CATEGORY","BLOCKED_OR_OUT_OF_SCOPE_HOLD",
  "DETAIL_PARSE_UNKNOWN","SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL"
}}
targets=[x for x in q["queue"] if x["provider"]=="EPROLO" and x["current_rail"] in EXACT and str(x["item_id"]) not in done_ids]
# Highest-impact rails first; staged cap keeps each run bounded.
targets=targets[:400]

rx_id=re.compile(r'let\s+wareTypeId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_name=re.compile(r'let\s+wareTypeName\s*=\s*["\']([^"\']*)["\']\s*;',re.I)
rx_two=re.compile(r'let\s+wareTypeTwoId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_twoname=re.compile(r'let\s+wareTypeTwoname\s*=\s*["\']([^"\']*)["\']\s*;',re.I)

def fetch(x):
    pid=str(x["item_id"])
    url=f"https://eprolo.com/app/mproductdetail.html?id={pid}"
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Accept-Encoding":"gzip","Accept":"text/html"})
    try:
        with urllib.request.urlopen(req,timeout=12) as r:
            data=r.read()
            if r.headers.get("Content-Encoding")=="gzip": data=gzip.decompress(data)
            t=data.decode("utf-8","ignore")
        m1=rx_id.search(t);m2=rx_name.search(t);m3=rx_two.search(t);m4=rx_twoname.search(t)
        if not m3:
            return {"item_id":pid,"current_rail":x["current_rail"],"state":"DETAIL_PARSE_UNKNOWN"}
        parent=int(m1.group(1)) if m1 and str(m1.group(1)).strip().isdigit() else None
        cid=int(m3.group(1)) if str(m3.group(1)).strip().isdigit() else None
        if cid in BLOCKED:
            return {"item_id":pid,"current_rail":x["current_rail"],"supplier_parent_id":parent,"supplier_category_id":cid,
                    "state":"BLOCKED_OR_OUT_OF_SCOPE_HOLD","production_effect":False}
        allowed=set(EXACT[x["current_rail"]])
        if cid in allowed:
            state="SUPPLIER_TAXONOMY_VERIFIED_CURRENT_RAIL"
            effect="KEEP_SUPPORT_ONLY"
            target=x["current_rail"]
        elif cid in AMBIGUOUS:
            state="AMBIGUOUS_SUPPLIER_CATEGORY"
            effect="UNKNOWN_HOLD"
            target=None
        elif cid in REV:
            state="SUPPLIER_TAXONOMY_CONFLICT_CURRENT_RAIL"
            effect="REVIEW_ONLY"
            target=sorted(REV[cid])
        else:
            state="UNMAPPED_SUPPLIER_CATEGORY"
            effect="UNKNOWN_HOLD"
            target=None
        return {
          "item_id":pid,"current_rail":x["current_rail"],
          "supplier_parent_id":parent,"supplier_parent_name":m2.group(1) if m2 else None,
          "supplier_category_id":cid,"supplier_category_name":m4.group(1) if m4 else None,
          "state":state,"placement_effect":effect,"suggested_rail":target,
          "production_effect":False
        }
    except Exception as e:
        return {"item_id":pid,"current_rail":x["current_rail"],"state":"DETAIL_FETCH_ERROR","error":str(e),"production_effect":False}

results_new=[]
with ThreadPoolExecutor(max_workers=10) as ex:
    futs={ex.submit(fetch,x):x for x in targets}
    for i,f in enumerate(as_completed(futs),1):
        results_new.append(f.result())
        if i%50==0: print("DONE",i,"/",len(targets),flush=True)

previous_results=previous.get("results",[])
# Keep prior terminal/unresolved evidence plus latest new batch; verified IDs disappear from Stage4 queue after merge,
# but are retained here for provenance.
merged={str(x.get("item_id")):x for x in previous_results}
for x in results_new: merged[str(x.get("item_id"))]=x
results=list(merged.values())
states=Counter(x["state"] for x in results)
batch_states=Counter(x["state"] for x in results_new)
byrail=defaultdict(lambda:Counter())
for x in results:byrail[x["current_rail"]][x["state"]]+=1

out={
 "version":"HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-V1","date":"2026-09-23","mode":"READ_ONLY_SHADOW",
 "production_effect":False,"source":"Public server-rendered EPROLO product detail pages",
 "rules":[
   "Current HUNT category is not evidence.",
   "KEEP support requires server-rendered exact EPROLO subcategory to match a pre-approved exact mapping.",
   "Cross-rail exact taxonomy conflict creates REVIEW only, never auto-MOVE.",
   "Broad/ambiguous category remains UNKNOWN.",
   "Out-of-scope category is held without product exposure.",
   "No publish, checkout, order or Production mutation."
 ],
 "summary":{"batch_targets":len(targets),"batch_states":dict(batch_states),"cumulative_results":len(results),"states":dict(states)},
 "by_rail":{k:dict(v) for k,v in byrail.items()},
 "results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(out["summary"],ensure_ascii=False))
for rail,c in sorted(out["by_rail"].items(),key=lambda kv:-sum(kv[1].values()))[:20]:
    print("RAIL",rail,c)
