#!/usr/bin/env python3
import json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
scan=json.loads((ROOT/"evidence/HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2-2026-09-22.json").read_text())
visual=json.loads((ROOT/"evidence/HUNT-EPROLO-WOMEN-EXACT-VISUAL-MAP-2026-09-22.json").read_text())
qa=json.loads((ROOT/"evidence/HUNT-EPROLO-WOMEN-VISUAL-QA-2026-09-22.json").read_text())

scan_by={str(x.get("product_id")):x for x in scan.get("results",[])}
vis_by={str(x.get("product_id")):x for x in visual.get("items",[])}
status_by={str(x.get("product_id")):x for x in qa.get("items",[])}

def neutral_title(title):
    s=str(title or "")
    remove=[
      r"\bslim\b",r"\bskinny\b",r"\bchic\b",r"\belegant\b",
      r"\bfashion\b",r"\bvintage\b",r"\bnew\b",r"\bsexy\b"
    ]
    for pat in remove: s=re.sub(pat,"",s,flags=re.I)
    s=re.sub(r"\s+"," ",s).strip(" -")
    return s[:110]

products=[]
for pid,gate in status_by.items():
    if gate.get("status")!="PASS_SHADOW_SHELF": continue
    s=scan_by.get(pid) or {}
    v=vis_by.get(pid) or {}
    products.append({
      "provider":"EPROLO",
      "product_id":pid,
      "department":"women",
      "category":"women-dresses",
      "display_title":neutral_title(s.get("title")),
      "source_title":s.get("title"),
      "variant_id":(s.get("variant") or {}).get("id"),
      "variant_title":(s.get("variant") or {}).get("title"),
      "variant_scope":s.get("variant_scope"),
      "inventory_quantity":(s.get("variant") or {}).get("inventory_quantity"),
      "supplier_cost_usd":(s.get("variant") or {}).get("supplier_cost_usd"),
      "shipping_il":s.get("shipping_il"),
      "retail_shadow_usd":(s.get("price_gate_shadow") or {}).get("retail_usd"),
      "projected_product_profit_shadow_usd":(s.get("price_gate_shadow") or {}).get("projected_product_profit_usd"),
      "shipping_to_retail_ratio":s.get("shipping_to_retail_ratio"),
      "exact_variant_image_url":v.get("exact_variant_image_url"),
      "visual_truth_state":"VISUAL_QA_PASS_EXACT_VARIANT",
      "product_truth_state":"SHIPPING_VERIFIED_PRICE_SHADOW",
      "final_profit_verified":False,
      "checkout":"DISABLED",
      "fulfillment":"DISABLED",
      "production_exposure":False
    })

out={
 "version":"HUNT-EPROLO-WOMEN-SHADOW-SHELF-V1",
 "date":"2026-09-22",
 "mode":"SHADOW_ONLY",
 "destination":"IL",
 "production_effect":False,
 "summary":{
   "shadow_candidates":len(products),
   "exact_variant_visual_pass":len(products),
   "live_shipping_verified":len(products),
   "final_profit_verified":0,
   "production_exposure":0,
   "checkout_live":0
 },
 "products":products,
 "hard_blocks":[
   "No Production shelf exposure.",
   "No checkout activation.",
   "No fulfillment.",
   "No final profit claim until EPROLO order-cost API is verified.",
   "No product with broken imagery, visible third-party branding, or unresolved authenticity/rights review."
 ]
}
(ROOT/"evidence/HUNT-EPROLO-WOMEN-SHADOW-SHELF-2026-09-22.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"summary":out["summary"],"products":[{"id":x["product_id"],"variant":x["variant_title"],"cost":x["supplier_cost_usd"],"ship":x["shipping_il"]["cost_usd"],"retail":x["retail_shadow_usd"],"title":x["display_title"]} for x in products]},ensure_ascii=False,indent=2))
