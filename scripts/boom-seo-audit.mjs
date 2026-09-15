import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const targets=["index.html","category.html","product.html"];
const exists=f=>fs.existsSync(path.join(root,f));
const has=(s,re)=>re.test(s);
const jsFor={"category.html":"category.js","product.html":"product.js"};
const rows=targets.map(file=>{
  const html=fs.readFileSync(path.join(root,file),"utf8");
  const jsName=jsFor[file];
  const js=jsName&&exists(jsName)?fs.readFileSync(path.join(root,jsName),"utf8"):"";
  const title=has(html,/<title>[^<]{3,}<\/title>/i);
  const description=has(html,/<meta\s+name=["']description["'][^>]+content=["'][^"']{20,}["']/i);
  const canonical=has(html,/<link\s+rel=["']canonical["'][^>]+href=/i)
    || /rel\s*=\s*["']canonical["']|canonical\.href\s*=/.test(js);
  const indexable=!has(html,/<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i);
  const structuredData=has(html,/application\/ld\+json/i)
    || /application\/ld\+json|CollectionPage|["@']Product["@']/.test(js);
  const internalLinks=(html.match(/href=["'](?!https?:|mailto:|tel:|#)[^"']+/gi)||[]).length>=4;
  const productionCanonical=file==="index.html"
    ? html.includes("https://deep-hunt-market.netlify.app/")
    : js.includes("https://deep-hunt-market.netlify.app");
  return {file,title,description,canonical,productionCanonical,indexable,structuredData,internalLinks,sitemap:exists("sitemap.xml")};
});
const summary={
  generated_at:new Date().toISOString(),
  production_origin:"https://deep-hunt-market.netlify.app",
  search_console_connected:false,
  pages:rows,
  counts:{
    pages:rows.length,
    missing_canonical:rows.filter(x=>!x.canonical).length,
    non_production_canonical:rows.filter(x=>!x.productionCanonical).length,
    missing_structured_data:rows.filter(x=>!x.structuredData).length,
    missing_description:rows.filter(x=>!x.description).length,
    sitemap_present:exists("sitemap.xml")
  }
};
fs.writeFileSync(path.join(root,"boom-seo-audit.json"),JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary.counts));