const fs=require("node:fs");
const path=require("node:path");

const DECISION_STATUSES=["PASS","REVIEW","REJECT","UNKNOWN","ESCALATE"];
const TRUTH_STATES=["VERIFIED","PROVISIONAL","STALE","CONFLICTED","UNKNOWN"];
const RISK_LEVELS=["LOW","MEDIUM","HIGH","CRITICAL"];

function loadJson(name){
  return JSON.parse(fs.readFileSync(path.join(__dirname,name),"utf8"));
}
function clamp01(value){
  const n=Number(value);
  if(!Number.isFinite(n))return null;
  return Math.min(1,Math.max(0,n));
}
function normalizeOptions(options={}){
  const out={};
  let sum=0;
  for(const key of DECISION_STATUSES){
    const value=Number(options[key]??0);
    out[key]=Number.isFinite(value)&&value>=0?value:0;
    sum+=out[key];
  }
  if(sum<=0)return null;
  for(const key of DECISION_STATUSES)out[key]=out[key]/sum;
  return out;
}
function deterministicOptions(selected){
  return Object.fromEntries(DECISION_STATUSES.map(key=>[key,key===selected?1:0]));
}
function truthState(fact){
  const state=String(fact?.truth_state||"UNKNOWN").toUpperCase();
  return TRUTH_STATES.includes(state)?state:"UNKNOWN";
}
function collectEvidenceRefs(...items){
  const refs=[];
  const visit=(value)=>{
    if(Array.isArray(value))return value.forEach(visit);
    if(value&&typeof value==="object"){
      if(Array.isArray(value.evidence_refs))value.evidence_refs.forEach(visit);
      return;
    }
    if(typeof value==="string"&&value.trim())refs.push(value.trim());
  };
  items.forEach(visit);
  return [...new Set(refs)];
}
function makeDecision(input={}){
  const selected=String(input.selected||"UNKNOWN").toUpperCase();
  if(!DECISION_STATUSES.includes(selected))throw new Error("BDIF_INVALID_SELECTED");
  const risk=String(input.risk||"LOW").toUpperCase();
  if(!RISK_LEVELS.includes(risk))throw new Error("BDIF_INVALID_RISK");
  const truthQuality=String(input.truth_quality||"UNKNOWN").toUpperCase();
  if(!TRUTH_STATES.includes(truthQuality))throw new Error("BDIF_INVALID_TRUTH_QUALITY");
  const suppliedOptions=normalizeOptions(input.options);
  const basis=String(input.confidence_basis||"DETERMINISTIC_POLICY");
  const options=suppliedOptions||deterministicOptions(selected);
  const selectedProbability=options[selected]??0;
  const confidence=input.confidence==null?selectedProbability:clamp01(input.confidence);
  if(confidence==null)throw new Error("BDIF_INVALID_CONFIDENCE");
  return {
    decision_id:String(input.decision_id||""),
    decision_type:String(input.decision_type||""),
    options,
    selected,
    confidence,
    confidence_basis:basis,
    truth_quality:truthQuality,
    risk,
    reasons:Array.isArray(input.reasons)?input.reasons:[],
    evidence_refs:Array.isArray(input.evidence_refs)?[...new Set(input.evidence_refs.filter(Boolean))]:[],
    engine_used:String(input.engine_used||"bdif_kernel_v1"),
    policy_checks:Array.isArray(input.policy_checks)?input.policy_checks:[],
    requires_owner_gate:input.requires_owner_gate===true,
    model:input.model??null,
    model_version:input.model_version??null,
    cost:input.cost??null,
    latency_ms:Number.isFinite(Number(input.latency_ms))?Number(input.latency_ms):null,
    predicted_outcome:input.predicted_outcome??null,
    actual_outcome:input.actual_outcome??null,
    evaluation:input.evaluation??null,
    correlation_id:input.correlation_id??null,
    run_id:input.run_id??null,
    timestamp:String(input.timestamp||new Date().toISOString())
  };
}
function unknownReason(fact){
  const state=truthState(fact);
  return state==="STALE"?"EVIDENCE_STALE":"EVIDENCE_UNKNOWN";
}
function evaluateHuntProductGate(input={}){
  const facts=input.facts||{};
  const required=[
    ["product_identity",facts.product_identity],
    ["exact_variant",facts.exact_variant],
    ["stock",facts.stock],
    ["shipping",facts.shipping]
  ];
  const policyChecks=[];
  const evidenceRefs=collectEvidenceRefs(required.map(([,fact])=>fact),input.economics);
  for(const [name,fact] of required){
    const state=truthState(fact);
    policyChecks.push({policy:"TRUTH_REQUIRED",fact:name,state,passed:state==="VERIFIED"});
    if(state!=="VERIFIED"){
      return makeDecision({
        decision_id:input.decision_id,
        decision_type:"HUNT_PRODUCT_GATE",
        selected:"UNKNOWN",
        truth_quality:state,
        risk:input.risk||"MEDIUM",
        reasons:[unknownReason(fact),"REQUIRED_FACT_"+name.toUpperCase()+"_"+state],
        evidence_refs:evidenceRefs,
        policy_checks:policyChecks,
        requires_owner_gate:false
      });
    }
  }

  if(facts.destination_supported?.value===false){
    policyChecks.push({policy:"HUNT_DESTINATION_SUPPORTED",passed:false});
    return makeDecision({
      decision_id:input.decision_id,
      decision_type:"HUNT_PRODUCT_GATE",
      selected:"REJECT",
      truth_quality:"VERIFIED",
      risk:input.risk||"MEDIUM",
      reasons:["COMMERCE_TRUTH_BLOCK","DESTINATION_UNSUPPORTED"],
      evidence_refs:evidenceRefs,
      policy_checks:policyChecks
    });
  }
  policyChecks.push({policy:"HUNT_DESTINATION_SUPPORTED",passed:true});

  const qty=Number(facts.stock?.value?.quantity??facts.stock?.value);
  if(Number.isFinite(qty)&&qty<=0){
    policyChecks.push({policy:"HUNT_STOCK_REQUIRED",passed:false});
    return makeDecision({
      decision_id:input.decision_id,
      decision_type:"HUNT_PRODUCT_GATE",
      selected:"REJECT",
      truth_quality:"VERIFIED",
      risk:input.risk||"MEDIUM",
      reasons:["FULFILLMENT_FAIL","VERIFIED_STOCK_ZERO"],
      evidence_refs:evidenceRefs,
      policy_checks:policyChecks
    });
  }
  policyChecks.push({policy:"HUNT_STOCK_REQUIRED",passed:true});

  if(facts.shipping?.value?.supported===false){
    policyChecks.push({policy:"HUNT_SHIPPING_REQUIRED",passed:false});
    return makeDecision({
      decision_id:input.decision_id,
      decision_type:"HUNT_PRODUCT_GATE",
      selected:"REJECT",
      truth_quality:"VERIFIED",
      risk:input.risk||"MEDIUM",
      reasons:["FULFILLMENT_FAIL","VERIFIED_SHIPPING_UNSUPPORTED"],
      evidence_refs:evidenceRefs,
      policy_checks:policyChecks
    });
  }
  policyChecks.push({policy:"HUNT_SHIPPING_REQUIRED",passed:true});

  if(input.require_economics===true){
    const economics=input.economics||{};
    if(economics.inputs_verified!==true){
      policyChecks.push({policy:"HUNT_NET_PROFIT_TRUTH",passed:false});
      return makeDecision({
        decision_id:input.decision_id,
        decision_type:"HUNT_PRODUCT_GATE",
        selected:"UNKNOWN",
        truth_quality:"UNKNOWN",
        risk:input.risk||"MEDIUM",
        reasons:["EVIDENCE_UNKNOWN","ECONOMICS_INPUTS_NOT_VERIFIED"],
        evidence_refs:evidenceRefs,
        policy_checks:policyChecks
      });
    }
    const margin=Number(economics.contribution_margin);
    const floor=Number(economics.margin_floor);
    if(!Number.isFinite(margin)||!Number.isFinite(floor)){
      policyChecks.push({policy:"HUNT_MARGIN_FLOOR",passed:false});
      return makeDecision({
        decision_id:input.decision_id,
        decision_type:"HUNT_PRODUCT_GATE",
        selected:"UNKNOWN",
        truth_quality:"UNKNOWN",
        risk:input.risk||"MEDIUM",
        reasons:["EVIDENCE_UNKNOWN","MARGIN_INPUT_MISSING"],
        evidence_refs:evidenceRefs,
        policy_checks:policyChecks
      });
    }
    if(margin<floor){
      policyChecks.push({policy:"HUNT_MARGIN_FLOOR",passed:false,margin,floor});
      return makeDecision({
        decision_id:input.decision_id,
        decision_type:"HUNT_PRODUCT_GATE",
        selected:"REJECT",
        truth_quality:"VERIFIED",
        risk:input.risk||"MEDIUM",
        reasons:["MARGIN_FAIL"],
        evidence_refs:evidenceRefs,
        policy_checks:policyChecks
      });
    }
    policyChecks.push({policy:"HUNT_MARGIN_FLOOR",passed:true,margin,floor});
  }

  return makeDecision({
    decision_id:input.decision_id,
    decision_type:"HUNT_PRODUCT_GATE",
    selected:"PASS",
    truth_quality:"VERIFIED",
    risk:input.risk||"MEDIUM",
    reasons:["COMMERCE_TRUTH_PASS"],
    evidence_refs:evidenceRefs,
    policy_checks:policyChecks
  });
}

function ownerGateRequired(action){
  const map=loadJson("boom-owner-gate-map.json");
  return map.actions.some(row=>row.action===action&&row.gate==="REQUIRED");
}
function averageOptions(judges){
  const totals=Object.fromEntries(DECISION_STATUSES.map(k=>[k,0]));
  let count=0;
  for(const judge of judges){
    const options=normalizeOptions(judge?.options);
    if(!options)continue;
    count+=1;
    for(const key of DECISION_STATUSES)totals[key]+=options[key];
  }
  if(!count)return null;
  for(const key of DECISION_STATUSES)totals[key]/=count;
  return totals;
}
function aggregateJudges(judges=[],context={}){
  const valid=judges.filter(j=>DECISION_STATUSES.includes(String(j?.selected||"").toUpperCase()));
  if(valid.length===0){
    return makeDecision({
      decision_id:context.decision_id,
      decision_type:context.decision_type||"MULTI_JUDGE",
      selected:"UNKNOWN",
      truth_quality:context.truth_quality||"UNKNOWN",
      risk:context.risk||"MEDIUM",
      reasons:["EVIDENCE_UNKNOWN","NO_VALID_JUDGES"],
      evidence_refs:[]
    });
  }
  if(context.hard_policy_decision&&context.hard_policy_decision.selected!=="PASS"){
    return context.hard_policy_decision;
  }
  const selections=[...new Set(valid.map(j=>String(j.selected).toUpperCase()))];
  const risk=String(context.risk||"MEDIUM").toUpperCase();
  const refs=collectEvidenceRefs(valid);
  if(selections.length>1){
    return makeDecision({
      decision_id:context.decision_id,
      decision_type:context.decision_type||"MULTI_JUDGE",
      selected:(risk==="HIGH"||risk==="CRITICAL")?"ESCALATE":"REVIEW",
      truth_quality:context.truth_quality||"PROVISIONAL",
      risk,
      reasons:["JUDGE_DISAGREEMENT"],
      evidence_refs:refs,
      confidence_basis:"MULTI_JUDGE",
      policy_checks:[{policy:"MULTI_JUDGE_AGREEMENT",passed:false,selections}]
    });
  }
  const selected=selections[0];
  const options=averageOptions(valid)||deterministicOptions(selected);
  return makeDecision({
    decision_id:context.decision_id,
    decision_type:context.decision_type||"MULTI_JUDGE",
    selected,
    options,
    confidence:options[selected],
    confidence_basis:"MULTI_JUDGE",
    truth_quality:context.truth_quality||"PROVISIONAL",
    risk,
    reasons:["MULTI_JUDGE_AGREEMENT"],
    evidence_refs:refs,
    policy_checks:[{policy:"MULTI_JUDGE_AGREEMENT",passed:true,count:valid.length}]
  });
}

function brierScore(records=[]){
  let total=0,count=0;
  for(const row of records){
    const actual=String(row?.actual||"").toUpperCase();
    const options=normalizeOptions(row?.options);
    if(!DECISION_STATUSES.includes(actual)||!options)continue;
    let sum=0;
    for(const key of DECISION_STATUSES){
      const target=key===actual?1:0;
      sum+=(options[key]-target)**2;
    }
    total+=sum;
    count+=1;
  }
  return count?total/count:null;
}
function expectedCalibrationError(records=[],bins=10){
  const nBins=Math.max(2,Math.min(100,Number(bins)||10));
  const bucket=Array.from({length:nBins},()=>({n:0,confidence:0,correct:0}));
  let total=0;
  for(const row of records){
    const options=normalizeOptions(row?.options);
    const actual=String(row?.actual||"").toUpperCase();
    if(!options||!DECISION_STATUSES.includes(actual))continue;
    const predicted=DECISION_STATUSES.reduce((a,b)=>options[b]>options[a]?b:a,DECISION_STATUSES[0]);
    const confidence=options[predicted];
    const idx=Math.min(nBins-1,Math.floor(confidence*nBins));
    bucket[idx].n+=1;
    bucket[idx].confidence+=confidence;
    bucket[idx].correct+=predicted===actual?1:0;
    total+=1;
  }
  if(!total)return null;
  return bucket.reduce((ece,b)=>{
    if(!b.n)return ece;
    const avgConf=b.confidence/b.n;
    const accuracy=b.correct/b.n;
    return ece+(b.n/total)*Math.abs(accuracy-avgConf);
  },0);
}
function simulateUnitEconomics(base={},scenarios=[]){
  const fields=["revenue","supplier_cost","shipping_cost","payment_fees","return_cost","marketing_cost","other_variable_cost"];
  const numeric={};
  for(const field of fields){
    const n=Number(base[field]);
    if(!Number.isFinite(n)){
      return {state:"UNKNOWN",reason:"SIMULATION_INPUT_MISSING",missing:field,scenarios:[]};
    }
    numeric[field]=n;
  }
  const map={
    sale_price_pct:"revenue",
    supplier_cost_pct:"supplier_cost",
    shipping_cost_pct:"shipping_cost",
    payment_fees_pct:"payment_fees",
    return_cost_pct:"return_cost",
    marketing_cost_pct:"marketing_cost",
    other_variable_cost_pct:"other_variable_cost"
  };
  const results=scenarios.map(scenario=>{
    const values={...numeric};
    const adjustments=scenario.adjustments||{};
    for(const [adjustment,field] of Object.entries(map)){
      if(adjustments[adjustment]==null)continue;
      const pct=Number(adjustments[adjustment]);
      if(!Number.isFinite(pct))throw new Error("BDIF_INVALID_SIMULATION_ADJUSTMENT");
      values[field]=values[field]*(1+pct);
    }
    const totalVariableCost=values.supplier_cost+values.shipping_cost+values.payment_fees+values.return_cost+values.marketing_cost+values.other_variable_cost;
    const contribution=values.revenue-totalVariableCost;
    const contributionMargin=values.revenue!==0?contribution/values.revenue:null;
    return {
      name:String(scenario.name||"SCENARIO"),
      adjustments,
      revenue:values.revenue,
      total_variable_cost:totalVariableCost,
      contribution,
      contribution_margin:contributionMargin,
      evidence_refs:[...new Set([...(base.evidence_refs||[]),...(scenario.evidence_refs||[])])]
    };
  });
  return {state:"SIMULATION",realized_profit:false,scenarios:results};
}

module.exports={
  DECISION_STATUSES,TRUTH_STATES,RISK_LEVELS,
  normalizeOptions,truthState,makeDecision,evaluateHuntProductGate,
  ownerGateRequired,aggregateJudges,brierScore,expectedCalibrationError,
  simulateUnitEconomics
};
