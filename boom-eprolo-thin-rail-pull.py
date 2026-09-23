#!/usr/bin/env python3
import concurrent.futures, importlib.util, json, math, re, time
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SOURCE=Path("/Users/adichehade/.hunt-final-candidate-v1")
spec=importlib.util.spec_from_file_location("eprolo_smoke",SOURCE/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)

BLOCK=re.compile(r"\b(vape|vaping|cigarette|nicotine|adult\s*toy|erotic|porn|gun|firearm|ammo|ammunition|weapon|knife|blade|sword|machete|taser|pepper spray|firework|explosive|cbd|thc|marijuana|steroid|hormone|diet\s*pill|laxative|fat\s*burner|weight\s*loss|camp stove|gas stove|fuel canister|lighter|torch burner)\b",re.I)

TOPS={11:"jewelry",20:"bags",15:"home",21:"kids",26:"sports",13:"tech",19:"beauty"}
PAGES=range(1,16)
LEAFS={
  128:"pets",1214:"pets",1233:"pets",1234:"pets",
  163:"office",126:"office",1194:"office",
  100:"toys",1176:"toys"
}
ROUTES=[
 ("accessories","jewelry-necklaces",re.compile(r"\b(necklace|necklaces|pendant necklace)\b",re.I),{"jewelry"}),
 ("accessories","jewelry-rings",re.compile(r"\b(ring|rings)\b",re.I),{"jewelry"}),
 ("accessories","jewelry-earrings",re.compile(r"\b(earring|earrings)\b",re.I),{"jewelry"}),
 ("accessories","jewelry-bracelets",re.compile(r"\b(bracelet|bracelets|bangle|bangles)\b",re.I),{"jewelry"}),
 ("accessories","jewelry",re.compile(r"\b(jewelry set|jewellery set|jewelry|jewellery)\b",re.I),{"jewelry"}),
 ("accessories","watches",re.compile(r"\b(watch|watches|wristwatch)\b",re.I),{"jewelry"}),
 ("accessories","bags",re.compile(r"\b(handbag|shoulder bag|crossbody bag|backpack|tote bag|purse)\b",re.I),{"bags"}),
 ("accessories","bag-accessories",re.compile(r"\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap)\b",re.I),{"bags"}),
 ("accessories","hats",re.compile(r"\b(hat|cap|beanie|beret|bucket hat|baseball cap)\b",re.I),{"bags","jewelry"}),
 ("accessories","belts",re.compile(r"\b(belt|belts)\b",re.I),{"bags"}),
 ("accessories","scarves",re.compile(r"\b(scarf|scarves|shawl|wrap)\b",re.I),{"bags"}),
 ("accessories","gloves",re.compile(r"\b(glove|gloves|mitten|mittens)\b",re.I),{"bags"}),
 ("accessories","hair-accessories",re.compile(r"\b(hair clip|hair band|hair pin|hair claw|hair tie|scrunchie|headband|barrette)\b",re.I),{"jewelry","bags"}),
 ("accessories","socks",re.compile(r"\b(sock|socks|stocking|stockings)\b",re.I),{"bags"}),

 ("home","bath",re.compile(r"\b(bath mat|bathroom|shower curtain|soap dish|towel rack|bath caddy|bath towel)\b",re.I),{"home"}),
 ("home","bedding",re.compile(r"\b(bed sheet|duvet|quilt|pillow|bedding|mattress cover|bed cover)\b",re.I),{"home"}),
 ("home","cleaning",re.compile(r"\b(cleaning|mop|duster|scrubber|dustpan|broom|squeegee)\b",re.I),{"home"}),
 ("home","curtains",re.compile(r"\b(curtain|curtains|window blind|drape|drapes)\b",re.I),{"home"}),
 ("home","home-storage",re.compile(r"\b(storage box|storage basket|storage bag|storage rack|organizer|drawer organizer)\b",re.I),{"home"}),
 ("home","laundry",re.compile(r"\b(laundry|hamper|clothes drying|drying rack|ironing|clothes hanger)\b",re.I),{"home"}),
 ("home","lighting",re.compile(r"\b(lamp|lighting|night light|led light|table light|wall light|ceiling light)\b",re.I),{"home"}),
 ("home","mirrors",re.compile(r"\b(mirror|mirrors)\b",re.I),{"home"}),
 ("home","rugs",re.compile(r"\b(rug|rugs|carpet|floor mat|doormat)\b",re.I),{"home"}),
 ("home","wall-decor",re.compile(r"\b(wall art|wall decor|wall clock|wall sticker|wall shelf|poster)\b",re.I),{"home"}),
 ("home","entryway",re.compile(r"\b(entryway|coat rack|shoe rack|hallway storage|console table)\b",re.I),{"home"}),

 ("kids","baby-clothing",re.compile(r"\b(baby|newborn|infant).{0,35}\b(romper|onesie|bodysuit|clothes|clothing|outfit|pants|shirt|dress|jumpsuit)\b",re.I),{"kids"}),
 ("toys","building-toys",re.compile(r"\b(building blocks|construction blocks|brick set|building toy|construction toy)\b",re.I),{"kids","toys"}),

 ("sports","sports-gear",re.compile(r"\b(basketball|football|soccer|tennis|badminton|volleyball|sports gear|training gear)\b",re.I),{"sports"}),
 ("sports","fitness-accessories",re.compile(r"\b(resistance band|yoga mat|fitness band|workout band|gym accessory|fitness accessory|exercise band)\b",re.I),{"sports"}),
 ("sports","active-bottoms",re.compile(r"\b(yoga pants|sports shorts|gym shorts|running pants|training pants|workout leggings)\b",re.I),{"sports"}),
 ("sports","outdoors",re.compile(r"\b(hiking|trekking|outdoor training|outdoor sport|climbing accessory)\b",re.I),{"sports"}),

 ("tech","gaming",re.compile(r"\b(gaming|gamepad|game controller|gaming mouse|gaming keyboard|controller)\b",re.I),{"tech"}),
 ("tech","phone-cases",re.compile(r"\b(phone case|iphone case|galaxy case|smartphone case|mobile phone case)\b",re.I),{"tech"}),
 ("tech","wearable-accessories",re.compile(r"\b(watch band|watch strap|smartwatch band|smart watch band|wearable strap)\b",re.I),{"tech"}),

 ("beauty","nails",re.compile(r"\b(nail art|nail polish|nail tips|nail sticker|manicure|press[- ]?on nails|fake nails)\b",re.I),{"beauty"}),

 ("pets","aquarium",re.compile(r"\b(aquarium|fish tank|aquatic|fish filter|fish feeder)\b",re.I),{"pets"}),
 ("pets","pet-clothing",re.compile(r"\b(pet clothes|pet clothing|dog clothes|dog coat|dog shirt|cat clothes|cat clothing|pet hoodie|dog hoodie)\b",re.I),{"pets"}),
 ("pets","pet-houses",re.compile(r"\b(pet house|dog house|cat house|pet bed|dog bed|cat bed|pet condo|cat condo)\b",re.I),{"pets"}),
 ("pets","pet-grooming",re.compile(r"\b(pet grooming|dog grooming|cat grooming|pet brush|dog brush|cat brush|deshedding|pet nail clipper)\b",re.I),{"pets"}),

 ("office","crafts",re.compile(r"\b(craft|crafts|diy|embroidery|knitting|crochet|beading|scrapbook|sewing|stamp punch)\b",re.I),{"office"}),
 ("office","stickers",re.compile(r"\b(sticker|stickers|decal|decals)\b",re.I),{"office"}),
 ("office","office-storage",re.compile(r"\b(desk organizer|file organizer|document holder|pen holder|office storage|desktop storage)\b",re.I),{"office"}),
 ("office","stationery",re.compile(r"\b(notebook|pen|pencil|marker|eraser|stationery|sticky note|paper clip|sketch book)\b",re.I),{"office"}),

 ("garden","garden-lighting",re.compile(r"\b(garden light|solar garden light|outdoor garden light|landscape light)\b",re.I),{"home"}),
 ("garden","garden-tools",re.compile(r"\b(garden tool|gardening tool|planting shovel|garden rake|watering tool|plant tool)\b",re.I),{"home"}),
]

def num(v,d=0):
    try:return float(v)
    except:return d

def best_variant(row):
    arr=[]
    for v in row.get("variantlist") or []:
        vid=str(v.get("id") or v.get("variantsid") or v.get("variantId") or "")
        cost=num(v.get("cost"),-1); stock=max(0,int(num(v.get("inventory_quantity"),0)))
        if vid and cost>0 and stock>0:arr.append((cost,-stock,vid,v))
    arr.sort(key=lambda x:(x[0],x[1]))
    if not arr:return None
    cost,negstock,vid,v=arr[0]
    return {"id":vid,"title":v.get("title"),"sku":v.get("sku"),"supplier_cost_usd":round(cost,2),"inventory_quantity":-negstock,"weight_g":v.get("weight")}

def summarize(source,locator,row):
    title=str(row.get("title") or "").strip()
    if not title or BLOCK.search(title):return []
    image=row.get("imagefirst") or next((x.get("src") for x in row.get("imagelist") or [] if x.get("src")),None)
    variant=best_variant(row)
    if not image or not variant:return []
    pid=str(row.get("product_id") or row.get("id") or "")
    if not pid:return []
    out=[]
    for dep,cat,rx,sources in ROUTES:
        if source not in sources or not rx.search(title):continue
        out.append({
          "provider":"EPROLO","item_id":pid,"department":dep,"category":cat,
          "title":title,"image_url":image,"availability_verified":True,
          "availability_basis":"FRESH_EPROLO_OFFICIAL_API_THIN_RAIL_PULL",
          "inventory_snapshot":sum(max(0,int(num(v.get("inventory_quantity"),0))) for v in row.get("variantlist") or []),
          "supplier_cost_min":variant["supplier_cost_usd"],"currency":"USD",
          "variant_count":len(row.get("variantlist") or []),"image_count":len(row.get("imagelist") or []),
          "exact_variant":variant,"source_locator":locator,
          "checkout_status":"DISABLED_DESTINATION_SHIPPING_RECHECK_REQUIRED","production_exposure":False
        })
    return out

def fetch_top(job):
    top,label,page=job
    try:
        _,b=api.signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeId":top})
        return label,{"type":"top","id":top,"page":page},b.get("data") or [],None
    except Exception as exc:return label,{"type":"top","id":top,"page":page},[],type(exc).__name__

def fetch_leaf(job):
    cid,label=job
    try:
        _,b=api.signed_get("eprolo_product_list.html",{"page":1,"page_size":200,"wareTypeTwoId":cid})
        return label,{"type":"leaf","id":cid,"page":1},b.get("data") or [],None
    except Exception as exc:return label,{"type":"leaf","id":cid,"page":1},[],type(exc).__name__

def main():
    jobs=[(top,label,p) for top,label in TOPS.items() for p in PAGES]
    leafjobs=[(cid,label) for cid,label in LEAFS.items()]
    pools={};errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futures=[ex.submit(fetch_top,j) for j in jobs]+[ex.submit(fetch_leaf,j) for j in leafjobs]
        for fut in concurrent.futures.as_completed(futures):
            source,locator,rows,err=fut.result()
            if err:errors.append({"source":source,"locator":locator,"error":err});continue
            for row in rows:
                for rec in summarize(source,locator,row):
                    key=rec["department"]+"/"+rec["category"]
                    pools.setdefault(key,{})[rec["provider"]+":"+rec["item_id"]]=rec
    rails={}
    for key,items in pools.items():
        rows=list(items.values())
        rows.sort(key=lambda x:(x["supplier_cost_min"],-x["inventory_snapshot"],x["title"]))
        rails[key]=rows[:60]
    out={
      "version":"HUNT-EPROLO-THIN-RAIL-PULL-V1","date":"2026-09-23","mode":"READ_ONLY_SHADOW",
      "production_effect":False,"provider":"EPROLO",
      "summary":{"rails_with_candidates":len(rails),"unique_candidates":len({x["provider"]+":"+x["item_id"] for rows in rails.values() for x in rows}),"errors":len(errors)},
      "rails":rails,"errors":errors,
      "rules":["Official EPROLO read-only API only","Exact in-stock variant selected from fresh row","Strict title-to-canonical-rail routing","Restricted/dangerous terms blocked","No order, checkout, payment, fulfillment or Production mutation"]
    }
    (ROOT/"evidence/HUNT-EPROLO-THIN-RAIL-PULL-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(out["summary"]))
    for k,v in sorted(rails.items()):print(k,len(v))
if __name__=="__main__":main()
