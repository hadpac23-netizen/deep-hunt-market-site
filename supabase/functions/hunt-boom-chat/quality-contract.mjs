export function redactSecrets(text){
  return String(text||"")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g,"[REDACTED_API_KEY]")
    .replace(/\bgsk_[A-Za-z0-9_-]{12,}\b/g,"[REDACTED_API_KEY]")
    .replace(/\bAQ\.[A-Za-z0-9._-]{12,}\b/g,"[REDACTED_API_KEY]")
    .replace(/\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*[^\s,;]+/gi,"service_role=[REDACTED]");
}

export function scoreOwnerChatContract(message,reply,commandRow,ownerGateRequired=false){
  const text=String(reply||"").trim();
  if(!text)return {score:null,checks:[]};

  const checks=[];
  const hasEvidence=/(verified|evidence|proof|runtime|database|\bdb\b|\bapi\b|repository|\brepo\b|אומת|ראיה|בדק|تم التحقق|دليل)/i.test(text);
  const withheld=/NEEDS_VERIFICATION|needs verification|דורש אימות|צריך אימות|يتطلب التحقق/i.test(text);
  const completionClaim=/(^|\b)(done|completed|finished|deployed|published|fixed|connected|בוצע|הושלם|תוקן|חובר|تم|اكتمل|نُشر)(\b|[.!,:])/i.test(text);
  const rawSecret=/\bsk-[A-Za-z0-9_-]{12,}\b|\bgsk_[A-Za-z0-9_-]{12,}\b|\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*[^\s,;]+/i.test(text);
  const liveActionClaim=/(charged|payment activated|published live|deployed to production|order routed|חיוב בוצע|תשלום הופעל|פורסם חי|עלה לפרודקשן|הזמנה נשלחה|تم الخصم|تم النشر|تم التفعيل)/i.test(text);
  const gateLanguage=/(owner|approval|gate|אישור|בעלים|مالك|موافقة)/i.test(text);

  checks.push({key:"non_empty",pass:true});
  checks.push({key:"no_raw_secret",pass:!rawSecret});
  checks.push({key:"completion_has_evidence",pass:!completionClaim||hasEvidence||withheld});
  checks.push({key:"owner_gate_respected",pass:!ownerGateRequired||!liveActionClaim||gateLanguage||withheld});
  if(commandRow){
    checks.push({
      key:"command_not_auto_completed",
      pass:!/(command\s*#?\d+\s*(?:done|completed)|פקודה\s*#?\d+\s*(?:בוצעה|הושלמה))/i.test(text)||hasEvidence||withheld
    });
  }

  return {
    score:Number((checks.filter(x=>x.pass).length/checks.length).toFixed(4)),
    checks
  };
}

export function qualityForAttempt(attempt,qualityScore){
  if(attempt?.reply_accepted!==true)return null;
  if(qualityScore===null||qualityScore===undefined||String(qualityScore).trim()==="")return null;
  const n=Number(qualityScore);
  return Number.isFinite(n)?Math.max(0,Math.min(1,n)):null;
}
