const test=require("node:test");
const assert=require("node:assert/strict");
const {validate}=require("../checkout-address.js");

const valid={
  customer_name:" Ada   Lovelace ",
  email:"ADA@example.com ",
  address1:" 12 Example Street ",
  address2:"",
  city:" London ",
  province:" Greater London ",
  postal_code:" SW1A 1AA ",
  phone:"+44 20 7946 0958"
};

test("normalizes a complete shipping address",()=>{
  const result=validate(valid,"gb");
  assert.equal(result.ok,true);
  assert.equal(result.value.customer_name,"Ada Lovelace");
  assert.equal(result.value.email,"ada@example.com");
  assert.equal(result.value.country_code,"GB");
});

test("rejects incomplete address data",()=>{
  const result=validate({...valid,address1:"",phone:"12"},"GB");
  assert.equal(result.ok,false);
  assert.ok(result.errors.address1);
  assert.ok(result.errors.phone);
});

test("rejects invalid email and country",()=>{
  const result=validate({...valid,email:"bad"},"");
  assert.equal(result.ok,false);
  assert.ok(result.errors.email);
  assert.ok(result.errors.country_code);
});
