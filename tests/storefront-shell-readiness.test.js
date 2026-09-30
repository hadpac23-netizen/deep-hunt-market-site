import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const auth = fs.readFileSync("auth.js", "utf8");
const pwa = fs.readFileSync("pwa.js", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");

test("auth hides providers that are not enabled by Supabase", () => {
  assert.match(auth, /button\.hidden=!enabled/);
  assert.match(auth, /external\[provider\]===true/);
  assert.match(auth, /external\.google===true/);
  assert.match(auth, /signInWithOtp/);
});

test("PWA rotates cache and protects storefront privacy script from stale cache", () => {
  assert.match(pwa, /service-worker\.js\?v=pwa2/);
  assert.match(pwa, /storefront-privacy\.js\?v=source-privacy2/);
  assert.match(sw, /hunt-shell-pwa2/);
  assert.match(sw, /storefront-privacy\.js\?v=source-privacy2/);
  assert.match(sw, /storefront-privacy\\\.js/);
  assert.match(sw, /networkFirst\(request\)/);
});
