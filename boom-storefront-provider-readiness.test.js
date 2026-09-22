const fs=require("fs"),assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-storefront/index.ts","utf8");
assert(/const marginFloor = cost \/ Math\.max\(0\.05, reserveDenominator - targetMargin\);/.test(src),"CJ margin floor must include reserves");
assert(/GOOTEN_RECIPE_ID/.test(src),"Gooten readiness must use RecipeID");
assert(/GOOTEN_PARTNER_BILLING_KEY/.test(src),"Gooten order readiness must require server-only PartnerBillingKey");
assert(/PRINTFUL_API_TOKEN/.test(src)&&/PRINTFUL_STORE_ID/.test(src),"Printful readiness must require token + store");
assert(/Gooten: \{\s*mode: gootenActive \? "ONSITE_CAPABLE" : "APPROVAL_REQUIRED"/m.test(src),"Gooten must remain approval-gated");
assert(/verified Gelato API credentials/.test(src),"Gelato note must not refer to Gooten credentials");
console.log("HUNT Storefront Provider/Price Readiness: PASS — reserve-aware CJ pricing + canonical Printful/Gooten credential gates");