#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
SRC=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-DISCOVERY-2026-09-23.json"
SHELVES=ROOT/"evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QA-SHORTLIST-V2-2026-09-23.json"

def has(t,p): return re.search(p,t,re.I) is not None

def ok(rail,t):
    if rail=="accessories/belts":
        return has(t,r"\b(leather belt|canvas belt|dress belt|fashion belt|men'?s belt|women'?s belt|buckle belt)\b") and not has(t,r"\b(dog|pet|leash|massage|massager|slimming|fat burning|therapy|heating|heated|abdominal|belly|thigh|fitness|sports|swim|brief|underwear|posture|support|tool|tactical|luggage|seat belt|shoe|bag)\b")
    if rail=="accessories/gloves":
        return has(t,r"\b(fashion gloves?|winter gloves?|leather gloves?|knitted gloves?|thermal gloves?|mittens?)\b") and not has(t,r"\b(oven|kitchen|pet|dog|cat|grooming|boxing|cycling|workout|medical|costume|cosplay|paw|work gloves?|safety gloves?|gardening)\b")
    if rail=="accessories/scarves":
        return has(t,r"\b(fashion scarf|winter scarf|silk scarf|neck scarf|women'?s scarf|men'?s scarf|plaid scarf|wool scarf|cashmere scarf|square scarf)\b") and not has(t,r"\b(pet|dog|cat|bag|handbag|costume|cosplay|halloween|performance|party|feather|ski mask|face cover|balaclava|heating|heated|electric|usb|dress|top|sweater|coat|cape|massager|massage)\b")
    if rail=="home/furniture":
        return has(t,r"\b(coffee table|side table|bedside table|nightstand|bookshelf|bookcase|storage cabinet|shoe cabinet|bed frame|dining chair|accent chair|rocking chair|lounge chair|bar stool|footstool|console table|sofa|couch)\b") and not has(t,r"\b(pet|dog|cat|cleaner|brush|bookend|organizer|decor|decoration|lamp|light|tray|towel|rack|legs?|feet|handle|cover|protector|mat|pad|hook|toy|tablecloth|display|opener|miniature|dollhouse|replacement|caster|wheels?|blanket)\b")
    if rail=="men/men-bags":
        return has(t,r"\b(men'?s|mens|male)\b") and has(t,r"\b(bag|backpack|briefcase|messenger|crossbody|shoulder bag|chest bag|waist bag|sling bag)\b") and not has(t,r"\b(women|woman|female|girls?|jewelry|pendant|keychain|ornament|plush|schoolgirl)\b")
    if rail=="men/men-clothing":
        return has(t,r"\b(men'?s|mens|male)\b") and has(t,r"\b(clothing set|outfit set|two[- ]piece set|jumpsuit|overall)\b") and not has(t,r"\b(women|woman|female|girls?|baby|infant|toddler|kids?|children)\b")
    if rail=="office/office-furniture":
        return has(t,r"\b(office chair|office desk|computer desk|desk chair|office table|office cabinet|filing cabinet|file cabinet|standing desk)\b") and not has(t,r"\b(hook|hanger|vase|decor|decoration|lock|handle|mat|pad|holder|stand|cushion|replacement|caster|wheels?|accessory|organizer)\b")
    if rail=="pets/pet-beds":
        return has(t,r"\b(pet bed|dog bed|cat bed|pet mattress|dog mattress|cat mattress|pet sleeping mat|dog sleeping mat|cat sleeping mat|pet nest|dog nest|cat nest|cat cave|pet cave)\b") and not has(t,r"\b(costume|clothes|clothing|wig|headgear|blanket only|cover only|car seat|booster|safety leash)\b")
    if rail=="tech/smart-home":
        return has(t,r"\b(smart (plug|socket|switch|doorbell|thermostat|curtain motor|light switch)|wifi (plug|socket|switch|doorbell)|smart door lock|zigbee (hub|gateway|door sensor|window sensor|motion sensor|water leak sensor|temperature sensor|humidity sensor)|tuya (hub|gateway|door sensor|window sensor|motion sensor|water leak sensor|temperature sensor|humidity sensor))\b") and not has(t,r"\b(bracelet|watch|camera remote|tv remote|phone remote|trash can|bin|dispenser|sterilizer|file cabinet|drawer)\b")
    if rail=="women/women-clothing":
        return has(t,r"\b(women'?s|womens|female|ladies)\b") and has(t,r"\b(clothing set|outfit set|two[- ]piece set|jumpsuit|romper|overall)\b") and not has(t,r"\b(men'?s|mens|male|girls?|kids?|baby|infant|toddler|lingerie|bra|underwear|bikini|swimsuit|sleepwear|loungewear|camisole|sheer|see[- ]?through|transparent|corset|sexy)\b")
    return False

src=json.load(open(SRC)); shelves=json.load(open(SHELVES))
existing=set()
for d in shelves.get("departments",[]):
    for c in d.get("categories",[]):
        for p in c.get("products",[]):
            existing.add((str(p.get("provider")),str(p.get("item_id"))))

rails={}; rejected=[]
for rail,rows in src.get("rails",{}).items():
    good=[]
    for x in rows:
        reasons=[]
        if not ok(rail,x.get("title") or ""): reasons.append("STRICT_PRIMARY_TYPE_FAIL")
        if (str(x.get("provider")),str(x.get("item_id"))) in existing: reasons.append("ALREADY_IN_HUNT_SOURCE")
        if x.get("provider")=="EPROLO" and not x.get("exact_variant"): reasons.append("NO_EXACT_VARIANT")
        if not x.get("image_url"): reasons.append("NO_IMAGE")
        if reasons:
            rejected.append({"rail":rail,"provider":x.get("provider"),"item_id":x.get("item_id"),"title":x.get("title"),"reasons":reasons})
            continue
        y=dict(x)
        y["placement_state"]="QA_V2_STRICT_PRIMARY_TYPE"
        y["quality_state"]="PENDING_VISUAL_QA"
        y["shipping_state"]="PENDING_DESTINATION_VERIFY"
        y["profit_state"]="PENDING_OR_PROVISIONAL"
        good.append(y)
    rails[rail]=good

summary={
 "target_rails":len(rails),
 "rails_with_shortlist":sum(bool(v) for v in rails.values()),
 "shortlisted_candidates":sum(len(v) for v in rails.values()),
 "rejected_candidates":len(rejected),
 "rails_at_good_target_12":sum(len(v)>=12 for v in rails.values()),
 "rails_still_zero":sum(len(v)==0 for v in rails.values())
}
out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QA-SHORTLIST-V2","date":"2026-09-23",
 "mode":"SHADOW_QA_SHORTLIST_ONLY","production_effect":False,"summary":summary,
 "rules":[
   "Primary product noun and target audience must be explicit.",
   "Context conflicts reject the candidate even when supplier category matches.",
   "Existing HUNT source items are excluded from new-source recovery.",
   "Shortlist is not shelf admission.",
   "Visual QA, shipping truth and profit truth remain required.",
   "No Production mutation or supplier order."
 ],
 "rails":rails,"rejected":rejected
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary))
for rail,rows in rails.items():
 print(rail,len(rows),"EP",sum(x["provider"]=="EPROLO" for x in rows),"CJ",sum(x["provider"]=="CJdropshipping" for x in rows))
 for x in rows[:4]: print(" ",x["provider"],x["item_id"],"|",x["title"][:120])
