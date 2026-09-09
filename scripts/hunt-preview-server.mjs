import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8793);
const remoteBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
const mime = {
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".svg":"image/svg+xml",
  ".webp":"image/webp"
};
function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath === "/" ? "/hunt-light-v2.html" : urlPath);
  const candidate = path.resolve(repo, "." + decoded);
  if (!candidate.startsWith(repo + path.sep)) return null;
  return candidate;
}

async function proxy(req,res,url) {
  const target = remoteBase + url.pathname.slice("/functions/v1".length) + url.search;
  const body = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : await new Promise((resolve,reject)=>{
        const chunks=[];
        req.on("data",c=>chunks.push(c));
        req.on("end",()=>resolve(Buffer.concat(chunks)));
        req.on("error",reject);
      });
  const headers = {};
  for (const name of ["apikey","content-type","authorization"]) {
    if (req.headers[name]) headers[name]=req.headers[name];
  }
  const upstream = await fetch(target,{method:req.method,headers,body,redirect:"manual"});
  res.statusCode=upstream.status;
  upstream.headers.forEach((value,key)=>{
    if (!["content-encoding","content-length","transfer-encoding","access-control-allow-origin"].includes(key.toLowerCase())) {
      res.setHeader(key,value);
    }
  });
  res.setHeader("Cache-Control","no-store");
  if (req.method === "HEAD") return res.end();
  res.end(Buffer.from(await upstream.arrayBuffer()));
}
const server = http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (url.pathname.startsWith("/functions/v1/")) {
      return await proxy(req,res,url);
    }
    const file = safeFile(url.pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.statusCode=404;
      return res.end("Not found");
    }
    res.statusCode=200;
    res.setHeader("Content-Type",mime[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.setHeader("Cache-Control","no-store");
    fs.createReadStream(file).pipe(res);
  } catch(error) {
    res.statusCode=502;
    res.setHeader("Content-Type","text/plain; charset=utf-8");
    res.end("Preview proxy error: " + (error instanceof Error ? error.message : "unknown"));
  }
});
server.listen(port,"127.0.0.1",()=>{
  console.log("HUNT preview: http://127.0.0.1:" + port + "/hunt-light-v2.html");
});
