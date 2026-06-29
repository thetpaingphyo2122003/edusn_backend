const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const adminDir = path.join(__dirname, "../../edusn_admin");
const distDir = path.join(adminDir, "dist");

console.log("Building admin panel...");
execSync("npm run build", { cwd: adminDir, stdio: "inherit" });

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("Admin build failed: dist/index.html not found");
  process.exit(1);
}

console.log("Admin build OK:", distDir);
