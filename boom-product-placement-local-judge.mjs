import fs from "fs";
import gate from "./boom-product-placement-gate.js";

const SHELF="evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json";
const TAX="evidence/HUNT-EPROLO-PLACEMENT-TAXONOMY-REFRESH-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-LOCAL-JUDGE-2026-09-23.json";
const shelves=JSON.parse(fs.readFileSync(SHELF,"utf8"));
const tax=fs.existsSync(TAX)?JSON.parse(fs.readFileSync(TAX,"utf8")):{verified:[]};
const taxMap=new Map((tax.verified||[]).map(x=>[x.provider+":"+String(x.item_id),x]));

const STOP=new Set(("new fashion style trendy hot sale wholesale dropshipping product products item items quality high premium simple portable creative design suitable use using with for from and the a an of to in on by is are be this that these those color colours colors size sizes one two three pcs piece pieces set sets latest women woman womens female lady ladies men man mens male unisex").split(/\s+/));

function tokens(title){
  return String(title||"").toLowerCase()
    .replace(/&amp;/g," and ")
    .replace(/[^a-z0-9]+/g," ")
    .trim().split(/\s+/)
    .filter(x=>x.length>=3&&!STOP.has(x)&&!/^\d+$/.test(x));
}
function railOf(d,c){return d+"/"+c;}

const rows=[];
for(const dep of shelves.departments||[])for(const cat of dep.categories||[])for(const p of cat.products||[]){
  const key=p.provider+":"+String(p.item_id||"");
  const tx=taxMap.get(key);
  const input={
    provider:p.provider,item_id:String(p.item_id||""),title:p.title||"",
    current_department:dep.slug,current_category:cat.slug,
    supplier_category_id:tx?.supplier_category_id||null,
    supplier_taxonomy_current_rail_verified:!!(tx&&tx.current_rail===railOf(dep.slug,cat.slug))
  };
  rows.push({...input,placement:gate.evaluate(input)});
}
const keep=rows.filter(x=>x.placement.placement_action==="KEEP");
const unknown=rows.filter(x=>x.placement.placement_action==="HOLD_UNKNOWN");

const df=new Map();
const docs=keep.map((x,i)=>{
  const ts=[...new Set(tokens(x.title))];
  for(const t of ts)df.set(t,(df.get(t)||0)+1);
  return {i,key:x.provider+":"+x.item_id,rail:railOf(x.current_department,x.current_category),title:x.title,tokens:ts};
});
const N=docs.length;
const idf=new Map([...df].map(([t,n])=>[t,Math.log((N+1)/(n+1))+1]));

function vector(ts){
  const counts=new Map();
  for(const t of ts)counts.set(t,(counts.get(t)||0)+1);
  const v=new Map(); let norm=0;
  for(const [t,c] of counts){
    const w=(1+Math.log(c))*(idf.get(t)||0);
    if(w<=0)continue;
    v.set(t,w);norm+=w*w;
  }
  norm=Math.sqrt(norm)||1;
  for(const [t,w] of v)v.set(t,w/norm);
  return v;
}
for(const d of docs)d.vec=vector(tokens(d.title));

const postings=new Map();
for(const d of docs)for(const [t,w] of d.vec){
  if(!postings.has(t))postings.set(t,[]);
  postings.get(t).push([d.i,w]);
}

function neighbors(title,excludeKey=null,k=7){
  const q=vector(tokens(title));
  const scores=new Map();
  for(const [t,qw] of q){
    for(const [idx,dw] of postings.get(t)||[]){
      const d=docs[idx];
      if(excludeKey&&d.key===excludeKey)continue;
      scores.set(idx,(scores.get(idx)||0)+qw*dw);
    }
  }
  return [...scores.entries()]
    .map(([idx,score])=>({idx,score,rail:docs[idx].rail,key:docs[idx].key,title:docs[idx].title}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,k);
}
function summarize(ns){
  if(!ns.length)return null;
  const agg=new Map();
  for(const n of ns){
    const a=agg.get(n.rail)||{rail:n.rail,votes:0,sum:0,best:0};
    a.votes++;a.sum+=n.score;a.best=Math.max(a.best,n.score);agg.set(n.rail,a);
  }
  const groups=[...agg.values()].sort((a,b)=>b.votes-a.votes||b.sum-a.sum||b.best-a.best);
  const top=groups[0],second=groups[1]||{sum:0,votes:0,best:0};
  return {top,second,margin:top.sum/(second.sum+1e-9),neighbors:ns};
}
const keepN=keep.map(x=>({
  key:x.provider+":"+x.item_id,trueRail:railOf(x.current_department,x.current_category),
  s:summarize(neighbors(x.title,x.provider+":"+x.item_id,7))
}));

const grids=[];
for(const minBest of [.28,.32,.36,.40,.44,.48])
 for(const minVotes of [2,3,4])
  for(const minMargin of [1.15,1.3,1.5,1.8,2.1]){
    let proposed=0,correct=0;
    for(const x of keepN){
      const s=x.s;if(!s)continue;
      if(s.top.best<minBest||s.top.votes<minVotes||s.margin<minMargin)continue;
      proposed++;if(s.top.rail===x.trueRail)correct++;
    }
    const precision=proposed?correct/proposed:0;
    grids.push({minBest,minVotes,minMargin,proposed,correct,precision,coverage:proposed/keepN.length});
  }
const eligible=grids.filter(x=>x.proposed>=80&&x.precision>=.97).sort((a,b)=>b.coverage-a.coverage||b.precision-a.precision);
const fallback=grids.filter(x=>x.proposed>=50&&x.precision>=.95).sort((a,b)=>b.precision-a.precision||b.coverage-a.coverage);
const chosen=eligible[0]||fallback[0]||grids.sort((a,b)=>b.precision-a.precision||b.proposed-a.proposed)[0];

function proposalGuard(title,currentRail,proposedRail){
  const gender=gate.detectGender(title);
  const currentDep=currentRail.split("/")[0];
  const proposedDep=proposedRail.split("/")[0];
  const t=String(title||"").toLowerCase();
  const reasons=[];

  if(gender==="WOMEN"&&(proposedDep==="men"||proposedDep==="kids"))reasons.push("EXPLICIT_WOMEN_DEPARTMENT_GUARD");
  if(gender==="MEN"&&(proposedDep==="women"||proposedDep==="kids"))reasons.push("EXPLICIT_MEN_DEPARTMENT_GUARD");
  if(gender==="KIDS"&&proposedDep!=="kids")reasons.push("EXPLICIT_KIDS_DEPARTMENT_GUARD");
  if(currentDep==="kids"&&proposedDep!=="kids")reasons.push("CURRENT_KIDS_HOLD_GUARD");
  if(proposedDep==="kids"&&gender!=="KIDS")reasons.push("KIDS_TARGET_REQUIRES_KIDS_EVIDENCE");
  if(proposedRail==="toys/plush-toys"&&/\b(key\s?chain|keychain|bag charm|pendant|brooch|accessor(?:y|ies)|schoolbag|backpack)\b/i.test(t))reasons.push("PLUSH_TARGET_ACCESSORY_CONFLICT");
  if(proposedRail==="kids/kids-accessories"&&/\b(men|men's|mens|male|business|computer|laptop|oxford cloth)\b/i.test(t))reasons.push("KIDS_ACCESSORY_ADULT_BAG_CONFLICT");
  if(proposedRail==="women/women-dresses"&&/\b(jumpsuit|romper|blouse|shirt|top\b|two[- ]?piece|suit\b)\b/i.test(t))reasons.push("DRESS_TARGET_GARMENT_CONFLICT");
  if(proposedRail==="men/men-boxers"&&/\b(swim briefs?|swimsuit|swimwear)\b/i.test(t))reasons.push("BOXER_TARGET_SWIM_CONFLICT");
  return {pass:reasons.length===0,reasons};
}

const proposals=[];
let currentSupport=0,crossReview=0,noMatch=0,guardBlocked=0;
for(const x of unknown){
  const s=summarize(neighbors(x.title,null,7));
  if(!s||s.top.best<chosen.minBest||s.top.votes<chosen.minVotes||s.margin<chosen.minMargin){
    noMatch++;continue;
  }
  const currentRail=railOf(x.current_department,x.current_category);
  const guard=proposalGuard(x.title,currentRail,s.top.rail);
  if(!guard.pass){
    guardBlocked++;
    continue;
  }
  const effect=s.top.rail===currentRail?"CURRENT_RAIL_REVIEW_SUPPORT":"CROSS_RAIL_REVIEW_CANDIDATE";
  if(effect==="CURRENT_RAIL_REVIEW_SUPPORT")currentSupport++;else crossReview++;
  proposals.push({
    provider:x.provider,item_id:x.item_id,title:x.title,current_rail:currentRail,
    proposed_rail:s.top.rail,effect,
    judge_confidence_basis:{
      best_similarity:+s.top.best.toFixed(4),
      top_votes:s.top.votes,
      top_score_sum:+s.top.sum.toFixed(4),
      margin:+s.margin.toFixed(3),
      calibrated_threshold:chosen
    },
    top_neighbors:s.neighbors.slice(0,5).map(n=>({
      rail:n.rail,score:+n.score.toFixed(4),provider_item:n.key,title:n.title
    })),
    decision_authority:"NONE_REVIEW_ONLY",
    production_effect:false
  });
}
const out={
  version:"HUNT-PRODUCT-PLACEMENT-LOCAL-JUDGE-V1.1-GUARDED",
  date:"2026-09-23",mode:"SHADOW_REVIEW_ONLY",production_effect:false,
  training_basis:{
    verified_keep_products:keep.length,
    unknown_products_scored:unknown.length,
    feature_space:"Title TF-IDF; current HUNT category excluded from features",
    nearest_neighbors:7
  },
  calibration:{
    method:"Leave-one-out against verified KEEP products",
    selected_threshold:chosen,
    target_precision:".97 preferred; .95 fallback",
    all_grid_results:grids.sort((a,b)=>b.precision-a.precision||b.coverage-a.coverage).slice(0,30)
  },
  summary:{
    keep_training_products:keep.length,
    unknown_scored:unknown.length,
    review_proposals:proposals.length,
    current_rail_review_support:currentSupport,
    cross_rail_review_candidates:crossReview,
    no_confident_match:noMatch,
    guard_blocked_proposals:guardBlocked
  },
  rules:[
    "Training labels come only from Placement Gate KEEP decisions already supported by deterministic evidence or official supplier taxonomy.",
    "Current HUNT category is not an input feature.",
    "Judge output never creates PASS, KEEP or MOVE automatically.",
    "All outputs are REVIEW_ONLY until Owner-approved evaluation proves acceptable precision.",
    "Semantic guardrails block gender/Kids/accessory conflicts before a proposal is shown.",
    "No Production/storefront/payment/order effect."
  ],
  proposals
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({calibration:out.calibration.selected_threshold,summary:out.summary},null,2));
