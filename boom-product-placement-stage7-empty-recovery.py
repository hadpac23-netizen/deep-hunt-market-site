#!/usr/bin/env python3
import json,re,urllib.request,gzip
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
PREVIEW=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json"
D5=ROOT/"evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json"
D6=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json"

rx_id=re.compile(r'let\s+wareTypeId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_name=re.compile(r'let\s+wareTypeName\s*=\s*["\']([^"\']*)["\']\s*;',re.I)
rx_two=re.compile(r'let\s+wareTypeTwoId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_twoname=re.compile(r'let\s+wareTypeTwoname\s*=\s*["\']([^"\']*)["\']\s*;',re.I)

def norm(s):return re.sub(r'\s+',' ',str(s or '')).strip()
def has(t,p):return re.search(p,t,re.I) is not None

# Exact supplier-category support where EPROLO category semantics are narrow enough.
EXACT={
 "kids/baby-clothing":{165},
 "men/men-bags":{56},
 "home/cleaning":set(),
 "kitchen/kitchen-appliances":set(),
 "pets/pet-feeding":set(), # subtype required
}
# Product-title validators for empty rails. These only KEEP current rail when explicit.
def classify(rail,title,cid,cname):
    t=norm(title).lower()
    if cid in EXACT.get(rail,set()):
        return ("KEEP","EXACT_SUPPLIER_CATEGORY",.99)

    rules={
      "women/women-tops":r'\b(women|woman|female|ladies).{0,45}\b(t[- ]?shirt|shirt|blouse|top|tank top|camisole|crop top)\b|\b(t[- ]?shirt|blouse|top|tank top|camisole|crop top)\b.{0,45}\b(women|woman|female|ladies)\b',
      "women/women-bottoms":r'\b(women|woman|female|ladies).{0,45}\b(pants|trousers|shorts|leggings|bottoms)\b|\b(pants|trousers|shorts|leggings|bottoms)\b.{0,45}\b(women|woman|female|ladies)\b',
      "women/women-sleepwear":r'\b(women|woman|female|ladies).{0,45}\b(pajamas?|pyjamas?|nightgown|nightdress|sleepwear|robe)\b|\b(pajamas?|pyjamas?|nightgown|nightdress|sleepwear|robe)\b.{0,45}\b(women|woman|female|ladies)\b',
      "women/women-clothing":r'\b(women|woman|female|ladies).{0,35}\b(clothing set|outfit set|two[- ]piece set)\b',
      "men/men-underwear":r'\b(men|man|male|mens|men\'s).{0,45}\b(underwear|briefs?|underpants|trunks?)\b|\b(underwear|briefs?|underpants|trunks?)\b.{0,45}\b(men|man|male|mens|men\'s)\b',
      "men/men-accessories":r'\b(men|man|male|mens|men\'s).{0,45}\b(accessor(y|ies)|tie|bow tie|cufflinks?|wallet)\b',
      "men/men-clothing":r'\b(men|man|male|mens|men\'s).{0,35}\b(clothing set|outfit set|two[- ]piece set)\b',
      "accessories/belts":r'\b(leather belt|canvas belt|dress belt|waist belt|fashion belt|mens belt|women.s belt)\b',
      "accessories/scarves":r'\b(scarf|shawl|neck scarf)\b',
      "accessories/keychains":r'\b(keychain|key chain|keyring|key ring)\b',
      "accessories/gloves":r'\b(gloves?|mittens?)\b',
      "tech/smart-home":r'\b(smart (plug|socket|switch|doorbell|lock|thermostat)|wifi (plug|socket|switch)|zigbee|tuya)\b',
      "tech/electronics":r'\b(digital clock|alarm clock|electronic timer|digital timer|laser distance meter|digital angle meter)\b',
      "home/bath":r'\b(bath mat|bath rug|shower curtain|soap dish|soap dispenser|toothbrush holder|towel rack|shower caddy|bathroom organizer|shower head|showerhead|bathroom faucet|basin faucet)\b',
      "home/tools-diy":r'\b(tool kit|screwdriver|pliers|wrench|drill bit|measuring tape|tape measure|wire stripper|stitching awl|repair tool)\b',
      "home/cleaning":r'\b(lint remover|cleaning powder|cleaning tablet|window cleaning spray|cleaning cream|cleaning brush|mop|broom|duster|squeegee)\b',
      "home/furniture":r'\b(office chair|dining chair|accent chair|coffee table|side table|bedside table|nightstand|bookshelf|book shelf|storage cabinet|shoe cabinet|bed frame|sofa|couch|stool)\b',
      "home/mirrors":r'\b(wall mirror|full length mirror|bathroom mirror|dressing mirror|desktop mirror|makeup mirror|hanging mirror)\b',
      "kitchen/bakeware":r'\b(baking (pan|tray|sheet|mold|mould)|cake mold|cake mould|muffin pan|loaf pan|bakeware|cookie sheet)\b',
      "kitchen/kitchen-appliances":r'\b(air fryer|electric kettle|coffee maker|milk frother|blender|electric juicer|portable juicer|rice cooker|toaster|microwave|food processor|electric mixer|soy milk machine|nut milk maker)\b',
      "camping/camping-cook":r'\b(camping (stove|cookware|pot|pan|kettle|cook set|cooking)|outdoor cookware|camp cookware)\b',
      "garden/planters":r'\b(planter|flower pot|plant pot|hanging pot|plant container)\b',
      "garden/watering":r'\b(watering can|garden hose|hose nozzle|garden sprinkler|lawn sprinkler|watering nozzle|drip irrigation|irrigation controller|irrigation timer)\b',
      "garden/outdoor-living":r'\b(patio chair|patio table|outdoor chair|outdoor table|garden chair|garden table|outdoor hammock|camping hammock)\b',
      "garden/garden-decor":r'\b(garden decor|garden decoration|yard decor|garden ornament|garden statue|garden figurine|garden windmill|garden wind chime|yard ornament)\b',
      "pets/pet-feeding":r'\b(pet bowl|dog bowl|cat bowl|pet feeder|dog feeder|cat feeder|water feeder|food feeder|pet water fountain|cat fountain)\b',
      "pets/pet-beds":r'\b(pet bed|dog bed|cat bed|pet mat|dog mat|cat mat|pet cushion|cat cushion|dog cushion)\b',
      "toys/toys":r'\b(children.s toy|kids toy|toy car|toy truck|toy excavator|doll|action figure|puzzle toy|pretend play)\b',
      "office/office-furniture":r'\b(office chair|office desk|desk chair|computer desk|office table|office cabinet)\b',
      "office/office-storage":r'\b(file organizer|document organizer|desk organizer|office storage|file box|document box|desktop storage)\b'
    }
    if rail=="toys/toys" and cid==100 and has(t,r'\btoy\b') and not has(t,r'\b(pet|dog|cat|plush|building|educational|learning|montessori|clothing|camera|decor|ornament|storage)\b'):
        return ("KEEP","SUPPLIER_GENERAL_TOY_GUARDED",.98)
    pat=rules.get(rail)
    if pat and has(t,pat):
        # exclusions that often create false positives
        if rail=="accessories/belts" and has(t,r'\b(bag|shoe|sandal|boot|costume|cosplay|luggage|suitcase|sports|posture)\b'):return ("REVIEW","BELT_CONTEXT_CONFLICT",.95)
        if rail=="accessories/belts" and has(t,r'\b(keychain|key chain|buckle accessory)\b'):return ("REVIEW","BELT_ACCESSORY_CONFLICT",.96)
        if rail=="accessories/scarves" and has(t,r'\b(pet|dog|cat|bag|handbag|costume|cosplay)\b'):return ("REVIEW","SCARF_CONTEXT_CONFLICT",.95)
        if rail=="accessories/gloves" and has(t,r'\b(oven|kitchen|pet|grooming|boxing|cycling|workout|medical|costume|cosplay|paw)\b'):return ("REVIEW","GLOVE_CONTEXT_CONFLICT",.95)
        if rail=="women/women-bottoms" and has(t,r'\b(jeans?|denim)\b'):return ("REVIEW","WOMEN_JEANS_SEPARATE_RAIL",.99)
        if rail=="men/men-underwear" and has(t,r'\bboxers?\b'):return ("REVIEW","MEN_BOXERS_SEPARATE_RAIL",.99)
        if rail=="tech/electronics" and has(t,r'\b(watch|scale|stove|camping|kitchen|toy)\b'):return ("REVIEW","ELECTRONICS_CONTEXT_CONFLICT",.95)
        if rail=="home/bath" and has(t,r'\b(phone case|phone holder|shoe rack|wall art|cleaner|repellent)\b'):return ("REVIEW","BATH_CONTEXT_CONFLICT",.95)
        if rail=="home/tools-diy" and has(t,r'\b(body fat|jewelry scale|kitchen|beauty)\b'):return ("REVIEW","TOOL_CONTEXT_CONFLICT",.95)
        if rail=="home/cleaning" and has(t,r'\b(straw|pet|dog|cat)\b'):return ("REVIEW","CLEANING_CONTEXT_CONFLICT",.96)
        if rail=="home/furniture" and has(t,r'\b(cover|protector|mat|pad|leg|feet|handle|hook|toy|tablecloth|display card|net|opener)\b'):return ("REVIEW","FURNITURE_CONTEXT_CONFLICT",.95)
        if rail=="home/furniture" and has(t,r'\b(ashtray|blanket|cream|repair|disinfection|decoration)\b'):return ("REVIEW","FURNITURE_NOT_PRIMARY_PRODUCT",.97)
        if rail=="home/mirrors" and has(t,r'\b(car|automotive|vehicle|phone case|sunshade)\b'):return ("REVIEW","MIRROR_CONTEXT_CONFLICT",.95)
        if rail=="garden/watering" and has(t,r'\b(shower|toy|kids?|pool|beach)\b'):return ("REVIEW","WATERING_CONTEXT_CONFLICT",.95)
        if rail=="garden/outdoor-living" and has(t,r'\b(pet|cat|dog|cover|storage|toy)\b'):return ("REVIEW","OUTDOOR_LIVING_CONTEXT_CONFLICT",.95)
        if rail=="garden/garden-decor" and has(t,r'\b(pet memorial|bird feeder|flower pot|planter)\b'):return ("REVIEW","GARDEN_DECOR_CONTEXT_CONFLICT",.95)
        if rail=="toys/toys" and has(t,r'\b(pet toy|dog toy|cat toy|clothing|shirt|camera|decor|ornament|storage)\b'):return ("REVIEW","TOY_CONTEXT_CONFLICT",.96)
        if rail=="toys/toys" and cid==140:return ("REVIEW","HOME_DECOR_NOT_TOY",.98)
        if rail=="pets/pet-beds" and has(t,r'\b(baby|babies)\b'):return ("REVIEW","PET_BED_MIXED_BABY_CONTEXT",.97)
        if rail=="garden/planters" and has(t,r'\b(bird feeder|water basin)\b'):return ("REVIEW","PLANTER_MIXED_FUNCTION",.95)
        if rail=="office/office-furniture" and has(t,r'\b(mat|pad|holder|stand|decor|ornament|cushion)\b'):return ("REVIEW","OFFICE_FURNITURE_CONTEXT_CONFLICT",.95)
        if rail=="office/office-furniture" and has(t,r'\b(vase|decoration)\b'):return ("REVIEW","OFFICE_FURNITURE_NOT_PRIMARY_PRODUCT",.98)
        return ("KEEP","EXPLICIT_TITLE_CURRENT_RAIL",.96)
    return ("UNKNOWN","INSUFFICIENT_EVIDENCE",0)

shelves=json.load(open(SHELVES))
preview=json.load(open(PREVIEW))
empty={x["rail"] for x in preview.get("empty_rails",[])}

cached={}
for fp in [D5,D6,OUT]:
    if not fp.exists():continue
    d=json.load(open(fp))
    for x in d.get("results",[]):
        if x.get("supplier_category_id") is not None:
            cached[str(x.get("item_id"))]={
              "supplier_parent_id":x.get("supplier_parent_id"),
              "supplier_parent_name":x.get("supplier_parent_name"),
              "supplier_category_id":x.get("supplier_category_id"),
              "supplier_category_name":x.get("supplier_category_name")
            }

quarantine_ids={(str(x.get("provider")),str(x.get("item_id")),str(x.get("current_rail"))) for x in preview.get("quarantine",[]) if str(x.get("current_rail")) in empty and str(x.get("state")) not in {"HOLD_OUT_OF_SCOPE"}}
products=[]
for dep in shelves.get("departments",[]):
    for cat in dep.get("categories",[]):
        rail=dep["slug"]+"/"+cat["slug"]
        if rail not in empty:continue
        for p in cat.get("products",[]):
            key=(str(p["provider"]),str(p["item_id"]),rail)
            if key not in quarantine_ids:continue
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
    state,reason,confidence=classify(x["current_rail"],x["title"],ev.get("supplier_category_id"),ev.get("supplier_category_name"))
    results.append({**x,**ev,"recovery_state":state,"reason":reason,"confidence":confidence,"production_effect":False})

byrail=defaultdict(Counter)
for x in results:byrail[x["current_rail"]][x["recovery_state"]]+=1
recoverable={rail:c.get("KEEP",0) for rail,c in byrail.items()}
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-V1","date":"2026-09-23","mode":"SHADOW_EVIDENCE_RECOVERY",
 "production_effect":False,
 "summary":{"empty_rails":len(empty),"source_products_in_empty_rails":len(products),"detail_missing_fetched":len(missing),
            "keep_recoverable":sum(1 for x in results if x["recovery_state"]=="KEEP"),
            "review":sum(1 for x in results if x["recovery_state"]=="REVIEW"),
            "unknown":sum(1 for x in results if x["recovery_state"]=="UNKNOWN"),
            "rails_with_keep_recovery":sum(1 for v in recoverable.values() if v>0)},
 "by_rail":{k:dict(v) for k,v in byrail.items()},
 "recoverable_keep_by_rail":dict(sorted(recoverable.items(),key=lambda kv:-kv[1])),
 "rules":["Recovery uses independent supplier taxonomy and explicit product-type title evidence.","Current rail is not evidence.","KEEP recovery is Shadow only.","REVIEW/UNKNOWN remain quarantined.","No new sourcing until evidence-blocked inventory is exhausted."],
 "results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(out["summary"],ensure_ascii=False))
for rail,c in sorted(out["by_rail"].items()):print("RAIL",rail,c)
