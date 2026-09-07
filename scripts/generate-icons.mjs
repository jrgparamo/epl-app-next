// Regenerates all app icons from public/logo/epl-app-next.png.
// Uses the sharp build that ships with Next.js (no extra dependency).
// Run: node scripts/generate-icons.mjs  (then build favicon.ico, see README of this task)
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/logo/epl-app-next.png");
const APP = path.join(ROOT, "src/app");
const PUB = path.join(ROOT, "public");
const TMP = path.join(ROOT, ".icon-tmp");

// Matches the .dark --background token in globals.css: oklch(0.147 0.004 49.3)
const DARK = "#0c0a09";
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function lionBuffer(box) {
  return sharp(SRC)
    .resize(box, box, {
      fit: "contain",
      background: TRANSPARENT,
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function icon(
  size,
  contentFraction,
  background,
  outPath,
  opaque = false,
) {
  const lion = await lionBuffer(Math.round(size * contentFraction));
  let img = sharp({
    create: { width: size, height: size, channels: 4, background },
  }).composite([{ input: lion, gravity: "center" }]);
  if (opaque) img = img.flatten({ background }).removeAlpha();
  await img.png().toFile(outPath);
  console.log("wrote", path.relative(ROOT, outPath));
}

await mkdir(TMP, { recursive: true });

// Dark, opaque icons for iOS home screen + Android/PWA install.
await icon(180, 0.78, DARK, path.join(APP, "apple-icon.png"), true);
await icon(192, 0.78, DARK, path.join(PUB, "icon-192.png"), true);
await icon(512, 0.78, DARK, path.join(PUB, "icon-512.png"), true);
// Maskable needs extra safe-zone padding (content within the inner ~80% circle).
await icon(512, 0.62, DARK, path.join(PUB, "icon-maskable-512.png"), true);

// Transparent browser-tab icon (modern) + sizes for the legacy .ico.
await icon(64, 0.9, TRANSPARENT, path.join(APP, "icon.png"));
for (const s of [16, 32, 48]) {
  await icon(s, 0.94, TRANSPARENT, path.join(TMP, `favicon-${s}.png`));
}

console.log("done");
