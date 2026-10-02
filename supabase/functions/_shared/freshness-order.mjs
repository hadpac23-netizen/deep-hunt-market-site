export function freshnessEvidenceDisposition(latestObservedAt,latestEvidenceVersion,incomingObservedAt,incomingEvidenceVersion){
  const incoming=Date.parse(String(incomingObservedAt||""));
  if(!Number.isFinite(incoming))return "INVALID_EVIDENCE_TIME";
  if(latestEvidenceVersion&&incomingEvidenceVersion&&String(latestEvidenceVersion)===String(incomingEvidenceVersion)){
    return "IDEMPOTENT_REPLAY";
  }
  const latest=Date.parse(String(latestObservedAt||""));
  if(Number.isFinite(latest)&&latest>incoming)return "STALE_EVIDENCE_REJECTED";
  return "APPLY";
}
