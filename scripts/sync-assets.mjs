/**
 * AR: مصدر الصور الموحّد هو مجلد `assets/` في جذر المشروع (يخدم index.html القديم).
 * EN: Canonical image source is repo-root `assets/` (legacy static HTML uses it).
 *
 * AR: هذا السكربت ينسخ الملفات إلى `public/assets` لأن Next.js يخدم `public/` فقط.
 * EN: Copies into `public/assets` because Next.js only serves the `public/` folder.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "assets");
const targetDir = path.join(rootDir, "public", "assets");

function main() {
  if (!fs.existsSync(sourceDir)) {
    console.warn(
      `[sync-assets] Missing source folder: ${sourceDir} (skipping copy).`,
    );
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const from = path.join(sourceDir, entry.name);
    const to = path.join(targetDir, entry.name);
    fs.copyFileSync(from, to);
  }

  console.log(`[sync-assets] Synced files from assets/ -> public/assets/`);
}

main();
