const assert=require("assert");
const M=require("./boom-storage-migrations.js");
class MemoryStorage{
  constructor(seed={}){this.data={...seed};}
  getItem(k){return Object.prototype.hasOwnProperty.call(this.data,k)?String(this.data[k]):null;}
  setItem(k,v){this.data[k]=String(v);}
  removeItem(k){delete this.data[k];}
}
let s=new MemoryStorage({hunt_language:"he"});
let r=M.run(s);
assert.equal(r.language.state,"MIGRATED");
assert.equal(s.getItem("hunt_language_v1"),"he");
assert.equal(s.getItem("hunt_language"),null);

s=new MemoryStorage({hunt_language:"iw-IL"});
r=M.run(s);
assert.equal(r.language.value,"he");
assert.equal(s.getItem("hunt_language_v1"),"he");

s=new MemoryStorage({hunt_language_v1:"ar",hunt_language:"en"});
r=M.run(s);assert.equal(r.language.state,"CURRENT");
assert.equal(s.getItem("hunt_language_v1"),"ar");
assert.equal(s.getItem("hunt_language"),null);

s=new MemoryStorage({hunt_language:"xx-INVALID"});
r=M.run(s);
assert.equal(r.language.state,"INVALID_LEGACY");
assert.equal(s.getItem("hunt_language"),"xx-INVALID");
assert.equal(s.getItem("hunt_language_v1"),null);

s=new MemoryStorage({hunt_language:"fr"});
M.run(s); r=M.run(s);
assert.equal(r.language.state,"CURRENT");
assert.equal(s.getItem("hunt_language_v1"),"fr");

assert.equal(M.normalizeLanguage("HE-il"),"he");
assert.equal(M.normalizeLanguage("de"),"");
console.log("BOOM storage migrations: PASS — language migration is validated, safe and idempotent");