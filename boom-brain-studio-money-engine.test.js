const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("boom-brain-studio.html","utf8");
const js=fs.readFileSync("boom-brain-studio.js","utf8");
const profit=JSON.parse(fs.readFileSync("boom-profit-engine-contract.json","utf8"));
const registry=JSON.parse(fs.readFileSync("boom-skill-registry.json","utf8"));

assert(html.includes('id="bs-money-engine"'));
assert(html.includes('boom-hunt-money-engine.js?v=money1'));
assert(js.includes('json("boom-hunt-money-engine-contract.json")'));
assert(js.includes('renderMoneyEngine()'));
assert(js.includes('window.BoomHuntMoneyEngine'));
assert(profit.extensions.some(x=>x.id==="hunt_profit_shipping_money_engine"));
assert(registry.skills.some(x=>x.path==="skills/hunt-profit-shipping-money-engine.md"&&x.owner==="commerce_truth_brain"));
assert(fs.existsSync("docs/HUNT-PROFIT-SHIPPING-OS-MASTER-PROMPT.md"));
assert(fs.existsSync("docs/HUNT-MONEY-ENGINE-MASTER-PROMPT.md"));
assert(fs.existsSync("docs/HUNT-GLOBAL-DISTRIBUTION-OS-SKILL-PACK-V1.md"));

console.log("BOOM Studio Money Engine surface: PASS — prompts, skill, contract, evaluator and Profit Mission Control wiring are present");