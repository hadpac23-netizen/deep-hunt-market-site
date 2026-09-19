const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const feed=fs.readFileSync("boom-google-ai-feed.js","utf8");
const passport=fs.readFileSync("boom-commerce-passport.js","utf8");

assert(html.includes('id="bg-google-feed-state"'),"M02 state UI missing");
assert(html.includes('id="bg-google-feed-stats"'),"M02 stats UI missing");
assert(html.includes('id="bg-google-feed-contract"'),"M02 export contract UI missing");
assert(html.includes('id="bg-google-feed-blockers"'),"M02 blockers UI missing");
assert(html.indexOf("boom-commerce-passport.js?v=m01")<html.indexOf("boom-google-ai-feed.js?v=m02"),"M02 must load after Commerce Passport");
assert(html.indexOf("boom-google-ai-feed.js?v=m02")<html.indexOf("boom-marketing-brain.js"),"M02 must load before Marketing Brain/Growth runtime");

for(const token of [
  "googleFeedPreview",
  "configuredFeedLabel",
  "renderGoogleFeed",
  "Network calls",
  "External publish",
  "NOT CONFIGURED"
]) assert(js.includes(token),"M02 Growth OS contract missing: "+token);

for(const token of [
  "ProductInput",
  "questionsAndAnswers",
  "documentLinks",
  "variantOptions",
  "relatedProducts",
  "variant_offer_not_expanded",
  "feed_label_invalid",
  "network_calls:0",
  "external_publish:false",
  'owner_gate:"REVIEW_REQUIRED"'
]) assert(feed.includes(token),"M02 feed contract missing: "+token);

assert(passport.includes("gtins:"),"Merchant GTIN array contract missing");
assert(passport.includes("canonicalLink"),"Merchant canonicalLink contract missing");
assert(passport.includes('feedLabel:clean(ctx.feed_label||ctx.market||"",12)'),"Feed label must never default to a market");
assert(!/fetch\s*\(|XMLHttpRequest|merchantapi\.googleapis\.com|productInputs:insert/.test(feed),"M02 exporter must stay network-free");
assert(!/\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(js),"Growth OS M02 must remain read-only");
console.log("boom_m02_google_ai_feed_contract=PASS");
