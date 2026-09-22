#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
truth=json.loads((ROOT/"evidence/HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2-2026-09-22.json").read_text())
visual=json.loads((ROOT/"evidence/HUNT-EPROLO-WOMEN-DRESSES-VISUAL-QA-2026-09-22.json").read_text())
truth_by={str(x.get("product_id")):x for x in truth.get("results",[])}
passes={str(x.get("product_id")):x for x in visual.get("passes",[])}
products=[]
for pid,vq in passes.items():
    t=truth_by.get(pid)
    if not t: raise SystemExit("missing truth "+pid)
    if t.get("status")!="SHIPPING_VERIFIED_PRICE_SHADOW": raise SystemExit("truth blocked "+pid)
    if t.get("commercial_training_flag")!="NORMAL_SHIPPING_BURDEN": raise SystemExit("shipping burden "+pid)
    ship=float(t["shipping_il"]["cost_usd"])
    retail=float(t["price_gate_shadow"]["retail_usd"])
    supplier=float(t["variant"]["supplier_cost_usd"])
    gross_ship=round(ship/.91,2)
    products.append({
      "provider":"EPROLO",
      "product_id":pid,
      "department":"women",
      "category":"women-dresses",
      "supplier_title":t["title"],
      "variant_id":t["variant"]["id"],
      "variant_title":t["variant"]["title"],
      "variant_scope":t["variant_scope"],
      "stock_verified":True,
      "stock_available":int(t["variant"]["inventory_quantity"])>0,
      "inventory_quantity":int(t["variant"]["inventory_quantity"]),
      "supplier_cost_usd":supplier,
      "shipping_il":t["shipping_il"],
      "shipping_to_retail_ratio":t["shipping_to_retail_ratio"],
      "retail_price_shadow_usd":retail,
      "customer_shipping_grossup_shadow_usd":gross_ship,
      "customer_total_shadow_usd":round(retail+gross_ship,2),
      "projected_product_profit_shadow_usd":t["price_gate_shadow"]["projected_product_profit_usd"],
      "projected_product_margin_shadow":t["price_gate_shadow"]["projected_product_margin"],
      "exact_variant_image_url":vq["exact_variant_image_url"],
      "visual_status":vq["status"],
      "brand_rights_gate":"NO_VISIBLE_OR_TITLE_MARK_FLAGGED_IN_THIS_PASS",
      "product_detail_gate":"FRESH_GLOBAL_CATALOG_VARIANT_TRUTH",
      "final_profit_verified":False,
      "final_profit_blocker":"EPROLO_ORDER_COST_METHOD_NOT_YET_VERIFIED",
      "production_exposure":False,
      "checkout":"DISABLED",
      "fulfillment":"DISABLED"
    })
out={
 "version":"HUNT-EPROLO-WOMEN-SHADOW-SHELF-V1",
 "date":"2026-09-22",
 "mode":"SHADOW_CANDIDATE_SHELF",
 "market":"IL",
 "provider":"EPROLO",
 "production_effect":False,
 "summary":{
   "products":len(products),
   "exact_variant_images":sum(1 for x in products if x.get("exact_variant_image_url")),
   "stock_verified":sum(1 for x in products if x.get("stock_verified") and x.get("stock_available")),
   "shipping_verified_il":len(products),
   "price_gate_shadow":len(products),
   "final_profit_verified":0,
   "checkout_live":0,
   "fulfillment_live":0
 },
 "products":products,
 "hard_rules":[
   "Shadow shelf only.",
   "Exact variant image required.",
   "Full-set listings must use full-set variants.",
   "No branded/rights-review hold may enter this shelf.",
   "No live checkout or fulfillment.",
   "No Production price or shelf mutation.",
   "Owner Gate remains required."
 ]
}
(ROOT/"evidence/HUNT-EPROLO-WOMEN-SHADOW-SHELF-2026-09-22.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"summary":out["summary"],"products":[{"id":x["product_id"],"variant":x["variant_title"],"cost":x["supplier_cost_usd"],"ship":x["shipping_il"]["cost_usd"],"retail":x["retail_price_shadow_usd"],"total":x["customer_total_shadow_usd"],"visual":x["visual_status"]} for x in products]},ensure_ascii=False,indent=2))
