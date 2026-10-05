// Copies the site's images from the current WordPress uploads folder into public/media,
// so the new site no longer depends on WordPress being online.
//
//   npm run fetch-media
//   then set VITE_MEDIA_BASE=/media (e.g. in .env or the host's environment settings) and rebuild.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.WP_UPLOADS || "https://wilsonantoine.com/wp-content/uploads/2026/01";
const FILES = [
  "WILson-logo.png",
  "wetgfwertwe.png",
  "view-universe-space-shot-milky-way-galaxy-scaled.webp",
  "africa-madagascar-planet-earth-1-1-scaled.webp",
  "wfwed.png",
  "wilson-mockup-1.webp",
  "wilson-mockup-2.webp",
  "fwefwefwe.png",
  "WILson-moc-6-scaled.webp",
  "cropped-WILson-logo-180x180.png",
];

const out = join(dirname(fileURLToPath(import.meta.url)), "../public/media");
await mkdir(out, { recursive: true });

let failed = 0;
for (const file of FILES) {
  try {
    const res = await fetch(`${BASE}/${file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(out, file), buf);
    console.log(`✓ ${file}  (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    failed++;
    console.error(`✗ ${file}: ${err.message}`);
  }
}
console.log(failed ? `\n${failed} file(s) failed — rerun once the site is reachable.` : "\nAll images saved to public/media. Now set VITE_MEDIA_BASE=/media and rebuild.");
process.exitCode = failed ? 1 : 0;
