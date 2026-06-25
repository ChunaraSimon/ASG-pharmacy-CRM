const https = require("https");
const tests = [
  { method: "GET", path: "/call-logs" },
  { method: "GET", path: "/call-logs/" },
  { method: "POST", path: "/call-logs" },
  { method: "POST", path: "/call-logs/" },
  { method: "POST", path: "/calllogs" },
  { method: "POST", path: "/call_log" },
  { method: "POST", path: "/calls" },
  { method: "GET", path: "/existing-products" },
  { method: "GET", path: "/clients" }
];
let i = 0;
const next = () => {
  if (i >= tests.length) return;
  const t = tests[i++];
  const options = {
    hostname: "asg-crm-production.up.railway.app",
    port: 443,
    path: t.path,
    method: t.method,
    headers: { "Content-Type": "application/json" }
  };
  const req = https.request(options, res => {
    let body = "";
    res.on("data", d => body += d);
    res.on("end", () => {
      console.log(`${t.method} ${t.path} => ${res.statusCode}`);
      if (body) console.log(body.slice(0, 1000));
      console.log('---');
      next();
    });
  });
  req.on("error", e => {
    console.error(`ERROR ${t.method} ${t.path}: ${e.message}`);
    next();
  });
  if (t.method === "POST") req.write(JSON.stringify({ test: "x" }));
  req.end();
};
next();
