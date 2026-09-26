export const PAYPLUS_CHARGE_METHODS=Object.freeze({
  0:"CARD_CHECK_J2",
  1:"CHARGE_J4",
  2:"APPROVAL_J5",
  3:"RECURRING",
  4:"REFUND_J4",
  5:"TOKEN_J2"
});

const scalar=(v)=>{
  if(v===null||v===undefined||v==="")return null;
  if(typeof v==="string"||typeof v==="number"||typeof v==="boolean")return v;
  return null;
};
const int=(v)=>{
  const n=Number(v);
  return Number.isInteger(n)?n:null;
};

export function statusFingerprint(body={}){
  const root=body?.data??body??{};
  const candidates=[
    root?.transaction,
    Array.isArray(root?.transactions)?root.transactions[0]:null,
    root?.data?.transaction,
    Array.isArray(root?.data)?root.data[0]:null,
    root
  ].filter(x=>x&&typeof x==="object");
  const tx=candidates[0]||{};

  const chargeMethod=int(
    tx?.charge_method??tx?.chargeMethod??
    root?.charge_method??root?.chargeMethod
  );

  const resultRoot=root?.results&&typeof root.results==="object"?root.results:{};
  return Object.freeze({
    charge_method:chargeMethod,
    charge_method_name:chargeMethod!==null?PAYPLUS_CHARGE_METHODS[chargeMethod]||null:null,
    status:scalar(tx?.status??root?.status??resultRoot?.status),
    code:scalar(tx?.code??root?.code??resultRoot?.code),
    description:typeof (tx?.description??root?.description??resultRoot?.description)==="string"
      ?String(tx?.description??root?.description??resultRoot?.description).slice(0,160)
      :null
  });
}

export function classifyPayPlusStatus(body={}){
  const fingerprint=statusFingerprint(body);
  const method=fingerprint.charge_method;

  let state="UNKNOWN_HOLD";
  if(method===0)state="CARD_CHECK_NOT_PAID";
  else if(method===1)state="CHARGE_CANDIDATE_SANDBOX_PROOF_REQUIRED";
  else if(method===2)state="APPROVAL_NOT_PAID";
  else if(method===3)state="RECURRING_CANDIDATE_SANDBOX_PROOF_REQUIRED";
  else if(method===4)state="REFUND_CANDIDATE_SANDBOX_PROOF_REQUIRED";
  else if(method===5)state="TOKEN_NOT_PAID";

  return Object.freeze({
    state,
    fingerprint,
    recognized_charge_method:Object.prototype.hasOwnProperty.call(PAYPLUS_CHARGE_METHODS,String(method)),
    sandbox_status_proven:false,
    accepted_paid:false,
    paid_state_write_allowed:false,
    refund_state_write_allowed:false,
    execute_actions:false
  });
}