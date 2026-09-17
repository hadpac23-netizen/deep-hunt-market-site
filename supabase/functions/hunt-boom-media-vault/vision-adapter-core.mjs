export const DEFAULT_VISION_MODEL="gpt-5.6-luna";
export const MAX_VISION_FRAMES=5;
export const MAX_FRAME_BYTES=900000;
const clean=v=>String(v??"").trim();
function dataUrlBytes(value){
  const m=clean(value).match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/i);
  if(!m)throw new Error("VISION_FRAME_INVALID");
  const b64=m[2],pad=b64.endsWith("==")?2:b64.endsWith("=")?1:0;
  const bytes=Math.floor((b64.length*3)/4)-pad;
  if(bytes<100||bytes>MAX_FRAME_BYTES)throw new Error("VISION_FRAME_SIZE_INVALID");
  return {url:clean(value),bytes};
}
export function validateVisionFrames(frames){
  if(!Array.isArray(frames)||frames.length<3||frames.length>MAX_VISION_FRAMES)throw new Error("VISION_FRAME_COUNT_INVALID");
  return frames.map((x,i)=>({index:i,...dataUrlBytes(x)}));
}
function validateReferenceImages(values=[]){
  if(!Array.isArray(values)||values.length>3)throw new Error("VISION_REFERENCE_COUNT_INVALID");
  return values.map(v=>{const s=clean(v);if(/^data:image\/(jpeg|png);base64,/i.test(s))return dataUrlBytes(s).url;if(!/^https:\/\//i.test(s))throw new Error("VISION_REFERENCE_INVALID");return s});
}
const schema={type:"object",additionalProperties:false,required:["product_identity","design_pattern","color_fidelity","geometry_fidelity","script_alignment","no_unintended_text","no_unintended_branding","no_major_visual_defects","confidence","notes"],properties:{product_identity:{type:"boolean"},design_pattern:{type:"boolean"},color_fidelity:{type:"boolean"},geometry_fidelity:{type:"boolean"},script_alignment:{type:"boolean"},no_unintended_text:{type:"boolean"},no_unintended_branding:{type:"boolean"},no_major_visual_defects:{type:"boolean"},confidence:{type:"number",minimum:0,maximum:1},notes:{type:"array",maxItems:8,items:{type:"string",maxLength:240}}}};
export function buildOpenAIVisionRequest({frames,reference_images=[],product_name="",script="",model=DEFAULT_VISION_MODEL}={}){
  const fs=validateVisionFrames(frames),refs=validateReferenceImages(reference_images);
  const instruction=`You are BOOM Visual QA. Compare generated ad frames against the verified product reference images. Be conservative and fail uncertain product fidelity. Check product identity, printed design/pattern, colors, geometry/cutouts, script alignment, unintended rendered text/logos/brands, and major visual defects. Do not infer durability or other product claims. Product: ${clean(product_name).slice(0,180)}. Planned shot/script: ${clean(script).slice(0,1200)}`;
  const content=[{type:"input_text",text:instruction},...refs.map(image_url=>({type:"input_image",image_url,detail:"high"})),...fs.map(f=>({type:"input_image",image_url:f.url,detail:"high"}))];
  return {model:clean(model)||DEFAULT_VISION_MODEL,input:[{role:"user",content}],text:{format:{type:"json_schema",name:"boom_visual_qa",strict:true,schema}}};
}
export function parseOpenAIVisionResponse(payload={}){
  let text=clean(payload?.output_text);
  if(!text&&Array.isArray(payload?.output))for(const item of payload.output){if(item?.type!=="message"||!Array.isArray(item.content))continue;for(const c of item.content){if(c?.type==="output_text"&&c?.text){text=String(c.text);break}}if(text)break}
  if(!text)throw new Error("VISION_RESPONSE_EMPTY");
  let d;try{d=JSON.parse(text)}catch{throw new Error("VISION_RESPONSE_JSON_INVALID")}
  const bools=["product_identity","design_pattern","color_fidelity","geometry_fidelity","script_alignment","no_unintended_text","no_unintended_branding","no_major_visual_defects"];
  if(bools.some(k=>typeof d?.[k]!=="boolean"))throw new Error("VISION_RESPONSE_SCHEMA_INVALID");
  const confidence=Number(d?.confidence);if(!Number.isFinite(confidence)||confidence<0||confidence>1)throw new Error("VISION_RESPONSE_CONFIDENCE_INVALID");
  return {...Object.fromEntries(bools.map(k=>[k,d[k]])),confidence,notes:Array.isArray(d?.notes)?d.notes.map(x=>clean(x).slice(0,240)).slice(0,8):[]};
}
