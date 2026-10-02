import fs from "node:fs";
import path from "node:path";
import { publicStorefrontPayload } from "../supabase/functions/_shared/public-price-privacy.mjs";

const paths = ["catalog-home.json", "catalog-snapshot.json", ...fs.readdirSync("catalog-shards").filter(x=>x.endsWith(".json")).map(x=>path.join("catalog-shards",x))];
let changed = 0;
for (const file of paths) {
  const original = fs.readFileSync(file,"utf8");
  const sanitized = JSON.stringify(publicStorefrontPayload(JSON.parse(original))) + "\n";
  if (JSON.stringify(JSON.parse(original)) !== sanitized.trimEnd()) {
    fs.writeFileSync(file,sanitized);
    changed++;
  }
}
console.log(JSON.stringify({public_catalog_files:paths.length,sanitized_files:changed}));
