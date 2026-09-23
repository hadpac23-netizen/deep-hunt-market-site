#!/usr/bin/env python3
import json,re,urllib.request,gzip
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
BASE=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json"
EMPTY=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json"
A=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-2026-09-23.json"
D5=ROOT/"evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json"
D6=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-B-2026-09-23.json"

TARGETS={
 "accessories/hair-accessories","garden/garden-lighting","men/men-accessories",
 "toys/educational-toys","home/home-storage","gifts/gift-decor","travel/luggage",
 "accessories/hats","office/crafts","accessories/watches","home/bath","home/bedding",
 "women/women-underwear","garden/garden-tools"
}
rx_id=re.compile(r'let\s+wareTypeId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_name=re.compile(r'let\s+wareTypeName\s*=\s*["\']([^"\']*)["\']\s*;',re.I)
rx_two=re.compile(r'let\s+wareTypeTwoId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_twoname=re.compile(r'let\s+wareTypeTwoname\s*=\s*["\']([^"\']*)["\']\s*;',re.I)

def norm(s):return re.sub(r'\s+',' ',str(s or '')).strip().lower()
def has(t,p):return re.search(p,t,re.I) is not None

def classify(rail,title,cid,cname):
    t=norm(title)
    if rail=="accessories/hair-accessories":
        if has(t,r'\b(hair clip|hairpin|hair pin|barrette|scrunchie|hair claw|claw clip|hair band|headband)\b') and not has(t,r'\b(pet|dog|cat|costume|cosplay|kids?|children|baby)\b'):
            return ("KEEP","EXPLICIT_HAIR_ACCESSORY",.98)
    elif rail=="garden/garden-lighting":
        if has(t,r'\b(garden light|garden lamp|landscape light|pathway light|lawn light|solar garden light|outdoor garden light)\b') and not has(t,r'\b(car|camping|indoor)\b'):
            return ("KEEP","EXPLICIT_GARDEN_LIGHTING",.98)
    elif rail=="men/men-accessories":
        if has(t,r'\b(cufflinks?|tie clip|bow tie|pocket square|mens wallet|men.s wallet|men.s tie|mens tie)\b') and not has(t,r'\b(women|kids?|pet|dog|cat)\b'):
            return ("KEEP","EXPLICIT_MEN_ACCESSORY",.98)
    elif rail=="toys/educational-toys":
        if has(t,r'\b(educational toy|learning toy|montessori toy|stem toy|busy board|alphabet toy|math toy|learning board|educational puzzle)\b') and not has(t,r'\b(pet|dog|cat)\b'):
            return ("KEEP","EXPLICIT_EDUCATIONAL_TOY",.99)
    elif rail=="home/home-storage":
        if has(t,r'\b(storage box|storage basket|storage bin|drawer organizer|closet organizer|home organizer|under bed storage|wardrobe organizer)\b') and not has(t,r'\b(kitchen|food|snack|bowl|jewelry|sewing|thread|pet|toy)\b'):
            return ("KEEP","EXPLICIT_HOME_STORAGE",.98)
    elif rail=="gifts/gift-decor":
        if has(t,r'\b(gift box|gift bag|gift wrap|gift decoration|gift decor|keepsake|souvenir|gift ornament)\b') and not has(t,r'\b(jewelry|ring|necklace|earring|bracelet|watch|party supplies)\b'):
            return ("KEEP","EXPLICIT_GIFT_DECOR",.97)
    elif rail=="travel/luggage":
        if has(t,r'\b(suitcase|travel suitcase|luggage case|trolley case|carry[- ]?on luggage|rolling luggage|hardshell luggage|hard shell luggage)\b') and not has(t,r'\b(cover|protector|cosmetic bag|handbag|wallet|pet carrier)\b'):
            return ("KEEP","EXPLICIT_TRAVEL_LUGGAGE",.99)
        if cid==154 and has(t,r'\b(travel bag|luggage bag|boarding bag|carry[- ]?on|duffel)\b') and not has(t,r'\b(cover|protector|gym bag|fitness bag|sports bag|school bag|backpack)\b'):
            return ("KEEP","SUPPLIER_LUGGAGE_TRAVEL_BAG",.98)
    elif rail=="accessories/hats":
        if has(t,r'\b(hat|cap|beanie|bucket hat|sun hat)\b') and not has(t,r'\b(kids?|children|baby|pet|dog|cat|costume|cosplay|shower cap|headband|slippers?|shoe cover|toe cap)\b'):
            return ("KEEP","EXPLICIT_GENERIC_HAT",.97)
    elif rail=="office/crafts":
        if has(t,r'\b(diy craft|craft kit|craft supplies|resin mold|resin mould|scrapbooking|handmade craft|craft beads|embroidery kit|sewing craft)\b') and not has(t,r'\b(jewelry finished|pet|toy)\b'):
            return ("KEEP","EXPLICIT_CRAFT_SUPPLY",.97)
    elif rail=="accessories/watches":
        if (cid==49 or has(t,r'\b(wristwatch|wrist watch|analog watch|quartz watch|fashion watch)\b')) and not has(t,r'\b(smart watch|smartwatch|fitness tracker|strap|band|case|cover|watch box)\b'):
            return ("KEEP","EXPLICIT_FASHION_WATCH",.99)
    elif rail=="home/bath":
        if has(t,r'\b(bath mat|bath rug|shower curtain|soap dish|soap dispenser|toothbrush holder|towel rack|shower caddy|bathroom organizer|shower head|showerhead|bathroom faucet|basin faucet)\b') and not has(t,r'\b(phone case|phone holder|shoe rack|wall art|cleaner|repellent)\b'):
            return ("KEEP","EXPLICIT_BATH_PRODUCT",.98)
    elif rail=="home/bedding":
        if has(t,r'\b(duvet cover|bed sheet|bedsheet|sheet set|pillowcase|pillow case|quilt|comforter|bedspread|bedding set)\b') and not has(t,r'\b(pet|dog|cat|baby|storage|organizer|box|bag)\b'):
            return ("KEEP","EXPLICIT_BEDDING",.98)
    elif rail=="women/women-underwear":
        if has(t,r'\b(women|woman|female|ladies).{0,40}\b(underwear|panties|briefs|lingerie|bra|thong)\b|\b(underwear|panties|lingerie|bra|thong)\b.{0,40}\b(women|woman|female|ladies)\b') and not has(t,r'\b(sports bra|sport bra|swim|bikini|sleepwear|pajama)\b'):
            return ("KEEP","EXPLICIT_WOMEN_UNDERWEAR",.98)
    elif rail=="garden/garden-tools":
        if has(t,r'\b(garden shovel|garden trowel|garden rake|pruning shears|pruner|garden shears|weeder|gardening tool|planting tool)\b') and not has(t,r'\b(toy|kids?)\b'):
            return ("KEEP","EXPLICIT_GARDEN_TOOL",.98)
    return ("UNKNOWN","INSUFFICIENT_EVIDENCE",0)

shelves=json.load(open(SHELVES))
base=json.load(open(BASE))
prior_keeps=set()
for fp in [EMPTY,A]:
    d=json.load(open(fp))
    for x in d.get("results",[]):
        if x.get("recovery_state")=="KEEP":prior_keeps.add(str(x["provider"])+":"+str(x["item_id"]))
qids={(str(x.get("provider")),str(x.get("item_id")),str(x.get("current_rail"))) for x in base.get("quarantine",[]) if str(x.get("current_rail")) in TARGETS and str(x.get("state"))!="HOLD_OUT_OF_SCOPE"}

cached={}
for fp in [D5,D6,EMPTY,A,OUT]:
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
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-B-V1","date":"2026-09-23","mode":"SHADOW_EVIDENCE_RECOVERY","production_effect":False,
 "target_rails":sorted(TARGETS),
 "summary":{"products_checked":len(results),"detail_missing_fetched":len(missing),"keep_recoverable":sum(1 for x in results if x["recovery_state"]=="KEEP"),"unknown":sum(1 for x in results if x["recovery_state"]=="UNKNOWN"),"rails_with_keep":sum(1 for c in byrail.values() if c.get("KEEP",0)>0)},
 "by_rail":{k:dict(v) for k,v in byrail.items()},
 "rules":["Only Stage6 quarantine products are eligible.","Prior Stage7 KEEP products are excluded.","Current rail is not evidence.","Recovery KEEP requires explicit subtype evidence.","No Production mutation or new sourcing."],
 "results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(out["summary"],ensure_ascii=False))
for rail,c in sorted(out["by_rail"].items()):print("RAIL",rail,c)
