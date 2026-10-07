// Build хийсэн апп-ыг асааж, гол хаягууд зөв хариу өгч байгааг шалгана (Supabase-гүйгээр).
// Ажиллуулах: NEXT_PUBLIC_ROOT_DOMAIN=localhost:3999 npm run build && npm run smoke
import { spawn } from "node:child_process";
import http from "node:http";

const PORT = 3999;

// fetch() Host толгойг солихыг зөвшөөрдөггүй тул node:http ашиглана
const get = (host, path) =>
  new Promise(resolve => {
    const req = http.request({ host: "127.0.0.1", port: PORT, path, headers: { host } }, res => {
      res.resume();
      resolve({ status: res.statusCode });
    });
    req.on("error", e => resolve({ status: `ERR ${e.message}` }));
    req.end();
  });


const ROOT = `localhost:${PORT}`;
const checks = [
  // [host, path, хүлээгдэх статус(ууд)]
  [ROOT, "/", [200]],
  [ROOT, "/guide", [200]],
  [ROOT, "/terms", [200]],
  [ROOT, "/privacy", [200]],
  [ROOT, "/login", [200]],
  [ROOT, "/signup", [200]],
  [ROOT, "/admin/login", [200]],
  [ROOT, "/admin/dashboard", [307]],
  [ROOT, "/setup", [307]],
  [ROOT, "/dashboard", [307]],
  [ROOT, "/t/x/documents", [307]],
  [ROOT, "/manifest.webmanifest", [200]],
  [ROOT, "/robots.txt", [200]],
  [ROOT, "/sitemap.xml", [200]],
  [ROOT, "/icon.png", [200]],
  [ROOT, "/opengraph-image.png", [200]],
  [ROOT, "/push-sw.js", [200]],
  [ROOT, "/d/not-a-token", [404]],
  [ROOT, "/no-such-page", [404]],
  [`app.${ROOT}`, "/", [307]],
  [`demo.${ROOT}`, "/documents", [307]],
  [`demo.${ROOT}`, "/login", [200]],
  [`demo.${ROOT}`, "/manifest.webmanifest", [200]],
  [`demo.${ROOT}`, "/t/demo/app-icon/192", [200]],
];

const server = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], { stdio: ["ignore", "pipe", "pipe"], env: process.env });
let log = "";
server.stdout.on("data", d => (log += d));
server.stderr.on("data", d => (log += d));

const wait = ms => new Promise(r => setTimeout(r, ms));
let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  await wait(500);
  ready = typeof (await get(ROOT, "/robots.txt")).status === "number";
}

let failed = 0;
for (const [host, path, ok] of checks) {
  const res = await get(host, path);
  const pass = ok.includes(res.status);
  if (!pass) failed++;
  console.log(`${pass ? "✓" : "✗"} ${String(res.status).padEnd(4)} ${host}${path}`);
}
server.kill();
if (failed) {
  console.error(`\n${failed} шалгалт амжилтгүй.\n--- server log ---\n${log.slice(-3000)}`);
  process.exit(1);
}
console.log("\nБүх шалгалт амжилттай.");
