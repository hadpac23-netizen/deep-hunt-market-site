#!/usr/bin/env python3
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
core = (root / "market-core.js").read_text()
key_match = re.search(r'const publishableKey = "([^"]+)"', core)
base_match = re.search(r'const functionsBase = "([^"]+)"', core)
if not key_match or not base_match:
    sys.exit("FAIL: storefront configuration not found")

provider = os.getenv("HUNT_E2E_PROVIDER", "CJdropshipping")
item_id = os.getenv("HUNT_E2E_ITEM_ID", "2410010236461621700")
query = urllib.parse.urlencode({"provider": provider, "product_id": item_id})
url = f"{base_match.group(1)}/hunt-storefront?{query}"
request = urllib.request.Request(url, headers={"apikey": key_match.group(1)})

try:
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.load(response)
except Exception as exc:
    sys.exit(f"FAIL: live storefront request failed: {exc}")

product = payload.get("product") or {}
variants = product.get("variants") or []
checks = {
    "item identity": str(product.get("item_id") or "") == item_id,
    "provider identity": str(product.get("provider") or "") == provider,
    "variant feed": isinstance(variants, list) and len(variants) > 0,
    "retail verification": product.get("retail_price_verified") is True,
    "profit gate": str(product.get("profit_gate_status") or "").upper() == "PASS",
}
failed = [name for name, passed in checks.items() if not passed]
if failed:
    sys.exit("FAIL: live storefront contract: " + ", ".join(failed))

print(f"BOOM live storefront smoke: PASS — {provider} {item_id}, {len(variants)} variants, retail/profit verified.")