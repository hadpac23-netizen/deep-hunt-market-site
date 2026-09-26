(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  else root.HuntCheckoutAddress=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const text=v=>String(v??"").trim().replace(/\s+/g," ");
  const email=v=>text(v).toLowerCase();
  const country=v=>text(v).toUpperCase();

  function validate(raw,selectedCountry){
    const value={
      customer_name:text(raw?.customer_name),
      email:email(raw?.email),
      address1:text(raw?.address1),
      address2:text(raw?.address2),
      city:text(raw?.city),
      province:text(raw?.province),
      postal_code:text(raw?.postal_code),
      phone:text(raw?.phone),
      country_code:country(selectedCountry||raw?.country_code)
    };
    const errors={};
    if(value.customer_name.length<2) errors.customer_name="Enter the recipient name.";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email="Enter a valid email address.";
    if(value.address1.length<4) errors.address1="Enter a complete street address.";
    if(value.city.length<2) errors.city="Enter a city.";
    if(value.province.length<2) errors.province="Enter a state, province or region.";
    if(value.postal_code.length<2) errors.postal_code="Enter a postal code.";
    const digits=value.phone.replace(/\D/g,"");
    if(digits.length<7||digits.length>15) errors.phone="Enter a valid phone number.";
    if(!/^[A-Z]{2}$/.test(value.country_code)) errors.country_code="Choose a destination country.";
    return {ok:Object.keys(errors).length===0,errors,value};
  }

  return {validate};
});
