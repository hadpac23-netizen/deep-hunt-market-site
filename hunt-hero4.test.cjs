const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const product=fs.readFileSync('product.html','utf8');
const js=fs.readFileSync('hunt-hero4.js','utf8');
const home=fs.readFileSync('hunt-home-3.js','utf8');
const css=fs.readFileSync('hunt-hero4.css','utf8');
const visual=fs.readFileSync('hunt-visual-v2.css','utf8');
const prompt=fs.readFileSync('docs/HUNT-HERO-4.1-DYNAMIC-WORLD-PROMPT.md','utf8');

assert(html.includes('id="hunt-hero4"'),'Hero 4 root missing');
assert(html.includes('id="hd-hero4-video-a"')&&html.includes('id="hd-hero4-video-b"'),'Dual video buffers missing');
assert(html.includes('id="hd-hero4-scene-next"'),'Manual scene control missing');
assert(html.includes('class="hd-hero4-scroll-cue"'),'Hero discovery cue missing');
assert(html.includes('id="hd-hero4-promo"'),'Dynamic promo island missing');
assert(html.includes('id="hd-hero4-search-input"'),'Hero search missing');
assert(!html.includes('id="hd-home3-hero-mosaic"'),'Legacy hero mosaic must remain removed');

for(const city of ['DUBAI','TOKYO','PARIS','URBAN LUXE']) assert(js.includes(city),'Missing scene '+city);
for(const id of ['7277163','18413833','9964385','7062425']) assert(js.includes(id),'Missing verified video source '+id);
assert(js.includes('hunt_destination_market_v1'),'Country-aware scene priority missing');
assert(js.includes('preferredSceneId'),'Scene preference resolver missing');
assert(js.includes('sceneTimer'),'Scene rotation missing');
assert(js.includes('is-active'),'Crossfade active scene state missing');
for(const state of ['idle','peek','open','collapse','hide','feature']) assert(js.includes('"'+state+'"')||js.includes("'"+state+"'"),'Missing promo state '+state);
assert(js.includes('mouseenter')&&js.includes('focusin'),'Promo pause controls missing');
assert(js.includes('sessionStorage'),'Dismiss memory missing');
assert(js.includes('IntersectionObserver'),'Offscreen video control missing');
assert(css.includes('HUNT HERO 4.1 · DYNAMIC WORLD'),'Hero 4.1 design contract missing');
assert(css.includes('hd-hero4-scroll-cue'),'Hero scroll cue styling missing');
assert(css.includes('prefers-reduced-motion'),'Reduced motion missing');

assert(home.includes('topPreference'),'Behavior priority resolver missing');
assert(home.includes('applyPersonalLayout'),'Personal section ordering missing');
assert(home.includes('hunt_destination_market_v1'),'Destination-aware Home copy missing');
assert(product.includes('hd-product-discover-cue'),'Product discovery cue missing');
assert(visual.includes('CONTINUOUS PRODUCT DISCOVERY'),'Product discovery visual contract missing');
assert(prompt.includes('HUNT HERO 4.1'),'Master prompt missing');
console.log('hunt_hero41=PASS');