const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const userDir = path.join(__dirname, "../../edusn_user");
const distDir = path.join(userDir, "dist");

console.log("Building user site...");
execSync("npm run build", { cwd: userDir, stdio: "inherit" });

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("User site build failed: dist/index.html not found");
  process.exit(1);
}

console.log("User site build OK:", distDir);
