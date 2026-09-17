const num=(v,min=0,max=100)=>{const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error("VISUAL_QA_SCORE_INVALID");return n};
const bool=v=>v===true;
const text=v=>String(v??"").trim();
export const VISUAL_QA_VERSION="v1";
export function buildVisualQAPlan(input={}){
  if(!text(input.mission_id)||!text(input.asset_id))throw new Error("VISUAL_QA_ASSET_IDENTITY_REQUIRED");
  if(!text(input.storage_path))throw new Error("VISUAL_QA_STORAGE_PATH_REQUIRED");
  const refs=Array.isArray(input.reference_images)?input.reference_images.filter(x=>typeof x==="string"&&x.trim()).slice(0,4):[];
  if(!refs.length)throw new Error("VISUAL_QA_REFERENCE_IMAGE_REQUIRED");
  return {version:VISUAL_QA_VERSION,mode:"analysis_only",asset:{mission_id:text(input.mission_id),asset_id:text(input.asset_id),storage_path:text(input.storage_path)},reference_images:refs,checks:["product_identity","design_pattern","color_fidelity","geometry_fidelity","script_alignment","unintended_text","unintended_branding","major_visual_defects"],required_output_schema:{product_identity:0,design_pattern:0,color_fidelity:0,geometry_fidelity:0,script_alignment:0,no_unintended_text:true,no_unintended_branding:true,no_major_visual_defects:true,confidence:0,notes:[]},publishing_allowed:false};
}
export function evaluateVisualQA(result={}){
  const scores={product_identity:num(result.product_identity),design_pattern:num(result.design_pattern),color_fidelity:num(result.color_fidelity),geometry_fidelity:num(result.geometry_fidelity),script_alignment:num(result.script_alignment)};
  const confidence=num(result.confidence,0,1);
  const hard={product_identity:scores.product_identity>=90,design_pattern:scores.design_pattern>=85,color_fidelity:scores.color_fidelity>=80,geometry_fidelity:scores.geometry_fidelity>=85,script_alignment:scores.script_alignment>=70,no_unintended_text:bool(result.no_unintended_text),no_unintended_branding:bool(result.no_unintended_branding),no_major_visual_defects:bool(result.no_major_visual_defects),confidence:confidence>=0.75};
  const failed=Object.entries(hard).filter(([,v])=>!v).map(([k])=>k);
  const weighted=Math.round(scores.product_identity*.25+scores.design_pattern*.2+scores.color_fidelity*.15+scores.geometry_fidelity*.15+scores.script_alignment*.25);
  return {version:VISUAL_QA_VERSION,status:failed.length?"VISUAL_QA_FAILED":"VISUAL_QA_PASSED",score:weighted,confidence,scores,hard_gates:hard,failed_gates:failed,notes:Array.isArray(result.notes)?result.notes.slice(0,12).map(text).filter(Boolean):[],publishing_allowed:false,requires_owner_review:true};
}
export function visualQAEvidence(v={}){if(v?.status!=="VISUAL_QA_PASSED")throw new Error("VISUAL_QA_PASS_REQUIRED");return {visual_qa_passed:true,visual_qa_score:Number(v.score),visual_qa_version:text(v.version||VISUAL_QA_VERSION)};}
