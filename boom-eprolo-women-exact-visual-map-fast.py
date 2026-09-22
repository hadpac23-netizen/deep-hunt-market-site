#!/usr/bin/env python3
import importlib.util, json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
HUNT=Path("/Users/adichehade/.hunt-final-candidate-v1")
scan=json.loads((ROOT/"evidence/HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2-2026-09-22.json").read_text())

spec=importlib.util.spec_from_file_location("api",HUNT/"scripts/hunt-eprolo-smoke.py")
api=importlib.util.module_from_spec(spec); spec.loader.exec_module(api)

rows=[]
for page in range(1,5):
    st,body=api.signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeTwoId":1241})
    if st!=200 or str(body.get("code"))!="0": break
    data=body.get("data") or []
    rows.extend(data)
    if len(data)<200: break

catalog={str(x.get("product_id") or x.get("id")):x for x in rows}
out=[]
for item in scan.get("results",[]):
    if item.get("commercial_training_flag")!="NORMAL_SHIPPING_BURDEN": continue
    pid=str(item.get("product_id"))
    vid=str((item.get("variant") or {}).get("id") or "")
    row=catalog.get(pid) or {}
    variant=next((v for v in row.get("variantlist") or [] if str(v.get("id") or v.get("variantsid") or v.get("variantId") or "")==vid),{})
    image_id=str(variant.get("imagesid") or "")
    exact=next((x for x in row.get("imagelist") or [] if str(x.get("id") or "")==image_id),None)
    exact_url=(exact or {}).get("src")
    fallback=row.get("imagefirst")
    out.append({
      "product_id":pid,
      "title":item.get("title"),
      "variant_id":vid,
      "variant_title":(item.get("variant") or {}).get("title"),
      "variant_imagesid":image_id or None,
      "exact_variant_image_url":exact_url,
      "fallback_image_url":fallback,
      "visual_truth_state":"EXACT_VARIANT_URL_PRESENT" if exact_url else "NO_EXACT_VARIANT_URL",
      "cost_usd":(item.get("variant") or {}).get("supplier_cost_usd"),
      "shipping_il_usd":(item.get("shipping_il") or {}).get("cost_usd"),
      "retail_shadow_usd":(item.get("price_gate_shadow") or {}).get("retail_usd"),
      "shipping_to_retail_ratio":item.get("shipping_to_retail_ratio")
    })

evidence={
 "version":"HUNT-EPROLO-WOMEN-EXACT-VISUAL-MAP-FAST-V1",
 "date":"2026-09-22",
 "mode":"READ_ONLY_VISUAL_TRUTH",
 "production_effect":False,
 "summary":{
   "checked":len(out),
   "exact_variant_url_present":sum(1 for x in out if x["exact_variant_image_url"]),
   "missing_exact_variant_url":sum(1 for x in out if not x["exact_variant_image_url"])
 },
 "items":out
}
(ROOT/"evidence/HUNT-EPROLO-WOMEN-EXACT-VISUAL-MAP-2026-09-22.json").write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(evidence["summary"],ensure_ascii=False,indent=2))
for x in out:
    print(json.dumps({"id":x["product_id"],"variant":x["variant_title"],"exact":bool(x["exact_variant_image_url"]),"url":x["exact_variant_image_url"]},ensure_ascii=False))
