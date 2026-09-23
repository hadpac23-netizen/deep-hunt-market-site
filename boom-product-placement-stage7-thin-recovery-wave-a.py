#!/usr/bin/env python3
import json,re,urllib.request,gzip
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
BASE=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json"
EMPTY_REC=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json"
D5=ROOT/"evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json"
D6=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-2026-09-23.json"

TARGETS={
 "kitchen/tableware","kitchen/kitchen-tools","electrical/home-appliances","garden/watering",
 "home/home-decor","women/women-hoodies","accessories/socks","men/men-suits",
 "home/cleaning","garden/garden-decor","home/lighting","kitchen/food-storage"
}
rx_id=re.compile(r'let\s+wareTypeId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_name=re.compile(r'let\s+wareTypeName\s*=\s*["\']([^"\']*)["\']\s*;',re.I)
rx_two=re.compile(r'let\s+wareTypeTwoId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_twoname=re.compile(r'let\s+wareTypeTwoname\s*=\s*["\']([^"\']*)["\']\s*;',re.I)

def norm(s):return re.sub(r'\s+',' ',str(s or '')).strip().lower()
def has(t,p):return re.search(p,t,re.I) is not None

def classify(rail,title,cid,cname):
    t=norm(title)
    if rail=="kitchen/tableware":
        if has(t,r'\b(dinner plate|ceramic plate|dinnerware|tableware|cutlery|flatware|fork spoon set|spoon fork set|serving bowl|salad bowl|rice bowl|soup bowl|dish set)\b') and not has(t,r'\b(pet|dog|cat|toy)\b'):
            return ("KEEP","EXPLICIT_TABLEWARE",.98)
    elif rail=="kitchen/kitchen-tools":
        if has(t,r'\b(vegetable peeler|kitchen peeler|silicone spatula|kitchen spatula|kitchen whisk|cheese grater|kitchen tongs|can opener|garlic press|pizza cutter|kitchen scissors|measuring spoons?|measuring cups?|colander|strainer)\b') and not has(t,r'\b(toy|pet)\b'):
            return ("KEEP","EXPLICIT_KITCHEN_TOOL",.98)
    elif rail=="electrical/home-appliances":
        if has(t,r'\b(vacuum cleaner|air purifier|humidifier|dehumidifier|electric fan|portable fan|space heater|garment steamer|clothes steamer|mini washing machine|robot vacuum)\b') and not has(t,r'\b(car|toy|kitchen)\b'):
            return ("KEEP","EXPLICIT_HOME_APPLIANCE",.98)
    elif rail=="garden/watering":
        if has(t,r'\b(watering can|garden hose|hose nozzle|garden sprinkler|lawn sprinkler|watering nozzle|drip irrigation|irrigation controller|irrigation timer)\b') and not has(t,r'\b(shower|toy|kids?|pool|beach)\b'):
            return ("KEEP","EXPLICIT_GARDEN_WATERING",.98)
    elif rail=="home/home-decor":
        if cid==140 and not has(t,r'\b(garden|yard|outdoor|office|desk|gift box|party|glue|paint|repair|leak|sealant)\b'):
            return ("KEEP","SUPPLIER_HOME_DECOR_GUARDED",.97)
        if has(t,r'\b(home decor|home decoration|decorative vase|ceramic vase|decorative figurine|decorative sculpture|living room ornament)\b') and not has(t,r'\b(garden|yard|office|desk|party|glue|paint|repair|leak|sealant)\b'):
            return ("KEEP","EXPLICIT_HOME_DECOR",.97)
    elif rail=="women/women-hoodies":
        if has(t,r'\b(women|woman|female|ladies).{0,40}\b(hoodie|hooded sweatshirt)\b|\b(hoodie|hooded sweatshirt)\b.{0,40}\b(women|woman|female|ladies)\b') and not has(t,r'\b(skirt|dress|sundress|two[- ]piece|set)\b'):
            return ("KEEP","EXPLICIT_WOMEN_HOODIE",.99)
    elif rail=="accessories/socks":
        if has(t,r'\bsocks?\b') and not has(t,r'\b(women|woman|female|ladies|girl|girls|men|man|male|boy|boys|kids?|children|baby|toddler|dog|cat|pet)\b'):
            return ("KEEP","GENERIC_UNISEX_SOCKS",.96)
    elif rail=="men/men-suits":
        if has(t,r'\b(men|man|male|mens|men\'s).{0,45}\b(suit|blazer|tuxedo)\b|\b(suit|blazer|tuxedo)\b.{0,45}\b(men|man|male|mens|men\'s)\b'):
            return ("KEEP","EXPLICIT_MEN_SUIT",.99)
    elif rail=="home/cleaning":
        if has(t,r'\b(lint remover|cleaning powder|cleaning tablet|window cleaning spray|cleaning cream|cleaning brush|mop|broom|duster|squeegee)\b') and not has(t,r'\b(straw|pet|dog|cat)\b'):
            return ("KEEP","EXPLICIT_HOME_CLEANING",.97)
    elif rail=="garden/garden-decor":
        if has(t,r'\b(garden decor|garden decoration|yard decor|garden ornament|garden statue|garden figurine|garden windmill|garden wind chime|yard ornament)\b') and not has(t,r'\b(pet memorial|bird feeder|flower pot|planter)\b'):
            return ("KEEP","EXPLICIT_GARDEN_DECOR",.97)
    elif rail=="home/lighting":
        if has(t,r'\b(table lamp|bedside lamp|floor lamp|desk lamp|reading lamp|night lamp|night light)\b') and not has(t,r'\b(car|garden|camping|selfie|phone|camera|toy|humidifier|diffuser|speaker|globe)\b'):
            return ("KEEP","EXPLICIT_HOME_LIGHTING",.97)
    elif rail=="kitchen/food-storage":
        if has(t,r'\b(food storage container|food container|lunch box|bento box|food jar|grain storage|rice storage|spice jar|airtight container|pantry container)\b') and not has(t,r'\b(pet|dog|cat)\b'):
            return ("KEEP","EXPLICIT_FOOD_STORAGE",.98)
    return ("UNKNOWN","INSUFFICIENT_EVIDENCE",0)

shelves=json.load(open(SHELVES))
base=json.load(open(BASE))
empty_rec=json.load(open(EMPTY_REC))
stage7_empty_keep={str(x["provider"])+":"+str(x["item_id"]) for x in empty_rec.get("results",[]) if x.get("recovery_state")=="KEEP"}
qids={(str(x.get("provider")),str(x.get("item_id")),str(x.get("current_rail"))) for x in base.get("quarantine",[]) if str(x.get("current_rail")) in TARGETS and str(x.get("state"))!="HOLD_OUT_OF_SCOPE"}

cached={}
for fp in [D5,D6,EMPTY_REC,OUT]:
    if not fp.exists():continue
    d=json.load(open(fp))
    for x in d.get("results",[]):
        if x.get("supplier_category_id") is not None:
            cached[str(x.get("item_id"))]={
              "supplier_parent_id":x.get("supplier_parent_id"),"supplier_parent_name":x.get("supplier_parent_name"),
              "supplier_category_id":x.get("supplier_category_id"),"supplier_category_name":x.get("supplier_category_name")
            }

products=[]
for dep in shelves.get("departments",[]):
    for cat in dep.get("categories",[]):
        rail=dep["slug"]+"/"+cat["slug"]
        if rail not in TARGETS:continue
        for p in cat.get("products",[]):
            key=(str(p["provider"]),str(p["item_id"]),rail)
            if key not in qids:continue
            if str(p["provider"])+":"+str(p["item_id"]) in stage7_empty_keep:continue
            products.append({"provider":p["provider"],"item_id":str(p["item_id"]),"title":p.get("title") or "","current_rail":rail})

missing=[x for x in products if x["provider"]=="EPROLO" and x["item_id"] not in cached]
def fetch(x):
    pid=x["item_id"]
    req=urllib.request.Request(f"https://eprolo.com/app/mproductdetail.html?id={pid}",headers={"User-Agent":"Mozilla/5.0","Accept-Encoding":"gzip"})
    try:
        with urllib.request.urlopen(req,timeout=12) as r:
            data=r.read()
            if r.headers.get("Content-Encoding")=="gzip":data=gzip.decompress(data)
            t=data.decode("utf-8","ignore")
        m1,m2,m3,m4=rx_id.search(t),rx_name.search(t),rx_two.search(t),rx_twoname.search(t)
        cid=int(m3.group(1)) if m3 and str(m3.group(1)).strip().isdigit() else None
        return pid,{"supplier_parent_id":int(m1.group(1)) if m1 and str(m1.group(1)).strip().isdigit() else None,
                    "supplier_parent_name":m2.group(1) if m2 else None,"supplier_category_id":cid,
                    "supplier_category_name":m4.group(1) if m4 else None}
    except Exception as e:return pid,{"detail_error":str(e)}
if missing:
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs=[ex.submit(fetch,x) for x in missing]
        for i,f in enumerate(as_completed(futs),1):
            pid,ev=f.result();cached[pid]=ev
            if i%100==0:print("DETAIL",i,"/",len(missing),flush=True)

results=[]
for x in products:
    ev=cached.get(x["item_id"],{})
    st,reason,conf=classify(x["current_rail"],x["title"],ev.get("supplier_category_id"),ev.get("supplier_category_name"))
    results.append({**x,**ev,"recovery_state":st,"reason":reason,"confidence":conf,"production_effect":False})
byrail=defaultdict(Counter)
for x in results:byrail[x["current_rail"]][x["recovery_state"]]+=1
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-V1","date":"2026-09-23","mode":"SHADOW_EVIDENCE_RECOVERY","production_effect":False,
 "target_rails":sorted(TARGETS),
 "summary":{"products_checked":len(results),"detail_missing_fetched":len(missing),"keep_recoverable":sum(1 for x in results if x["recovery_state"]=="KEEP"),"unknown":sum(1 for x in results if x["recovery_state"]=="UNKNOWN"),"rails_with_keep":sum(1 for c in byrail.values() if c.get("KEEP",0)>0)},
 "by_rail":{k:dict(v) for k,v in byrail.items()},
 "rules":["Only Stage6 quarantine products are eligible.","Stage7 Empty KEEP products are not reconsidered.","Current rail is not evidence.","Recovery KEEP requires explicit subtype evidence.","No Production mutation or new sourcing."],
 "results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(out["summary"],ensure_ascii=False))
for rail,c in sorted(out["by_rail"].items()):print("RAIL",rail,c)
