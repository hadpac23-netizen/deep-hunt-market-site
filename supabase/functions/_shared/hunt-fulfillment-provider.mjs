const clean=(v)=>typeof v==="string"?v.trim():"";

const EPROLO_COUNTRY_NAMES=Object.freeze({
  IL:"Israel",US:"United States",GB:"United Kingdom",DE:"Germany",
  FR:"France",CA:"Canada",AU:"Australia",AE:"United Arab Emirates"
});

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

function finiteNonNegative(value){
  if(value===null||value===undefined||value==="")return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?n:null;
}

function buildEproloShadowOrderContract({sessionId,idempotencyKey,countryCode,shipping,group}={}){
  if(classifyProvider(group?.provider)!=="eprolo")throw new Error("EPROLO_PROVIDER_REQUIRED");
  const lines=Array.isArray(group?.line_items)?group.line_items:[];
  const destination=clean(countryCode).toUpperCase();
  const countryName=EPROLO_COUNTRY_NAMES[destination]||"";
  const orderId=("HEP-"+clean(sessionId)).slice(0,80);
  const orderNumber=("HEP-"+clean(idempotencyKey)).slice(0,80);
  const taxParts=lines.map(line=>({
    verified:line?.eprolo_tax_cost_verified===true,
    value:finiteNonNegative(line?.eprolo_tax_cost_usd)
  }));
  const taxCostVerified=lines.length>0&&taxParts.every(x=>x.verified&&x.value!==null);
  const taxCost=taxCostVerified?Number(taxParts.reduce((sum,x)=>sum+Number(x.value),0).toFixed(2)):null;
  const variantNamespaceVerified=lines.length>0&&lines.every(line=>
    line?.eprolo_order_variant_verified===true&&presence(line?.variant_id)
  );
  const quantityVerified=lines.length>0&&lines.every(line=>{
    const qty=Number(line?.qty);
    return Number.isInteger(qty)&&qty>=1&&qty<=5;
  });
  const provinceCode=clean(shipping?.shippingProvinceCode);
  const requiredPresence={
    tax_cost:taxCostVerified,
    order_id:presence(orderId),
    shipping_country:presence(countryName),
    shipping_country_code:presence(destination),
    shipping_province:presence(shipping?.shippingProvince),
    shipping_province_code:presence(provinceCode),
    shipping_post_code:presence(shipping?.shippingZip),
    shipping_city:presence(shipping?.shippingCity),
    shipping_name:presence(shipping?.shippingCustomerName),
    shipping_address:presence(shipping?.shippingAddress),
    order_number:presence(orderNumber),
    "orderItemlist[].variantsid":variantNamespaceVerified,
    "orderItemlist[].quantity":quantityVerified
  };
  const missing=Object.entries(requiredPresence).filter(([,ok])=>!ok).map(([key])=>key);
  const lineItems=lines.map((line,index)=>({
    line_reference:String(index+1),
    item_id:clean(line?.item_id),
    variant_id:clean(line?.variant_id),
    quantity:Math.max(1,Math.min(5,Number(line?.qty||1)||1)),
    eprolo_order_variant_verified:line?.eprolo_order_variant_verified===true
  }));
  return {
    contract_version:"HUNT_EPROLO_ORDER_SHADOW_V2",
    mode:"shadow",
    provider:"EPROLO",
    official_endpoint:{path:"add_order.html",method:"POST",mutating:true,contract_documented:true,execution_verified:false},
    merchant_order_reference:orderId,
    idempotency_reference:clean(idempotencyKey).slice(0,120),
    destination_country_code:destination,
    shipping_method:clean(group?.shipping_method).slice(0,120),
    line_items:lineItems,
    official_required_fields_present:requiredPresence,
    official_required_fields_missing:missing,
    official_request_preview:{
      tax_cost:taxCost,
      order_id:orderId||null,
      shipping_country:countryName||null,
      shipping_country_code:destination||null,
      shipping_province:presence(shipping?.shippingProvince)?"<collected>":null,
      shipping_province_code:provinceCode||null,
      shipping_post_code:presence(shipping?.shippingZip)?"<collected>":null,
      shipping_city:presence(shipping?.shippingCity)?"<collected>":null,
      shipping_name:presence(shipping?.shippingCustomerName)?"<collected>":null,
      shipping_address:presence(shipping?.shippingAddress)?"<collected>":null,
      order_number:orderNumber||null,
      orderItemlist:lineItems.map(line=>({
        variantsid:line.eprolo_order_variant_verified?line.variant_id:null,
        quantity:line.quantity
      }))
    },
    official_request_ready:missing.length===0,
    endpoint_contract_documented:true,
    endpoint_execution_verified:false,
    supplier_submission_allowed:false,
    supplier_order_side_effect:false
  };
}

export {classifyProvider,normalizedSupplierProvider,buildEproloShadowOrderContract};
