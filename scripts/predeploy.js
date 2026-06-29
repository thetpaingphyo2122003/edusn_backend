const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const adminDist = path.join(root, "../edusn_admin/dist/index.html");
const userDist = path.join(root, "../edusn_user/dist/index.html");
const envPath = path.join(root, ".env");

const errors = [];
const warnings = [];

if (!fs.existsSync(adminDist)) {
  errors.push("Missing edusn_admin/dist/index.html — run: npm run build:admin");
}

if (!fs.existsSync(userDist)) {
  warnings.push("Missing edusn_user/dist/index.html — run: npm run build:user if serving the public site");
}

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  const nodeEnv = env.match(/^NODE_ENV=(.+)$/m)?.[1]?.trim();
  const jwtSecret = env.match(/^JWT_SECRET=(.+)$/m)?.[1]?.trim();
  const jwtRefresh = env.match(/^JWT_REFRESH_SECRET=(.+)$/m)?.[1]?.trim();
  const mongoUri = env.match(/^MONGODB_URI=(.+)$/m)?.[1]?.trim();

  if (nodeEnv !== "production") {
    warnings.push("NODE_ENV is not production in edusn_backend/.env");
  }
  if (!mongoUri) {
    errors.push("MONGODB_URI is missing in edusn_backend/.env");
  }
  if (!jwtSecret || jwtSecret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters before production deploy");
  }
  if (!jwtRefresh || jwtRefresh.length < 32) {
    errors.push("JWT_REFRESH_SECRET must be at least 32 characters before production deploy");
  }
} else {
  warnings.push("edusn_backend/.env not found — create it from .env.example on the server");
}

warnings.forEach((message) => console.warn(`⚠️  ${message}`));
errors.forEach((message) => console.error(`❌ ${message}`));

if (errors.length) {
  process.exit(1);
}

console.log("✅ Predeploy checks passed");
