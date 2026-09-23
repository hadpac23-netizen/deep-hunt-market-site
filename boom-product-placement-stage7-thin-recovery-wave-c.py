#!/usr/bin/env python3
import json,re,urllib.request,gzip
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
BASE=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json"
PRIOR=[
 ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json",
 ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-2026-09-23.json",
 ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-B-2026-09-23.json",
]
D5=ROOT/"evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json"
D6=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-C-2026-09-23.json"

TARGETS={
 "beauty/body-care","home/home-textiles","home/tools-diy","camping/camping-cook",
 "garden/outdoor-living","pets/pet-toys","office/office-storage",
 "electrical/electrical-accessories","pets/pet-feeding","sports/outdoors",
 "sports/sports-gear","kitchen/bakeware","camping/camping-lighting","tech/electronics"
}
rx_id=re.compile(r'let\s+wareTypeId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_name=re.compile(r'let\s+wareTypeName\s*=\s*["\']([^"\']*)["\']\s*;',re.I)
rx_two=re.compile(r'let\s+wareTypeTwoId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_twoname=re.compile(r'let\s+wareTypeTwoname\s*=\s*["\']([^"\']*)["\']\s*;',re.I)

def norm(s):return re.sub(r'\s+',' ',str(s or '')).strip().lower()
def has(t,p):return re.search(p,t,re.I) is not None

def classify(rail,title,cid,cname):
    t=norm(title)
    if rail=="beauty/body-care":
        if has(t,r'\b(body lotion|body cream|body scrub|body wash|body soap|body oil|body moisturizer|deodorant|after shave lotion|aftershave lotion)\b') and not has(t,r'\b(face|facial|hair|scalp|pet|dog|cat|scrubber|brush|belt|tool)\b'):
            return ("KEEP","EXPLICIT_BODY_CARE",.98)
    elif rail=="home/home-textiles":
        if has(t,r'\b(sofa cover|couch cover|cushion cover|tablecloth|table cloth|throw blanket|decorative pillow cover|chair cover)\b') and not has(t,r'\b(pet|dog|cat|bed sheet|duvet|quilt|comforter|curtain|rug)\b'):
            return ("KEEP","EXPLICIT_HOME_TEXTILE",.97)
    elif rail=="home/tools-diy":
        if has(t,r'\b(tool kit|screwdriver|pliers|wrench|drill bit|tape measure|measuring tape|wire stripper|stitching awl|repair tool|hex key|socket wrench)\b') and not has(t,r'\b(body fat|jewelry scale|kitchen|beauty|toy)\b'):
            return ("KEEP","EXPLICIT_HOME_TOOL",.98)
    elif rail=="camping/camping-cook":
        if has(t,r'\b(camping stove|camping cookware|camping pot|camping pan|camping kettle|camping cook set|outdoor cookware|camp cookware)\b'):
            return ("KEEP","EXPLICIT_CAMP_COOK",.98)
    elif rail=="garden/outdoor-living":
        if has(t,r'\b(patio chair|patio table|outdoor chair|outdoor table|garden chair|garden table|outdoor hammock|camping hammock)\b') and not has(t,r'\b(pet|cat|dog|cover|storage|toy)\b'):
            return ("KEEP","EXPLICIT_OUTDOOR_LIVING",.97)
    elif rail=="pets/pet-toys":
        if has(t,r'\b(pet toy|dog toy|cat toy|chew toy|cat teaser|cat wand|dog ball toy|interactive cat toy)\b') and not has(t,r'\b(storage|clothing|costume)\b'):
            return ("KEEP","EXPLICIT_PET_TOY",.99)
    elif rail=="office/office-storage":
        if has(t,r'\b(file organizer|document organizer|desk organizer|office storage|file box|document box|desktop storage|pen organizer|stationery organizer)\b') and not has(t,r'\b(decor|art|toy)\b'):
            return ("KEEP","EXPLICIT_OFFICE_STORAGE",.98)
    elif rail=="electrical/electrical-accessories":
        if has(t,r'\b(power strip|extension cord|wall socket|power socket|plug adapter|travel adapter|circuit breaker|electrical outlet|wall outlet|voltage converter|smart socket)\b') and not has(t,r'\b(phone case|data cable|usb cable)\b'):
            return ("KEEP","EXPLICIT_ELECTRICAL_ACCESSORY",.98)
    elif rail=="pets/pet-feeding":
        if has(t,r'\b(pet bowl|dog bowl|cat bowl|pet feeder|dog feeder|cat feeder|pet water fountain|cat water fountain|pet feeding)\b'):
            return ("KEEP","EXPLICIT_PET_FEEDING",.99)
    elif rail=="sports/outdoors":
        if has(t,r'\b(hiking poles?|trekking poles?|climbing harness|outdoor sports gear|hiking gear|trekking gear)\b') and not has(t,r'\b(camping stove|tent|sleeping bag)\b'):
            return ("KEEP","EXPLICIT_OUTDOOR_SPORT",.97)
    elif rail=="sports/sports-gear":
        if has(t,r'\b(soccer ball|basketball hoop|basketball ball|volleyball ball|tennis racket|tennis racquet|badminton racket|badminton racquet|training cones?|agility ladder)\b') and not has(t,r'\b(toy|kids? toy)\b'):
            return ("KEEP","EXPLICIT_SPORTS_GEAR",.98)
    elif rail=="kitchen/bakeware":
        if has(t,r'\b(baking (pan|tray|sheet|mold|mould)|cake mold|cake mould|muffin pan|loaf pan|bakeware|cookie sheet)\b'):
            return ("KEEP","EXPLICIT_BAKEWARE",.98)
    elif rail=="camping/camping-lighting":
        if has(t,r'\b(camping lantern|camping light|tent light|tent lantern|camp lantern)\b'):
            return ("KEEP","EXPLICIT_CAMPING_LIGHT",.99)
    elif rail=="tech/electronics":
        if has(t,r'\b(digital clock|alarm clock|electronic timer|digital timer|laser distance meter|digital angle meter)\b') and not has(t,r'\b(watch|scale|stove|camping|kitchen|toy)\b'):
            return ("KEEP","EXPLICIT_GENERAL_ELECTRONICS",.96)
    return ("UNKNOWN","INSUFFICIENT_EVIDENCE",0)

shelves=json.load(open(SHELVES))
base=json.load(open(BASE))
prior_keeps=set()
for fp in PRIOR:
    d=json.load(open(fp))
    for x in d.get("results",[]):
        if x.get("recovery_state")=="KEEP":prior_keeps.add(str(x["provider"])+":"+str(x["item_id"]))
qids={(str(x.get("provider")),str(x.get("item_id")),str(x.get("current_rail"))) for x in base.get("quarantine",[]) if str(x.get("current_rail")) in TARGETS and str(x.get("state"))!="HOLD_OUT_OF_SCOPE"}

cached={}
for fp in [D5,D6,*PRIOR,OUT]:
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
            if (str(p["provider"]),str(p["item_id"]),rail) not in qids:continue
            if str(p["provider"])+":"+str(p["item_id"]) in prior_keeps:continue
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
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-C-V1","date":"2026-09-23","mode":"SHADOW_EVIDENCE_RECOVERY","production_effect":False,
 "target_rails":sorted(TARGETS),
 "summary":{"products_checked":len(results),"detail_missing_fetched":len(missing),"keep_recoverable":sum(1 for x in results if x["recovery_state"]=="KEEP"),"unknown":sum(1 for x in results if x["recovery_state"]=="UNKNOWN"),"rails_with_keep":sum(1 for c in byrail.values() if c.get("KEEP",0)>0)},
 "by_rail":{k:dict(v) for k,v in byrail.items()},
 "rules":["Only Stage6 quarantine products are eligible.","Prior Stage7 KEEP products are excluded.","Current rail is not evidence.","Recovery KEEP requires explicit subtype evidence.","No Production mutation or new sourcing."],
 "results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(out["summary"],ensure_ascii=False))
for rail,c in sorted(out["by_rail"].items()):print("RAIL",rail,c)
