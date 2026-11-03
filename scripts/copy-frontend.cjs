const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "frontend/dist");
const target = path.join(root, "backend/public");

if (!fs.existsSync(path.join(source, "index.html"))) {
  throw new Error("Missing React dist/index.html");
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

if (!fs.existsSync(path.join(target, "index.html"))) {
  throw new Error("Frontend copy failed");
}

console.log("React production files copied to backend/public");
