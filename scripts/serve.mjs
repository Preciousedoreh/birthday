import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain", ".ico": "image/x-icon" };

if (!existsSync(root)) throw new Error("Build the site first with npm run build.");

http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname); }
  catch { response.writeHead(400).end(); return; }
  const candidate = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (candidate !== root && !candidate.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  const file = [candidate, `${candidate}.html`, resolve(candidate, "index.html")].find(path => existsSync(path) && statSync(path).isFile());
  if (!file) { response.writeHead(404).end(); return; }
  response.writeHead(200, { "Content-Type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8` });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`Static site ready at http://127.0.0.1:${port}`));
