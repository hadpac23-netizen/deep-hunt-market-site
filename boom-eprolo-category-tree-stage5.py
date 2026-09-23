#!/usr/bin/env python3
import json,urllib.request
from pathlib import Path

OUT=Path(__file__).resolve().parent/"evidence/HUNT-EPROLO-OFFICIAL-CATEGORY-TREE-SAFE-2026-09-23.json"
URL="https://eprolo.com/app/getCategory.html"

EXACT={
 "beauty/hair":[86],"beauty/makeup":[87],"beauty/skincare":[88],"beauty/fragrance":[89],"beauty/beauty-tools":[93],
 "sports/fitness":[69],"sports/cycling":[67],"camping/outdoors":[72],"travel/luggage":[154],
 "home/home-storage":[144],"home/cleaning":[117],"home/home-decor":[140],"home/home-textiles":[148],
 "tech/cameras":[39],"tech/audio":[40,44],"tech/wearables":[43],"tech/phone-cases":[36],"tech/power-banks":[38],
 "women/women-shoes":[64],"men/men-shoes":[63],
 "accessories/jewelry-rings":[33],"accessories/jewelry-necklaces":[47],"accessories/jewelry-earrings":[48],
 "accessories/watches":[49],"accessories/jewelry-bracelets":[50],
 "kids/baby-clothing":[165],"kids/baby":[95,97],
 "kitchen/kitchen-appliances":[115],"gifts/party":[145],"toys/toys":[100],
 "men/men-bags":[56],"accessories/bags":[55,58,62]
}
AMBIGUOUS=[31,41,45,46,68,70,73,109,110,112,126,127,128,130,134,163]
BLOCKED_IDS={42,74,84,1236,142}

req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0","Accept":"application/json"})
with urllib.request.urlopen(req,timeout=15) as r:
    src=json.loads(r.read().decode("utf-8","replace"))

tree=[]
for parent in src.get("data") or []:
    subs=[]
    for x in parent.get("waretypetwolist") or []:
        cid=int(x.get("id"))
        if cid in BLOCKED_IDS: continue
        subs.append({"id":cid,"name":x.get("name")})
    tree.append({"id":int(parent.get("id")),"name":parent.get("name"),"subcategories":subs})

out={
 "version":"HUNT-EPROLO-OFFICIAL-CATEGORY-TREE-SAFE-V1.1-CORRECTED",
 "date":"2026-09-23","source":URL,"source_code":src.get("code"),"source_message":src.get("msg"),
 "production_effect":False,"exact_mapping":EXACT,"ambiguous_supplier_category_ids":AMBIGUOUS,
 "rules":[
   "Category IDs and names come directly from EPROLO public category endpoint.",
   "Restricted/out-of-scope categories are omitted from HUNT placement automation.",
   "Only exact/low-ambiguity mappings may support KEEP.",
   "Broad/overlapping supplier categories remain UNKNOWN/REVIEW and cannot self-prove a HUNT rail.",
   "Supplier taxonomy never auto-MOVEs a product."
 ],
 "tree":tree
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"parents":len(tree),"safe_subcategories":sum(len(x["subcategories"]) for x in tree),"exact_rails":len(EXACT),"ambiguous_ids":len(AMBIGUOUS)},indent=2))
