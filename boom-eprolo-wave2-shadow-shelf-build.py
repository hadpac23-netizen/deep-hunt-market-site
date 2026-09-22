#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
scan=json.loads((ROOT/"evidence/HUNT-EPROLO-WAVE2-IL-SCAN-2026-09-22.json").read_text())
visual=json.loads((ROOT/"evidence/HUNT-EPROLO-WAVE2-VISUAL-QA-2026-09-22.json").read_text())
by={str(x["product_id"]):x for x in scan["results"]}
passes={str(x["product_id"]):x for x in visual["passes"]}
products=[]
for pid,vq in passes.items():
    x=by[pid]
    if x["status"]!="SHIPPING_VERIFIED_PRICE_SHADOW": raise SystemExit("truth blocked "+pid)
    if x["commercial_training_flag"]!="NORMAL_SHIPPING_BURDEN": raise SystemExit("shipping blocked "+pid)
    ship=float(x["shipping_il"]["cost_usd"])
    retail=float(x["price_gate_shadow"]["retail_usd"])
    products.append({
      "provider":"EPROLO","product_id":pid,"department":x["department"],"category":x["category"],
      "supplier_title":x["title"],"variant_id":x["variant"]["id"],"variant_title":x["variant"]["title"],
      "stock_verified":True,"stock_available":x["variant"]["inventory_quantity"]>0,"inventory_quantity":x["variant"]["inventory_quantity"],
      "supplier_cost_usd":x["variant"]["supplier_cost_usd"],"shipping_il":x["shipping_il"],
      "shipping_to_retail_ratio":x["shipping_to_retail_ratio"],"retail_price_shadow_usd":retail,
      "customer_shipping_grossup_shadow_usd":round(ship/.91,2),
      "customer_total_shadow_usd":round(retail+ship/.91,2),
      "projected_product_profit_shadow_usd":x["price_gate_shadow"]["projected_product_profit_usd"],
      "projected_product_margin_shadow":x["price_gate_shadow"]["projected_product_margin"],
      "exact_variant_image_url":x["exact_variant_image_url"],"image_scope":x["image_scope"],
      "visual_status":vq["status"],"seasonal":vq["status"].endswith("SEASONAL"),
      "final_profit_verified":False,"production_exposure":False,"checkout":"DISABLED","fulfillment":"DISABLED"
    })
out={
 "version":"HUNT-EPROLO-WAVE2-SHADOW-SHELF-V1","date":"2026-09-22","mode":"SHADOW_CANDIDATE_SHELF",
 "market":"IL","provider":"EPROLO","production_effect":False,
 "summary":{"products":len(products),"pets":sum(1 for x in products if x["department"]=="pets"),"home":sum(1 for x in products if x["department"]=="home"),"stock_verified":len(products),"shipping_verified_il":len(products),"exact_variant_images":len(products),"final_profit_verified":0,"checkout_live":0,"fulfillment_live":0},
 "products":products,
 "hard_rules":["No Production exposure.","No live checkout.","No fulfillment.","Final profit blocked until order-cost method verification.","Seasonal products cannot become evergreen Hero automatically.","Owner Gate required."]
}
(ROOT/"evidence/HUNT-EPROLO-WAVE2-SHADOW-SHELF-2026-09-22.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"summary":out["summary"],"products":[{"id":x["product_id"],"variant":x["variant_title"],"total":x["customer_total_shadow_usd"],"seasonal":x["seasonal"]} for x in products]},ensure_ascii=False,indent=2))
