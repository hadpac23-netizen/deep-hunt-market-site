const fs=require("fs");
const assert=require("assert");

const publicAuth=fs.readFileSync("auth.js","utf8");
const studio=fs.readFileSync("boom-ai-studio.js","utf8");
const studioHtml=fs.readFileSync("boom-ai-studio.html","utf8");

// Public HUNT auth stays passwordless.
assert(publicAuth.includes("signInWithOtp"),"public auth missing email OTP");
assert(publicAuth.includes("signInWithOAuth"),"public auth missing OAuth");
assert(!publicAuth.includes("signInWithPassword"),"public auth must not expose password login");
assert(!publicAuth.includes(".auth.signUp("),"public auth must not expose password signup");

// BOOM Studio may keep fallback password login, but only behind Owner/Admin verification.
assert(studio.includes("signInWithPassword"),"studio password fallback missing");
assert(studio.includes("async function ensureAdmin(session)"),"studio admin gate missing");
assert(studio.includes('select("is_admin")'),"studio admin flag verification missing");
assert(studio.includes('if(!data?.is_admin)throw new Error("נדרשת הרשאת Owner/Admin.")'),
  "studio admin rejection missing");
assert(studio.includes("await ensureAdmin(data.session)"),
  "password login does not verify admin before opening studio");
assert(studio.includes('provider:"github"'),"studio GitHub OAuth missing");
assert(studioHtml.includes('id="password-login"'),"studio fallback login markup missing");

console.log("BOOM auth surface test: PASS");
