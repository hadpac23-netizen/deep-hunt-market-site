const clean=(v)=>typeof v==="string"?v.trim():"";

function classifyProvider(value){
  const provider=clean(value).toLowerCase();
  if(provider.includes("eprolo"))return "eprolo";
  if(provider.includes("cj"))return "cj";
  return "unsupported";
}

function normalizedSupplierProvider(value){
  const kind=classifyProvider(value);
  if(kind==="eprolo")return "EPROLO";
  if(kind==="cj")return "CJdropshipping";
  return clean(value)||"UNKNOWN";
}

function presence(value){
  return Boolean(clean(value));
}

function buildEproloShadowOrderContract({sessionId,idempotencyKey,countryCode,shipping,group}={}){
  if(classifyProvider(group?.provider)!=="eprolo")throw new Error("EPROLO_PROVIDER_REQUIRED");
  const lines=Array.isArray(group?.line_items)?group.line_items:[];
  const destination=clean(countryCode).toUpperCase();
  const requiredPresence={
    customer_name:presence(shipping?.shippingCustomerName),
    address1:presence(shipping?.shippingAddress),
    city:presence(shipping?.shippingCity),
    province:presence(shipping?.shippingProvince),
    postal_code:presence(shipping?.shippingZip),
    phone:presence(shipping?.shippingPhone),
    country_code:presence(destination)
  };
  return {
    contract_version:"HUNT_EPROLO_ORDER_SHADOW_V1",
    mode:"shadow",
    provider:"EPROLO",
    merchant_order_reference:("HEP-"+clean(sessionId)).slice(0,80),
    idempotency_reference:clean(idempotencyKey).slice(0,120),
    destination_country_code:destination,
    shipping_method:clean(group?.shipping_method).slice(0,120),
    shipping_required_fields_present:requiredPresence,
    line_items:lines.map((line,index)=>({
      line_reference:String(index+1),
      item_id:clean(line?.item_id),
      variant_id:clean(line?.variant_id),
      quantity:Math.max(1,Math.min(5,Number(line?.qty||1)||1))
    })),
    endpoint_verified:false,
    supplier_submission_allowed:false,
    supplier_order_side_effect:false
  };
}

export {classifyProvider,normalizedSupplierProvider,buildEproloShadowOrderContract};
