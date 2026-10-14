/**
 * scripts/upload.mjs
 * Server-side Cloudinary upload helper.
 * Run: node scripts/upload.mjs <local-file> <public-id>
 * Example: node scripts/upload.mjs Images/Career_spark\ \(1\).jpg careerspark/gallery/career-spark-01
 *
 * SECURITY: reads CLOUDINARY_API_SECRET from .env — never from the browser.
 * Requires: npm install cloudinary dotenv (run once inside this project)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load .env manually (avoids a dotenv dependency for production)
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !m[0].trimStart().startsWith("#")) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing Cloudinary credentials in .env. Please fill in all three values.");
  process.exit(1);
}

const [, , localFile, publicId] = process.argv;
if (!localFile || !publicId) {
  console.error("Usage: node scripts/upload.mjs <local-file> <public-id>");
  process.exit(1);
}

// Dynamic import so the script still loads even if cloudinary is not installed
let cloudinary;
try {
  cloudinary = (await import("cloudinary")).v2;
} catch {
  console.error("Please run:  npm install cloudinary\n  then retry.");
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });

const abs = path.resolve(ROOT, localFile);
console.log(`Uploading ${abs} → ${publicId} …`);
try {
  const result = await cloudinary.uploader.upload(abs, { public_id: publicId, overwrite: true, resource_type: "auto" });
  console.log("✓ Uploaded:", result.secure_url);
  console.log("  Format:", result.format, "| Size:", result.bytes, "bytes", "| W×H:", result.width + "×" + result.height);
} catch (err) {
  console.error("Upload failed:", err.message || err);
  process.exit(1);
}
