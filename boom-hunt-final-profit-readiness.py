#!/usr/bin/env python3
import json
from collections import Counter,defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parent
IN=ROOT/"evidence/HUNT-FINAL-PROFIT-TRUTH-709-2026-09-23.json"
OUT=ROOT/"evidence/HUNT-FINAL-PROFIT-READINESS-709-2026-09-23.json"

ledger=json.load(open(IN))

PRELAUNCH_POLICY={
  "TAX_IMPORT_TREATMENT_NOT_VERIFIED":{
    "lane":"PRELAUNCH_POLICY_TRUTH",
    "close_with":"verified destination tax/import treatment or landed-cost responsibility policy per market",
    "realized_order_required":False
  },
  "DISCOUNT_COST_NOT_REALIZED":{
    "lane":"PRELAUNCH_POLICY_PLUS_ORDER_TRUTH",
    "close_with":"discount policy may be fixed before launch; realized order must record actual discount applied",
    "realized_order_required":True
  },
  "MARKETING_COST_PER_ORDER_NOT_REALIZED":{
    "lane":"ATTRIBUTION_TRUTH",
    "close_with":"organic orders may carry zero paid-media cost only when attribution proves it; paid orders require actual attributed spend",
    "realized_order_required":True
  },
  "PAYMENT_PROCESSOR_ACTUAL_FEE_NOT_REALIZED":{
    "lane":"SETTLEMENT_TRUTH",
    "close_with":"actual captured payment/settlement fee for the order",
    "realized_order_required":True
  },
  "FX_COST_NOT_REALIZED":{
    "lane":"SETTLEMENT_TRUTH",
    "close_with":"actual settlement currency conversion cost/spread when applicable",
    "realized_order_required":True
  },
  "RETURNS_REFUNDS_REALIZED_COST_NOT_AVAILABLE":{
    "lane":"POST_ORDER_TRUTH",
    "close_with":"return/refund/cancellation outcome or verified zero cost after the defined observation window",
    "realized_order_required":True
  },
  "SUPPLIER_FINAL_ORDER_COST_NOT_REALIZED":{
    "lane":"FULFILLMENT_TRUTH",
    "close_with":"final supplier payable/order cost for the exact variant and destination",
    "realized_order_required":True
  }
}

pair_rows=[]
lane_counts=Counter()
market_counts=Counter()
provider_counts=Counter()
prelaunch_only=0
real_order_blocked=0

for p in ledger["pairs"]:
    blockers=[]
    lanes=set()
    requires_real=False
    for b in p.get("blockers",[]):
        rule=PRELAUNCH_POLICY.get(b,{
          "lane":"UNKNOWN_BLOCKER",
          "close_with":"explicit verified evidence",
          "realized_order_required":True
        })
        blockers.append({
          "code":b,
          "lane":rule["lane"],
          "close_with":rule["close_with"],
          "realized_order_required":rule["realized_order_required"]
        })
        lanes.add(rule["lane"])
        lane_counts[rule["lane"]]+=1
        requires_real=requires_real or rule["realized_order_required"]

    if requires_real: real_order_blocked+=1
    else: prelaunch_only+=1

    pair_rows.append({
      "provider":p["provider"],
      "item_id":p["item_id"],
      "market":p["market"],
      "variant_id":p["variant_id"],
      "projected_order_contribution_usd":p["economics"]["projected_order_contribution_after_9pct_reserve_usd"],
      "readiness_state":"READY_FOR_CONTROLLED_ORDER_EVIDENCE" if p["truth"]["supplier_cost"]=="VERIFIED_QUOTE_INPUT" and p["truth"]["supplier_shipping"]=="VERIFIED_QUOTE_INPUT" else "NOT_READY",
      "final_profit_verified":False,
      "requires_real_non_test_order_for_final_profit":requires_real,
      "blocker_lanes":sorted(lanes),
      "blockers":blockers,
      "production_effect":False
    })
    market_counts[p["market"]]+=1
    provider_counts[p["provider"]]+=1

product_markets=defaultdict(set)
product_ready=defaultdict(bool)
for p in pair_rows:
    k=(p["provider"],p["item_id"])
    product_markets[k].add(p["market"])
    if p["readiness_state"]=="READY_FOR_CONTROLLED_ORDER_EVIDENCE":
        product_ready[k]=True

products_ready_4of4=sum(1 for k,m in product_markets.items() if len(m)==4 and product_ready[k])

checklist=[
  {
    "id":"PRELAUNCH_TAX_IMPORT_MATRIX",
    "stage":"PRELAUNCH",
    "required_for_final_profit":True,
    "source":"verified destination policy/legal/shipping responsibility evidence",
    "status":"MISSING"
  },
  {
    "id":"ORDER_FINANCE_LEDGER_REAL_ROW",
    "stage":"REAL_ORDER",
    "required_for_final_profit":True,
    "source":"hunt_order_finance_ledger + hunt_orders non-test row",
    "status":"NO_REAL_ROWS_YET"
  },
  {
    "id":"PAYMENT_SETTLEMENT_FEE",
    "stage":"REAL_ORDER",
    "required_for_final_profit":True,
    "source":"PSP captured/settled transaction evidence",
    "status":"MISSING_REALIZED"
  },
  {
    "id":"SUPPLIER_FINAL_PAYABLE",
    "stage":"REAL_ORDER",
    "required_for_final_profit":True,
    "source":"supplier order/final payable for exact variant and destination",
    "status":"MISSING_REALIZED"
  },
  {
    "id":"FX_SETTLEMENT_COST",
    "stage":"REAL_ORDER_IF_APPLICABLE",
    "required_for_final_profit":True,
    "source":"actual settlement conversion evidence",
    "status":"MISSING_REALIZED"
  },
  {
    "id":"ORDER_DISCOUNT_ACTUAL",
    "stage":"REAL_ORDER",
    "required_for_final_profit":True,
    "source":"order line/promotion ledger",
    "status":"MISSING_REALIZED"
  },
  {
    "id":"MARKETING_ATTRIBUTION_ACTUAL",
    "stage":"REAL_ORDER",
    "required_for_final_profit":True,
    "source":"real order attribution linkage and actual paid media cost where applicable",
    "status":"MISSING_REALIZED"
  },
  {
    "id":"RETURNS_REFUNDS_OUTCOME",
    "stage":"POST_ORDER",
    "required_for_final_profit":True,
    "source":"verified return/refund/cancellation outcome after observation window",
    "status":"MISSING_REALIZED"
  }
]

out={
  "version":"HUNT-FINAL-PROFIT-READINESS-709-V1",
  "date":"2026-09-23",
  "mode":"SHADOW_READINESS_ONLY",
  "production_effect":False,
  "source":"evidence/HUNT-FINAL-PROFIT-TRUTH-709-2026-09-23.json",
  "summary":{
    "gate_ready_products":ledger["summary"]["gate_ready_products"],
    "product_market_pairs":len(pair_rows),
    "products_ready_for_controlled_order_evidence_4_of_4":products_ready_4of4,
    "pairs_ready_for_controlled_order_evidence":sum(p["readiness_state"]=="READY_FOR_CONTROLLED_ORDER_EVIDENCE" for p in pair_rows),
    "pairs_requiring_real_non_test_order_for_final_profit":real_order_blocked,
    "pairs_prelaunch_only_blocked":prelaunch_only,
    "final_profit_verified_products":0,
    "final_profit_verified_pairs":0,
    "provider_pairs":dict(provider_counts),
    "market_pairs":dict(market_counts),
    "blocker_lane_counts":dict(lane_counts)
  },
  "promotion_rule":{
    "controlled_test_order":"May validate plumbing and evidence capture but never counts as realized revenue or Final Net Profit.",
    "real_non_test_order":"Required before a pair can become FINAL_NET_PROFIT_VERIFIED.",
    "final_profit_formula":"customer gross - supplier final payable - supplier shipping - payment fee - tax/import borne by HUNT - FX cost - discount cost - attributed marketing cost - realized returns/refunds/cancellations - other variable cost",
    "unknown_rule":"Any missing required cost input keeps Final Net Profit UNKNOWN."
  },
  "required_evidence_checklist":checklist,
  "pairs":pair_rows
}

OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out["summary"],ensure_ascii=False,indent=2))
