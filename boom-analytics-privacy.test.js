const fs=require("fs");
const assert=require("assert");

const source=fs.readFileSync("analytics.js","utf8");
const config=fs.readFileSync("analytics-config.js","utf8");
const manager=fs.readFileSync("privacy-choices.html","utf8");
const legal=fs.readFileSync("legal.html","utf8");
const contract=JSON.parse(fs.readFileSync("boom-analytics-privacy-contract.json","utf8"));

assert.equal(contract.version,"BOOM-ANALYTICS-PRIVACY-V1");
assert.equal(contract.consent_key,"hunt_analytics_consent_v2");
assert.equal(contract.consent_version,"2026-09-20.1");
assert.equal(contract.payment_impact,"none");
assert.equal(contract.deployment_state,"source_only");

assert(config.includes('consentVersion: "2026-09-20.1"'));
assert(config.includes('posthogApiHost: "https://eu.i.posthog.com"'));
assert(config.includes("posthogSessionReplay: false"));

assert(source.includes('const consentKey = "hunt_analytics_consent_v2"'));
assert(source.includes('const legacyConsentKey = "hunt_analytics_consent_v1"'));
assert(source.includes('if (legacy === "denied") return "denied"'));
assert(source.includes('return "unknown";'));
assert(source.includes('if (!consentGranted()) return false;'));
assert(!source.includes("queue.push("),"pre-consent analytics must never be queued for later replay");
assert(!source.includes("while (queue.length)"),"pre-consent analytics must never be flushed later");

assert(source.includes('autocapture: false'));
assert(source.includes('capture_pageleave: false'));
assert(source.includes('disable_session_recording: true'));
assert(source.includes('window["ga-disable-" + id] = true'));
assert(source.includes('window.posthog?.opt_out_capturing?.()'));
assert(source.includes('window.posthog?.stopSessionRecording?.()'));
assert(source.includes('window.posthog?.reset?.()'));
assert(source.includes('getConsentStatus: () => consentState'));
assert(source.includes("openPreferences"));

assert(manager.includes('data-hunt-consent-surface="manager"'));
assert(manager.includes('id="hd-consent-decline"'));
assert(manager.includes('id="hd-consent-allow"'));
assert(manager.includes("Session replay is off"));
assert(legal.includes('href="privacy-choices.html"'));

for(const forbidden of ["card_number","cvv","security_code","ship-email","ship-phone","ship-address"]){
  assert(!source.includes(forbidden),"analytics source unexpectedly references sensitive checkout field "+forbidden);
}

console.log("BOOM analytics/privacy consent: PASS — fail-closed, no retroactive replay, revocable, replay OFF");
