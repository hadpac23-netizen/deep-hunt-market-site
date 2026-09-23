#!/usr/bin/env python3
import hashlib,json,time,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SECRET_FILE=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
AUDIT=ROOT/"evidence/HUNT-PRODUCT-PLACEMENT-GATE-AUDIT-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json"
PARTIAL=ROOT/"evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-PARTIAL-2026-09-23.json"

# Conservative only: supplier categories already observed as one-to-one with one HUNT canonical rail.
# Ambiguous IDs (41,43,45,46,63,110,112,127, etc.) are intentionally excluded.
RAIL_TO_SUPPLIER_CATEGORIES={
  "women/women-dresses":[1241],
  "women/women-shoes":[64],
  "men/men-tops":[1221,1256],
  "men/men-bottoms":[1230],
  "tech/phone-cases":[36],
  "tech/phone-accessories":[122],
  "home/lighting":[109],
  "kitchen/kitchen-tools":[115],
  "pets/pet-accessories":[1234],
 "kids/kids-clothing":[165]
}
MAX_PAGES=6
PAGE_SIZE=200
REQUEST_TIMEOUT=8
MAX_RETRIES=2

def creds():
    vals={}
    for raw in SECRET_FILE.read_text(errors="ignore").splitlines():
        line=raw.strip()
        if not line or line.startswith("#"):continue
        if "=" in line:k,v=line.split("=",1)
        elif ":" in line:k,v=line.split(":",1)
        else:continue
        vals[k.strip()]=v.strip()
    key=vals.get("EPROLO_API_KEY") or vals.get("openApiKey")
    secret=vals.get("EPROLO_API_SECRET") or vals.get("openApiSecret")
    if not key or not secret:raise RuntimeError("EPROLO_CREDENTIALS_MISSING")
    return key,secret

KEY,SECRET=creds()

def signed_get(path,params=None):
    last=None
    for attempt in range(1,MAX_RETRIES+1):
        try:
            ts=str(int(time.time()*1000))
            sign=hashlib.md5((KEY+ts+SECRET).encode()).hexdigest()
            q=dict(params or {});q["sign"]=sign;q["timestamp"]=ts
            url=BASE+path+"?"+urllib.parse.urlencode(q)
            req=urllib.request.Request(url,headers={
              "apiKey":KEY,"ContentType":"application/json","Accept":"application/json",
              "User-Agent":"HUNT-DEAL-PLACEMENT-TAXONOMY/1.1"
            })
            with urllib.request.urlopen(req,timeout=REQUEST_TIMEOUT) as resp:
                return resp.status,json.loads(resp.read().decode("utf-8","replace"))
        except Exception as e:
            last=repr(e)
            if attempt<MAX_RETRIES:time.sleep(1.0*attempt)
    return None,{"code":"LOCAL_ERROR","message":last}

audit=json.load(open(AUDIT))
unknown=[x for x in audit.get("unknown_queue",[]) if x.get("provider")=="EPROLO"]
targets={}
for x in unknown:
    rail=x["current_department"]+"/"+x["current_category"]
    if rail not in RAIL_TO_SUPPLIER_CATEGORIES:continue
    targets.setdefault(rail,{})[str(x["item_id"])]=x.get("title")

cat_to_rails={}
for rail,cids in RAIL_TO_SUPPLIER_CATEGORIES.items():
    for cid in cids:cat_to_rails.setdefault(cid,set()).add(rail)

state={
 "version":"HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-V1.1",
 "date":"2026-09-23","mode":"READ_ONLY_SHADOW","production_effect":False,
 "source":"Official signed EPROLO product-list API",
 "mapping_basis":"Only one-to-one supplier category mappings already proven by prior HUNT official EPROLO scans.",
 "rail_mapping":RAIL_TO_SUPPLIER_CATEGORIES,
 "scan_meta":{},"verified":[],
 "rules":[
   "Supplier taxonomy may support KEEP only for an existing rail.",
   "Supplier taxonomy never creates automatic MOVE in this stage.",
   "Current HUNT category is not evidence.",
   "Product ID must be observed in the mapped official EPROLO supplier category.",
   "Not found or API error remains UNKNOWN.",
   "No Production/order/payment/checkout/fulfillment mutation."
 ]
}

def checkpoint():
    verified_keys={(x["item_id"],x["current_rail"]) for x in state["verified"]}
    target_total=sum(len(v) for v in targets.values())
    state["summary"]={
      "unknown_eprolo_total":len(unknown),
      "mapped_unknown_targets":target_total,
      "supplier_categories_scanned":len(state["scan_meta"]),
      "taxonomy_verified_keep_support":len(verified_keys),
      "remaining_mapped_unknown":max(0,target_total-len(verified_keys)),
      "api_error_categories":sum(1 for x in state["scan_meta"].values() if x["stop_reason"]=="API_ERROR")
    }
    PARTIAL.write_text(json.dumps(state,ensure_ascii=False,indent=2)+"\n")

seen_verified=set()
for cid,rails in sorted(cat_to_rails.items()):
    wanted={}
    for rail in rails:
        for pid,title in targets.get(rail,{}).items():wanted[pid]=(rail,title)
    if not wanted:continue
    matched={}
    pages=0;rows_seen=0;stop_reason="MAX_PAGES";error=None
    for page in range(1,MAX_PAGES+1):
        st,b=signed_get("eprolo_product_list.html",{"page":page,"page_size":PAGE_SIZE,"wareTypeTwoId":cid})
        pages+=1
        if st!=200 or str((b or {}).get("code"))!="0":
            stop_reason="API_ERROR";error={"http":st,"code":(b or {}).get("code"),"message":(b or {}).get("message")};break
        rows=(b or {}).get("data") or []
        rows_seen+=len(rows)
        for row in rows:
            pid=str(row.get("product_id") or row.get("id") or "")
            if pid in wanted:
                matched[pid]=row
        if len(matched)>=len(wanted):
            stop_reason="ALL_TARGETS_FOUND";break
        if len(rows)<PAGE_SIZE:
            stop_reason="END_OF_CATEGORY";break
        time.sleep(.12)

    state["scan_meta"][str(cid)]={
      "rails":sorted(rails),"wanted":len(wanted),"found":len(matched),
      "pages":pages,"rows_seen":rows_seen,"stop_reason":stop_reason,"error":error
    }
    for pid,row in matched.items():
        rail,title=wanted[pid]
        key=(pid,rail)
        if key in seen_verified:continue
        seen_verified.add(key)
        state["verified"].append({
          "provider":"EPROLO","item_id":pid,"current_rail":rail,
          "supplier_category_id":cid,
          "supplier_title":str(row.get("title") or ""),
          "shelf_title":title,
          "state":"SUPPLIER_TAXONOMY_VERIFIED_CURRENT_RAIL",
          "placement_effect":"KEEP_SUPPORT_ONLY",
          "confidence":0.92,
          "production_effect":False
        })
    checkpoint()
    print("CATEGORY",cid,"wanted",len(wanted),"found",len(matched),"pages",pages,"stop",stop_reason,flush=True)
    time.sleep(.8)

checkpoint()
OUT.write_text(json.dumps(state,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(state["summary"]),flush=True)
