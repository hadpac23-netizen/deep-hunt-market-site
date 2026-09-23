#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
OUT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-DEEP-DISCOVERY-2026-09-23.json"

BLOCK=re.compile(r"\b(vape|nicotine|cigarette|adult|porn|gun|firearm|ammo|weapon|knife|blade|sword|taser|pepper spray|firework|explosives?|cbd|thc|marijuana|steroid|hormone|diet pill|laxative|slimming|weight loss)\b",re.I)

def match(rail,t):
    t=t or ""
    if BLOCK.search(t): return False
    if rail=="accessories/belts":
        return bool(re.search(r"\b(leather belt|canvas belt|dress belt|fashion belt|men'?s belt|women'?s belt|waist belt|buckle belt)\b",t,re.I)
            and not re.search(r"\b(dog|pet|leash|massage|slimming|therapy|fitness|sports|posture|tool|tactical|luggage|seat belt|shoe|bag)\b",t,re.I))
    if rail=="accessories/gloves":
        return bool(re.search(r"\b(fashion gloves?|winter gloves?|leather gloves?|knitted gloves?|thermal gloves?|mittens?)\b",t,re.I)
            and not re.search(r"\b(oven|kitchen|pet|dog|cat|boxing|cycling|workout|medical|costume|cosplay|work gloves?|safety gloves?|gardening)\b",t,re.I))
    if rail=="home/furniture":
        return bool(re.search(r"\b(coffee table|side table|bedside table|nightstand|bookshelf|bookcase|storage cabinet|shoe cabinet|bed frame|dining chair|accent chair|rocking chair|lounge chair|bar stool|footstool|console table|sofa|couch)\b",t,re.I)
            and not re.search(r"\b(pet|cleaner|brush|organizer|decor|lamp|light|tray|towel|rack|legs?|feet|handle|cover|protector|mat|pad|hook|toy|tablecloth|miniature|replacement|wheels?|blanket)\b",t,re.I))
    if rail=="office/office-furniture":
        return bool(re.search(r"\b(office chair|office desk|computer desk|desk chair|office table|office cabinet|filing cabinet|file cabinet|standing desk)\b",t,re.I)
            and not re.search(r"\b(hook|hanger|vase|decor|lock|handle|mat|pad|holder|stand|cushion|replacement|caster|wheels?|accessory|organizer)\b",t,re.I))
    if rail=="tech/smart-home":
        return bool(re.search(r"\b(smart (plug|socket|switch|doorbell|thermostat|curtain motor|light switch)|wifi (plug|socket|switch|doorbell)|smart door lock|zigbee (hub|gateway|door sensor|window sensor|motion sensor|water leak sensor|temperature sensor|humidity sensor)|tuya (hub|gateway|door sensor|window sensor|motion sensor|water leak sensor|temperature sensor|humidity sensor))\b",t,re.I)
            and not re.search(r"\b(bracelet|watch|remote|trash can|bin|dispenser|sterilizer|file cabinet|drawer)\b",t,re.I))
    if rail=="men/men-clothing":
        return bool(re.search(r"\b(men'?s|mens|male)\b",t,re.I)
            and re.search(r"\b(clothing set|outfit set|two[- ]piece set|jumpsuit|overall|matching set|polo.{0,20}shorts set|shirt.{0,20}shorts set)\b",t,re.I)
            and not re.search(r"\b(women|female|girls?|baby|infant|toddler|kids?|children)\b",t,re.I))
    return False

RAILS=["accessories/belts","accessories/gloves","home/furniture","office/office-furniture","tech/smart-home","men/men-clothing"]
# Deep pages beyond Stage8 Wave A; top categories only, since exact leafs are too narrow/missing for these rails.
JOBS=[]
for parent,label in [(24,"fashion"),(15,"home"),(13,"tech")]:
    for page in range(31,91): JOBS.append((parent,label,page))

def n(v,d=0):
    try:return float(v)
    except:return d

def best_variant(row):
    opts=[]
    for v in row.get("variantlist") or []:
        vid=str(v.get("id") or "")
        c=n(v.get("cost"),-1); stock=max(0,int(n(v.get("inventory_quantity"),0)))
        if vid and c>0 and stock>0: opts.append((c,-stock,vid,v))
    if not opts:return None
    opts.sort(key=lambda z:(z[0],z[1]))
    c,neg,vid,v=opts[0]
    return {"id":vid,"sku":v.get("sku"),"title":v.get("title"),"supplier_cost_usd":round(c,2),"inventory_quantity":-neg,"weight_g":v.get("weight")}

def fetch(job):
    parent,label,page=job
    try:
        _,b=api.signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeId":parent})
        return job,b.get("data") or [],None
    except Exception as e:return job,[],type(e).__name__

pools={r:{} for r in RAILS}; errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for job,rows,err in (f.result() for f in concurrent.futures.as_completed([ex.submit(fetch,j) for j in JOBS])):
        if err: errors.append({"job":job,"error":err});continue
        for row in rows:
            title=str(row.get("title") or "").strip()
            pid=str(row.get("id") or "")
            image=row.get("imagefirst")
            var=best_variant(row)
            if not pid or not image or not var: continue
            stock=sum(max(0,int(n(v.get("inventory_quantity"),0))) for v in row.get("variantlist") or [])
            for rail in RAILS:
                if match(rail,title):
                    pools[rail][pid]={
                      "provider":"EPROLO","item_id":pid,"rail":rail,"title":title,"image_url":image,
                      "supplier_cost_min":var["supplier_cost_usd"],"currency":"USD","exact_variant":var,
                      "inventory_snapshot":stock,"availability_verified":True,
                      "availability_basis":"FRESH_EPROLO_OFFICIAL_API_STAGE8_DEEP",
                      "production_effect":False
                    }

rails={}
for rail,m in pools.items():
    rows=list(m.values())
    rows.sort(key=lambda x:(x["supplier_cost_min"],-x["inventory_snapshot"]))
    rails[rail]=rows[:60]

out={
 "version":"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-DEEP-DISCOVERY-V1","date":"2026-09-23",
 "mode":"READ_ONLY_SUPPLIER_DISCOVERY","production_effect":False,
 "summary":{
  "target_rails":len(RAILS),"rails_with_candidates":sum(bool(v) for v in rails.values()),
  "total_candidates":sum(len(v) for v in rails.values()),"api_errors":len(errors)
 },
 "rules":[
  "Official EPROLO API only.",
  "Deep pages 31-90 only; earlier pages were already covered by Wave A.",
  "Strict primary product-type title match required.",
  "Candidate is not shelf admission.",
  "No Production mutation or supplier order."
 ],
 "rails":rails,"errors":errors
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out["summary"]))
for rail,rows in rails.items():
 print(rail,len(rows))
 for x in rows[:5]:print(" ",x["item_id"],"|",x["title"][:120])
