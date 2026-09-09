export const PROFIT_CHANNELS = [
  "STANDARD_RETAIL",
  "ARENA_SUCCESS_FEE",
  "AFFILIATE_FALLBACK"
] as const;

export const HUNT_COST_KEYS = [
  "supplier_cost","shipping_cost","payment_fee","tax_cost","duties_cost",
  "fulfillment_cost","returns_reserve","acquisition_cost","creator_cost","other_cost"
] as const;

const clean = (value:unknown) => typeof value === "string" ? value.trim() : "";
const money = (value:unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const channelSet = new Set<string>(PROFIT_CHANNELS);
function revenueFor(channel:string,body:any){
  if(channel==="STANDARD_RETAIL") return money(body?.retail_price);
  if(channel==="ARENA_SUCCESS_FEE") return money(body?.arena_success_fee);
  if(channel==="AFFILIATE_FALLBACK") return money(body?.affiliate_commission);
  return null;
}

function requiredRevenue(cost:number,minProfit:number,minMarginPct:number){
  const profitFloor=cost+minProfit;
  const rate=minMarginPct/100;
  let marginFloor=0;
  if(rate>=1) marginFloor=cost===0 ? 0 : Number.POSITIVE_INFINITY;
  else marginFloor=cost/(1-rate);
  return Math.max(profitFloor,marginFloor);
}

export function evaluateProfitGate(body:any,defaults:any={}){
  const channel=clean(body?.channel).toUpperCase();
  const currency=clean(body?.currency).toUpperCase();
  const evidence=body?.evidence && typeof body.evidence==="object" ? body.evidence : {};
  const minProfit=money(body?.minimum_profit_amount ?? defaults?.minimum_profit_amount);
  const minMargin=money(body?.minimum_margin_pct ?? defaults?.minimum_margin_pct);
  const costs:any={};
  const missing:string[]=[];

  for(const key of HUNT_COST_KEYS){
    const value=money(body?.[key]);
    if(value===null) missing.push(key);
    else costs[key]=value;
  }

  const revenue=revenueFor(channel,body);
  if(revenue===null) missing.push("channel_revenue");
  if(minProfit===null) missing.push("minimum_profit_amount");
  if(minMargin===null || minMargin>100) missing.push("minimum_margin_pct");
  if(!channelSet.has(channel)) missing.push("supported_channel");
  if(!/^[A-Z]{3}$/.test(currency)) missing.push("currency");
  if(evidence?.inputs_verified !== true) missing.push("verified_cost_evidence");
  const totalCost=HUNT_COST_KEYS.reduce((sum,key)=>sum+(Number(costs[key])||0),0);
  const contribution=revenue===null ? null : revenue-totalCost;
  const margin=revenue!==null && revenue>0 && contribution!==null
    ? (contribution/revenue)*100 : null;
  const required=minProfit!==null && minMargin!==null && minMargin<=100
    ? requiredRevenue(totalCost,minProfit,minMargin) : null;

  let gateStatus="WAIT";
  let reason="Complete verified unit-economics inputs before selling.";

  if(!missing.length && revenue!==null){
    if(revenue<=0){
      gateStatus="FAIL";
      reason="Revenue must be greater than zero.";
    } else if(contribution===null || margin===null){
      gateStatus="WAIT";
      reason="Contribution economics are incomplete.";
    } else if(contribution < Number(minProfit) || margin < Number(minMargin)){
      gateStatus="FAIL";
      reason="Contribution economics are below the configured profit floor.";
    } else {
      gateStatus="PASS";
      reason="Verified inputs meet the configured contribution-profit floor.";
    }
  }

  return {
    channel,currency,costs,
    gross_revenue:revenue,
    total_hunt_cost:totalCost,
    contribution_profit:contribution,
    contribution_margin_pct:margin,
    minimum_profit_amount:minProfit,
    minimum_margin_pct:minMargin,
    required_revenue_floor:Number.isFinite(Number(required)) ? required : null,
    inputs_complete:missing.length===0,
    missing_inputs:missing,
    gate_status:gateStatus,
    reason
  };
}
