#!/usr/bin/env python3
import json,re,urllib.request,gzip
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
DETAIL=ROOT/"evidence/HUNT-EPROLO-DETAIL-TAXONOMY-STAGE5-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-2026-09-23.json"
TARGETS={
 "gifts/gift-decor","kitchen/drinkware","electrical/electrical-lighting",
 "beauty/beauty-tools","sports/fitness","pets/pet-accessories"
}

rx_id=re.compile(r'let\s+wareTypeId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_name=re.compile(r'let\s+wareTypeName\s*=\s*["\']([^"\']*)["\']\s*;',re.I)
rx_two=re.compile(r'let\s+wareTypeTwoId\s*=\s*["\']?([^;"\']+)["\']?\s*;',re.I)
rx_twoname=re.compile(r'let\s+wareTypeTwoname\s*=\s*["\']([^"\']*)["\']\s*;',re.I)

def norm(s): return re.sub(r'\s+',' ',str(s or '')).strip()
def has(t,pat): return re.search(pat,t,re.I) is not None

def classify(rail,title,cid,cname):
    t=norm(title).lower()
    # Gift Decor: identify jewelry/home/party/stickers before accepting decor.
    if rail=="gifts/gift-decor":
        if has(t,r'\b(self[- ]?defense|weapon|window breaker)\b'):
            return ("HOLD_OUT_OF_SCOPE",None,"RISK_OR_SCOPE_REVIEW",1.0)
        exact={33:"accessories/jewelry-rings",47:"accessories/jewelry-necklaces",48:"accessories/jewelry-earrings",
               49:"accessories/watches",50:"accessories/jewelry-bracelets",51:"accessories/jewelry",
               140:"home/home-decor",145:"gifts/party"}
        if cid in exact:
            return ("SAFE_MOVE_CANDIDATE",exact[cid],"SUPPLIER_FAMILY_EXACT",0.99)
        if cid==131 or has(t,r'\b(beads?|jewelry making|diy jewelry|craft beads?)\b'):
            return ("REVIEW","office/crafts","DIY_JEWELRY_CRAFT_OVERLAP",0.85)
        if has(t,r'\b(sticker|decal)\b'):
            return ("SAFE_MOVE_CANDIDATE","office/stickers","EXPLICIT_STICKER",0.98)
        if has(t,r'\b(ring|necklace|earrings?|bracelet|bangle|pendant|watch)\b'):
            return ("REVIEW",None,"JEWELRY_SUBTYPE_NEEDS_EXACT_RAIL",0.90)
        if has(t,r'\b(gift box|gift bag|gift wrap|gift decoration|gift decor|keepsake|souvenir|ornament|plaque|figurine|decorative sculpture)\b'):
            return ("KEEP","gifts/gift-decor","EXPLICIT_GIFT_DECOR",0.92)
        return ("UNKNOWN",None,"GIFT_DECOR_UNRESOLVED",0.0)

    if rail=="kitchen/drinkware":
        if has(t,r'\b(cup|mug|tumbler|water bottle|vacuum bottle|thermos|flask|goblet|wine glass|champagne glass|cocktail glass|drinking glass|coffee glass|tea glass|juice glass)\b'):
            if has(t,r'\b(bowl|plate|dish|soup bowl)\b') and not has(t,r'\bcup\b'):
                return ("SAFE_MOVE_CANDIDATE","kitchen/tableware","EXPLICIT_TABLEWARE",0.97)
            return ("KEEP","kitchen/drinkware","EXPLICIT_DRINKWARE",0.98)
        if has(t,r'\b(bowl|plate|dinnerware|cutlery|flatware|spoon|fork)\b'):
            return ("SAFE_MOVE_CANDIDATE","kitchen/tableware","EXPLICIT_TABLEWARE",0.98)
        if has(t,r'\b(frying pan|saucepan|cooking pot|stock pot|wok|casserole|roasting pan)\b'):
            return ("SAFE_MOVE_CANDIDATE","kitchen/cookware","EXPLICIT_COOKWARE",0.98)
        if has(t,r'\b(food storage|lunch box|bento box|airtight container|food container)\b'):
            return ("SAFE_MOVE_CANDIDATE","kitchen/food-storage","EXPLICIT_FOOD_STORAGE",0.98)
        return ("UNKNOWN",None,"DRINKWARE_UNRESOLVED",0.0)

    if rail=="electrical/electrical-lighting":
        if cid==38 or has(t,r'\b(power bank|portable power bank|magnetic power bank)\b'):
            return ("SAFE_MOVE_CANDIDATE","tech/power-banks","POWER_BANK_PRODUCT",0.99)
        if has(t,r'\b(wireless charger|charging stand|charging station)\b') and has(t,r'\b(light|lamp|clock|stand)\b'):
            return ("REVIEW",None,"MULTIFUNCTION_CHARGER_LIGHT",0.96)
        if has(t,r'\b(charging cable|usb cable|type[- ]?c cable|lightning cable|data cable)\b'):
            return ("SAFE_MOVE_CANDIDATE","tech/chargers-cables","EXPLICIT_CHARGING_CABLE",0.99)
        if has(t,r'\b(selfie light|phone light|live streaming light|photography light|camera light|ring light)\b'):
            return ("REVIEW","tech/cameras","PHOTO_LIGHT_OVERLAP",0.94)
        if has(t,r'\b(garden|landscape|lawn|pathway|courtyard)\b') and has(t,r'\b(light|lamp|lantern)\b'):
            return ("SAFE_MOVE_CANDIDATE","garden/garden-lighting","EXPLICIT_GARDEN_LIGHTING",0.98)
        if has(t,r'\b(camping|tent|hiking)\b') and has(t,r'\b(light|lamp|lantern)\b'):
            return ("REVIEW","camping/outdoors","CAMPING_LIGHTING_TAXONOMY_GAP",0.90)
        if cid==76 or has(t,r'\b(car|vehicle|automotive|headlight|fog light)\b'):
            return ("REVIEW",None,"AUTOMOTIVE_LIGHTING_TAXONOMY_GAP",0.98)
        if cid==109 and has(t,r'\b(light|lamp|bulb|chandelier|sconce|downlight|spotlight|led)\b'):
            return ("KEEP","electrical/electrical-lighting","SUPPLIER_LIGHTING_FAMILY",0.97)
        if has(t,r'\b(led bulb|light bulb|ceiling light|ceiling lamp|chandelier|pendant light|wall sconce|downlight|spotlight|light string|string light|christmas light|night light|lamp)\b'):
            return ("KEEP","electrical/electrical-lighting","EXPLICIT_LIGHTING",0.96)
        return ("UNKNOWN",None,"ELECTRICAL_LIGHTING_UNRESOLVED",0.0)

    if rail=="beauty/beauty-tools":
        if has(t,r'\b(teeth|dental|dentures|tooth whitening|oral)\b'):
            return ("REVIEW",None,"ORAL_CARE_TAXONOMY_GAP",0.99)
        if cid==86 or has(t,r'\b(hair|scalp|beard).{0,30}\b(serum|oil|mask|care|growth|conditioner|dye|shampoo)\b|\b(shampoo|conditioner|hair oil|hair serum|hair mask|hair growth|scalp care)\b'):
            return ("SAFE_MOVE_CANDIDATE","beauty/hair","HAIR_CARE_PRODUCT",0.99)
        if has(t,r'\b(body soap|body lotion|body cream|body oil|body scrub|after shave lotion|aftershave lotion|body care)\b'):
            return ("SAFE_MOVE_CANDIDATE","beauty/body-care","BODY_CARE_PRODUCT",0.98)
        if cid==87 or has(t,r'\b(lipstick|lip gloss|mascara|eyeliner|eyeshadow|eyebrow (pen|liner)|brow pen|foundation|concealer|blush|makeup palette)\b'):
            return ("SAFE_MOVE_CANDIDATE","beauty/makeup","MAKEUP_PRODUCT",0.99)
        if cid==88 or has(t,r'\b(face serum|facial serum|moisturizer|face cream|facial cream|cleanser|toner|sunscreen|eye cream|face mask|acne patch|skin care|skincare)\b'):
            return ("SAFE_MOVE_CANDIDATE","beauty/skincare","SKINCARE_PRODUCT",0.98)
        if has(t,r'\b(nail polish|gel polish|nail glue|press[- ]?on nails?|false nails?|nail tips|manicure|nail art)\b'):
            return ("SAFE_MOVE_CANDIDATE","beauty/nails","NAIL_PRODUCT",0.98)
        if cid==89 or has(t,r'\b(perfume|cologne|eau de parfum|eau de toilette|fragrance)\b'):
            return ("SAFE_MOVE_CANDIDATE","beauty/fragrance","FRAGRANCE_PRODUCT",0.99)
        if cid in {91,93} or has(t,r'\b(hair removal device|epilator|trimmer|clipper|makeup brush|beauty sponge|eyelash curler|facial roller|gua sha|blackhead remover|pore cleaner|cleansing device)\b'):
            return ("KEEP","beauty/beauty-tools","BEAUTY_TOOL_OR_DEVICE",0.97)
        return ("UNKNOWN",None,"BEAUTY_TOOLS_UNRESOLVED",0.0)

    if rail=="sports/fitness":
        if cid==70:
            return ("SAFE_MOVE_CANDIDATE","sports/sports-bags","SUPPLIER_SPORT_BAGS",0.99)
        if cid==67:
            return ("SAFE_MOVE_CANDIDATE","sports/cycling","SUPPLIER_CYCLING",0.99)
        if has(t,r'\b(yoga pants|gym shorts|sports shorts|running pants|training pants|workout leggings|fitness pants)\b'):
            return ("SAFE_MOVE_CANDIDATE","sports/active-bottoms","SPORTS_BOTTOMS",0.98)
        if has(t,r'\b(grip trainer|grip strengthener|hand grip|dumbbell|barbell|ab roller|resistance band|exercise band|fitness equipment|gym equipment|strength trainer)\b'):
            return ("KEEP","sports/fitness","FITNESS_EQUIPMENT",0.98)
        if cid==66:
            return ("REVIEW",None,"SPORTS_CLOTHING_TAXONOMY_GAP",0.95)
        if has(t,r'\b(bike helmet|bicycle helmet|cycling helmet|bicycle pump|bike pump|bike saddle|bicycle saddle|cycling jersey|bike repair kit)\b'):
            return ("SAFE_MOVE_CANDIDATE","sports/cycling","EXPLICIT_CYCLING_PRODUCT",0.98)
        if cid==73 or has(t,r'\b(wrist wallet|ankle support|knee support|wrist support|brace|fitness strap|fitness belt|fitness accessory)\b'):
            return ("REVIEW","sports/fitness-accessories","SPORT_ACCESSORY_REVIEW",0.94)
        if cid==69:
            return ("KEEP","sports/fitness","SUPPLIER_FITNESS_FAMILY",0.97)
        return ("UNKNOWN",None,"SPORTS_FITNESS_UNRESOLVED",0.0)

    if rail=="pets/pet-accessories":
        if cid==1214 or has(t,r'\b(pet clothes|dog clothes|cat clothes|pet clothing|dog sweater|cat sweater|pet costume|dog costume|pet pajamas|dog pajamas)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-clothing","PET_CLOTHING",0.99)
        if has(t,r'\b(pet bed|dog bed|cat bed|pet mat|dog mat|cat mat)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-beds","PET_BED",0.98)
        if has(t,r'\b(pet house|dog house|cat house|cat cave|pet cave|cat condo)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-houses","PET_HOUSE",0.98)
        if has(t,r'\b(pet toy|dog toy|cat toy|chew toy|cat teaser|cat wand)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-toys","PET_TOY",0.98)
        if has(t,r'\b(grooming|pet brush|dog brush|cat brush|deshedding|pet clipper|pet nail clipper)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-grooming","PET_GROOMING",0.98)
        if has(t,r'\b(pet bowl|dog bowl|cat bowl|pet feeder|dog feeder|cat feeder|water feeder|food feeder)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-feeding","PET_FEEDING",0.97)
        if has(t,r'\b(leash|collar|harness|poop bag|waste bag|dog walking|pet walking)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/pet-walk","PET_WALK",0.97)
        if has(t,r'\b(aquarium|fish tank|fish feeder|aquatic)\b'):
            return ("SAFE_MOVE_CANDIDATE","pets/aquarium","AQUARIUM",0.98)
        if cid==128:
            return ("KEEP","pets/pet-accessories","BROAD_PET_PRODUCT_NO_SUBTYPE_CONFLICT",0.80)
        return ("UNKNOWN",None,"PET_ACCESSORY_UNRESOLVED",0.0)
    return ("UNKNOWN",None,"OUTSIDE_STAGE6",0.0)

shelves=json.load(open(SHELVES))
prior={}
if DETAIL.exists():
    d=json.load(open(DETAIL))
    prior={str(x.get("item_id")):x for x in d.get("results",[]) if x.get("supplier_category_id") is not None}
if OUT.exists():
    try:
        old_stage6=json.load(open(OUT))
        for x in old_stage6.get("results",[]):
            if x.get("supplier_category_id") is not None:
                prior[str(x.get("item_id"))]=x
    except Exception:
        pass

rows=[]
for dep in shelves.get("departments",[]):
    for cat in dep.get("categories",[]):
        rail=dep["slug"]+"/"+cat["slug"]
        if rail not in TARGETS: continue
        for p in cat.get("products",[]):
            rows.append({"provider":p["provider"],"item_id":str(p["item_id"]),"title":p.get("title") or "",
                         "current_rail":rail,"image_url":p.get("image_url")})
missing=[x for x in rows if x["provider"]=="EPROLO" and x["item_id"] not in prior]

def fetch_detail(x):
    pid=x["item_id"]
    req=urllib.request.Request(f"https://eprolo.com/app/mproductdetail.html?id={pid}",
        headers={"User-Agent":"Mozilla/5.0","Accept-Encoding":"gzip","Accept":"text/html"})
    try:
        with urllib.request.urlopen(req,timeout=12) as r:
            data=r.read()
            if r.headers.get("Content-Encoding")=="gzip": data=gzip.decompress(data)
            t=data.decode("utf-8","ignore")
        m1,m2,m3,m4=rx_id.search(t),rx_name.search(t),rx_two.search(t),rx_twoname.search(t)
        cid=int(m3.group(1)) if m3 and str(m3.group(1)).strip().isdigit() else None
        return {"item_id":pid,"supplier_parent_id":int(m1.group(1)) if m1 and str(m1.group(1)).strip().isdigit() else None,
                "supplier_parent_name":m2.group(1) if m2 else None,"supplier_category_id":cid,
                "supplier_category_name":m4.group(1) if m4 else None}
    except Exception as e:
        return {"item_id":pid,"detail_error":str(e)}

fetched={}
if missing:
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs=[ex.submit(fetch_detail,x) for x in missing]
        for i,f in enumerate(as_completed(futs),1):
            r=f.result(); fetched[r["item_id"]]=r
            if i%100==0: print("DETAIL",i,"/",len(missing),flush=True)

results=[]
for x in rows:
    ev=prior.get(x["item_id"]) or fetched.get(x["item_id"]) or {}
    cid=ev.get("supplier_category_id")
    cname=ev.get("supplier_category_name")
    state,target,reason,confidence=classify(x["current_rail"],x["title"],cid,cname)
    # Cross-source disagreement: supplier category exact family conflicting with title move target => REVIEW.
    results.append({**x,"supplier_category_id":cid,"supplier_category_name":cname,
        "overlap_state":state,"suggested_rail":target,"reason":reason,"confidence":confidence,
        "production_effect":False})

counts=Counter(x["overlap_state"] for x in results)
byrail=defaultdict(Counter)
moves=defaultdict(Counter)
for x in results:
    byrail[x["current_rail"]][x["overlap_state"]]+=1
    if x["suggested_rail"]: moves[x["current_rail"]][x["suggested_rail"]]+=1
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE6-OVERLAP-RESOLUTION-V1","date":"2026-09-23",
 "mode":"SHADOW_RECOMMENDATION_ONLY","production_effect":False,
 "target_rails":sorted(TARGETS),
 "summary":{"products":len(results),"states":dict(counts),"detail_missing_fetched":len(missing)},
 "by_rail":{k:dict(v) for k,v in byrail.items()},
 "suggested_destinations":{k:dict(v) for k,v in moves.items()},
 "rules":[
   "Current HUNT rail is not positive evidence.",
   "Official supplier taxonomy determines product family when exact; title resolves subtype when unambiguous.",
   "MOVE_CANDIDATE is recommendation-only and never mutates Production.",
   "Taxonomy gaps and disagreements return REVIEW/UNKNOWN.",
   "No shelf-density goal may override product placement truth."
 ],
 "results":results
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(out["summary"],ensure_ascii=False))
for rail,c in out["by_rail"].items(): print("RAIL",rail,c)
for rail,c in out["suggested_destinations"].items(): print("DEST",rail,dict(c))
