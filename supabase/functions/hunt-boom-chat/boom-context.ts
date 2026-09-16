export function memoryEligible(item:any,nowMs=Date.now()){
  const trust=Math.max(0,Math.min(1,Number(item?.trust_score ?? item?.confidence ?? 0.5)));
  if(Boolean(item?.quarantined))return false;
  if(trust<0.65)return false;
  const expiresAt=item?.expires_at?Date.parse(String(item.expires_at)):NaN;
  if(Number.isFinite(expiresAt)&&expiresAt<=nowMs)return false;
  return true;
}

export function contextUtility(item:any){
  const relevance=Math.max(0,Math.min(1,Number(item?.relevance_score ?? 0.5)));
  const freshness=Math.max(0,Math.min(1,Number(item?.freshness_score ?? 0.5)));
  const trust=Math.max(0,Math.min(1,Number(item?.trust_score ?? item?.confidence ?? 0.5)));
  const tokenCost=Math.max(1,Number(item?.token_cost)||Math.ceil(String(item?.content||"").length/4)||1);
  return ((relevance*0.45)+(freshness*0.25)+(trust*0.30))/Math.max(1,tokenCost/100);
}

export function selectGovernedContext(items:any[],maxTokens=2600,nowMs=Date.now()){
  const ranked=(items||[])
    .filter((x:any)=>memoryEligible(x,nowMs))
    .map((x:any)=>({...x,_utility:contextUtility(x),_token_cost:Math.max(1,Number(x?.token_cost)||Math.ceil(String(x?.content||"").length/4)||1)}))
    .sort((a:any,b:any)=>b._utility-a._utility);
  const selected:any[]=[];
  let used=0;
  for(const item of ranked){
    if(used+item._token_cost>maxTokens)continue;
    used+=item._token_cost;
    selected.push(item);
  }
  return {selected,used_tokens:used,budget_tokens:maxTokens,dropped:Math.max(0,ranked.length-selected.length)};
}

export function canProposeWithPolicy(policy:any){
  if(!policy||policy.enabled===false)return false;
  const level=String(policy.permission_level||"observe");
  return level==="propose"||level==="execute";
}

export function isContinuationMessage(message:string){
  return /^(?:ילה+|יאללה|תמשיך|המשך|נו+|בצע|כן|מאשר|אישור|(?:אשר|אישור)\s+.+(?:production|פרודקשן)\.?|מה עכשיו\??|מה הלאה\??|מה המצב\??|איפה זה עומד(?: עכשיו)?\??|איפה עצרנו\??|לא הבנתי|תסביר|טוב|אוקי|אוקיי|בסדר|(?:היי\s*)?ב[ו]+ם+|boom|hey\s+boom|yes|approved|confirm|confirmed|approve\s+.+production\.?|كمل|يلا|تابع|نعم|موافق|وافق\s+.+production\.?|شو هسه\??|وين وصلنا\??|مش فاهم|اشرح|continue|go on|next|what now\??|where are we\??|explain)$/i.test(String(message||"").trim());
}

export function needsOwnerGate(message:string){
  return /(production|deploy|publish|payment|charge|paid campaign|ad spend|price change|discount|coupon|supplier commitment|contract|פרודקשן|דיפלוי|פרסום בתשלום|קמפיין בתשלום|תשלום|חיוב|מחיר|הנחה|קופון|חוזה|התחייבות לספק|نشر مباشر|دفع|حملة مدفوعة|تغيير سعر|خصم|عقد)/i.test(String(message||""));
}

export function wantsCopyReport(message:string){
  return /(תן\s*(?:לי\s*)?קופי|קופי\s*(?:לצ.?אט|לדיווח)?|סכם\s*(?:לי\s*)?לקופי|תן\s*(?:לי\s*)?דיווח|copy\s*report|copy\s*summary|report\s*for\s*copy|اعطيني\s*تقرير|نسخة\s*للكوبي)/i.test(String(message||""));
}

export function topicLabel(managerId:string){
  const labels:Record<string,string>={
    "boom-super-agent":"BOOM / HUNT",
    "repair-engineering":"HUNT Site & Engineering",
    "site-reliability":"HUNT Site Reliability",
    "release-control":"HUNT Launch & Production",
    "security-access":"BOOM / HUNT Security",
    "supplier-cj":"HUNT Suppliers — CJ",
    "supplier-eprolo":"HUNT Suppliers — EPROLO",
    "supplier-shipping":"HUNT Shipping",
    "inventory-truth":"HUNT Catalog & Inventory",
    "checkout-payment":"HUNT Checkout & Payments",
    "marketing-growth":"HUNT Marketing & Growth",
    "sales-director":"HUNT Sales",
    "pricing-profit":"HUNT Pricing & Profit",
    "daily-10k-mission":"HUNT Growth Mission",
    "dynamic-merchandising":"HUNT Merchandising",
    "f35-research":"BOOM F35 Research",
    "analytics-truth":"HUNT Analytics",
    "integration-connections":"HUNT Integrations"
  };
  return labels[managerId]||("HUNT · "+managerId.replace(/-/g," "));
}

export function deriveTopicState(message:string,current:any,managerId:string,conversationId:string){
  const clean=String(message||"").replace(/\s+/g," ").trim();
  const displayOnly=wantsCopyReport(clean);
  const continuation=isContinuationMessage(clean)||displayOnly;
  const explicitNew=/(?:בלי\s+קשר|נושא\s+אחר|נעבור\s+לנושא|בוא\s+נדבר\s+על|new\s+topic|switch\s+topic|موضوع\s+جديد|خلينا\s+نحكي\s+عن)/i.test(clean);
  const currentManagers=Array.isArray(current?.relevant_managers)?current.relevant_managers:[];
  const managerChanged=managerId&&currentManagers.length>0&&!currentManagers.includes(managerId);
  const switchTopic=!current?.active_topic||explicitNew||(!continuation&&managerChanged&&clean.length>18);
  let history=Array.isArray(current?.topic_history)?current.topic_history.slice(-7):[];
  if(switchTopic&&current?.active_topic){
    history.push({
      topic:String(current.active_topic).slice(0,160),
      goal:String(current.active_goal||"").slice(0,280),
      task:String(current.current_task||"").slice(0,280),
      closed_at:new Date().toISOString()
    });
  }
  const activeTopic=switchTopic?topicLabel(managerId):String(current?.active_topic||topicLabel(managerId));
  const activeGoal=switchTopic?clean.slice(0,500):String(current?.active_goal||clean).slice(0,500);
  const currentTask=continuation
    ?String(current?.current_task||current?.owner_last_instruction||clean).slice(0,500)
    :clean.slice(0,500);
  return {
    active_topic:activeTopic,
    active_goal:activeGoal,
    current_task:currentTask,
    previous_task:switchTopic?String(current?.current_task||"").slice(0,500):String(current?.previous_task||"").slice(0,500),
    unresolved_items:Array.isArray(current?.unresolved_items)?current.unresolved_items:[],
    decisions_made:Array.isArray(current?.decisions_made)?current.decisions_made:[],
    constraints:Array.isArray(current?.constraints)?current.constraints:[],
    owner_last_instruction:continuation
      ?String(current?.owner_last_instruction||clean).slice(0,1000)
      :clean.slice(0,1000),
    next_expected_step:continuation
      ?String(current?.next_expected_step||("Continue "+activeTopic)).slice(0,500)
      :("Verify and continue: "+currentTask).slice(0,500),
    relevant_project:"HUNT",
    relevant_managers:continuation&&currentManagers.length?currentManagers:(managerId?[managerId]:currentManagers),
    relevant_verified_evidence:Array.isArray(current?.relevant_verified_evidence)?current.relevant_verified_evidence:[],
    last_execution_state:current?.last_execution_state&&typeof current.last_execution_state==="object"?current.last_execution_state:{},
    topic_history:history,
    conversation_id:conversationId
  };
}

export function enforceEvidenceLanguage(displayText:string){
  const evidenceHint=/(verified|evidence|runtime|database|\bdb\b|\bapi\b|repository|\brepo\b|http\s*[1-5]\d\d|error\s*code|בדק|אומת|ראיה|قاعدة البيانات|تم التحقق)/i;
  const completionClaim=/(^|\b)(done|completed|finished|deployed|published|fixed|connected|בוצע|הושלם|עלה\s+ל(?:פרודקשן|ייצור)|תוקן|חובר|تم|اكتمل|نُشر)(\b|[.!,:])/i;
  return String(displayText||"")
    .split("\n")
    .map(line=>{
      if(evidenceHint.test(line))return line;
      let safe=line
        .replace(/\b(?:is|are)\s+missing\b/gi,"needs verification")
        .replace(/(^|[:\-]\s*)Missing(?=\s|:)/gi,"$1NEEDS_VERIFICATION")
        .replace(/\bMISSING\b/g,"NEEDS_VERIFICATION");
      if(completionClaim.test(safe)){
        return "NEEDS_VERIFICATION — completion claim withheld until runtime/DB/API/repository evidence is attached.";
      }
      return safe;
    })
    .join("\n");
}

export function toSpokenText(displayText:string){
  let text=String(displayText||"").trim();
  if(/^BOOM COPY REPORT\b/i.test(text)){
    return "הכנתי לך דוח מסודר להעתקה. הוא מופיע עכשיו על המסך.";
  }
  text=text
    .replace(/```[\s\S]*?```/g," יש קטע קוד בתצוגה. ")
    .replace(/https?:\/\/\S+/g,"")
    .replace(/^\s{0,3}#{1,6}\s*/gm,"")
    .replace(/^\s*[-*+]\s+/gm,"")
    .replace(/^\s*\d+[.)]\s+/gm,"")
    .replace(/\*\*([^*]+)\*\*/g,"$1")
    .replace(/__([^_]+)__/g,"$1")
    .replace(/[*_`~#|]/g," ")
    .replace(/[✅☑✔]/g," עבר. ")
    .replace(/[❌✖]/g," לא עבר. ")
    .replace(/[→←•◆◇]/g," ")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu,"")
    .replace(/\s*\n\s*/g,". ")
    .replace(/\s+/g," ")
    .replace(/\.{2,}/g,".")
    .trim();
  return text.slice(0,1800);
}

export function buildCopyReport(ctx:any,topic:any,commandRow:any){
  const attention=(ctx.reports||[]).filter((r:any)=>["critical","blocked","watch"].includes(r.status));
  const latestEvalByMetric=new Map<string,any>();
  for(const e of (ctx.evals||[])){
    const key=String(e?.metric_name||"");
    if(key&&!latestEvalByMetric.has(key))latestEvalByMetric.set(key,e);
  }
  const allLatestEvals=[...latestEvalByMetric.values()]
    .filter((e:any)=>String(e.metric_name)!=="attention_manager_count");
  const decisions=(ctx.project_memory||[]).filter((m:any)=>Number(m.importance)>=5&&m.status==="active").slice(0,5);
  const topicText=(String(topic?.active_topic||"")+" "+String(topic?.active_goal||"")+" "+String(topic?.current_task||"")).toLowerCase();
  const learningMode=/(learning|ai engineering|לימוד|למידה|הנדסת ai|هندسة ai|تعلم)/i.test(topicText);
  const learningItems=(ctx.learning||[]).filter((x:any)=>{
    const d=String(x?.domain||"");
    return ["ai-engineering","agent-architecture","agent-reliability","long-running-agents"].includes(d);
  });
  const learnedItems=learningItems.filter((x:any)=>["learned","adopted"].includes(x.status));
  const testingItems=learningItems.filter((x:any)=>x.status==="testing");
  const evals=(learningMode
    ?allLatestEvals.filter((e:any)=>e.subject_type==="learning_item")
    :allLatestEvals
  ).slice(0,8);
  const evidence=learningMode
    ?[
      "AI learning items: "+String(learningItems.length),
      "Learned and behavior-backed: "+String(learnedItems.length),
      "Still testing: "+String(testingItems.length)
    ]
    :[
      "Open commands: "+String((ctx.open_commands||[]).length),
      "Attention reports: "+String(attention.length)
    ];
  for(const e of evals){
    let line=String(e.metric_name)+": "+String(e.current_value??"n/a");
    if(e.passed===true)line+=" (PASS)";
    else if(e.passed===false)line+=" (NOT PASS)";
    evidence.push(line);
  }
  const blockers=learningMode
    ?testingItems.slice(0,20).map((x:any)=>String(x.title||x.learning_key||"learning item")+" — still testing; requires behavior/eval proof")
    :attention.slice(0,8).map((r:any)=>{
      const issue=Array.isArray(r.issues)&&r.issues.length?" — "+String(r.issues[0]).slice(0,180):"";
      return String(r.manager_id)+": "+String(r.status)+issue;
    });
  const next=String(topic?.next_expected_step||(learningMode
    ?"Validate testing AI-engineering lessons through behavior and evals, then mark only proven lessons as learned."
    :attention?.[0]?.recommended_action)||"Continue the active verified task.").slice(0,500);
  const completed=learningMode
    ?(learnedItems.length
      ?learnedItems.slice(0,12).map((x:any)=>{
        const proof=x.graduation_eval_key?" — eval: "+String(x.graduation_eval_key):"";
        return "Learned: "+String(x.title||x.learning_key||"AI lesson")+proof;
      })
      :["No AI-engineering lesson is marked learned without behavior/eval proof."])
    :(commandRow
      ?["Command #"+String(commandRow.id)+" routed to "+String(commandRow.target_manager_id)+"; current status: "+String(commandRow.status)+". This is routing evidence, not completion proof."]
      :["No live action is marked completed solely because of this chat response."]);
  const ownerDecisions=decisions.length
    ?decisions.map((x:any)=>"- "+String(x.content||"").slice(0,300))
    :["- HUNT is the public brand; BOOM is the internal intelligence and orchestration layer."];
  const blockerLines=blockers.length?blockers.map((x:string)=>"- "+x):["- No blocker is claimed from the current topic context."];
  return [
    "BOOM COPY REPORT",
    "",
    "TOPIC:",
    String(topic?.active_topic||"HUNT / BOOM"),
    "",
    "GOAL:",
    String(topic?.active_goal||topic?.current_task||"Continue the active HUNT/BOOM work."),
    "",
    "COMPLETED:",
    ...completed.map((x:string)=>"- "+x),
    "",
    "VERIFIED EVIDENCE:",
    ...evidence.slice(0,8).map((x:string)=>"- "+x),
    "",
    "CURRENT STATE:",
    "- Current task: "+String(topic?.current_task||"Not set"),
    "- Relevant manager: "+String((topic?.relevant_managers||[])[0]||"BOOM"),
    "",
    "ISSUES / BLOCKERS:",
    ...blockerLines,
    "",
    "OWNER DECISIONS:",
    ...ownerDecisions,
    "",
    "DO NOT CHANGE:",
    "- Do not claim completion without evidence.",
    "- Keep real payments, paid campaigns, supplier commitments, destructive actions and other owner-gated live actions behind explicit approval.",
    "",
    "NEXT ACTION:",
    next,
    "",
    "IMPORTANT CONTEXT:",
    "- Short messages such as ילה / תמשיך / كمل / continue resume the active topic instead of resetting context.",
    "- BOOM should use live DB/API/runtime evidence before declaring something missing or complete."
  ].join("\n");
}
