/**
 * scripts/save-logo.mjs
 * Saves the pasted logo from a base64 string or copies it, then uploads to Cloudinary.
 * Usage: node scripts/save-logo.mjs <path-to-logo-file>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = path.join(ROOT, ".env");

// Load .env
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !m[0].trimStart().startsWith("#")) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing Cloudinary credentials in .env");
  process.exit(1);
}

let cloudinary;
try {
  cloudinary = (await import("cloudinary")).v2;
} catch {
  console.error("Run:  npm install cloudinary  first.");
  process.exit(1);
}
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });

const [, , localFile] = process.argv;
const src = localFile ? path.resolve(ROOT, localFile) : path.join(ROOT, "Images", "Career_Spark-LOGO2.png");

if (!fs.existsSync(src)) {
  console.error("File not found:", src);
  process.exit(1);
}

console.log("Uploading logo:", src);
const result = await cloudinary.uploader.upload(src, {
  public_id: "careerspark/brand/logo",
  overwrite: true,
  resource_type: "image",
  // Deliver at original quality; auto-format on delivery
  quality: "auto:best",
  format: "png",
  background: "transparent",
});
console.log("✓ Logo uploaded:", result.secure_url);
console.log("  public_id :", result.public_id);
console.log("  W×H       :", result.width + "×" + result.height);
console.log("  Bytes     :", result.bytes);
