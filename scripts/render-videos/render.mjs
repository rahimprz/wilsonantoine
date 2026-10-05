// Renders the looping background videos in public/videos from shaders.html.
//
//   npm i -D playwright-core   (once; Chromium must be installed, e.g. `npx playwright install chromium`)
//   node scripts/render-videos/render.mjs [nebula|tunnel|ascent ...]
//
// Each video is rendered frame by frame in headless Chromium (WebGL), piped into ffmpeg as raw RGBA,
// and written as an H.264 MP4 plus a VP9 WebM and a WebP poster. ffmpeg must be on PATH.
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../../public/videos");
const workDir = join(tmpdir(), "wa-video-render");
mkdirSync(outDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

const VIDEOS = {
  nebula: { file: "nebula-drift", seconds: 16, fps: 24 },
  tunnel: { file: "light-tunnel", seconds: 12, fps: 24 },
  ascent: { file: "rising-light", seconds: 14, fps: 24 },
};
const WIDTH = 1280;
const HEIGHT = 720;

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(VIDEOS);

const { chromium } = await import("playwright-core").catch(() => import("playwright"));
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({
  executablePath,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

function run(cmd, args, input) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: [input ? "pipe" : "ignore", "ignore", "inherit"] });
    p.on("error", fail);
    p.on("close", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))));
    if (input) input(p.stdin);
  });
}

for (const name of names) {
  const spec = VIDEOS[name];
  if (!spec) throw new Error(`Unknown video "${name}". Options: ${Object.keys(VIDEOS).join(", ")}`);
  const frames = spec.seconds * spec.fps;
  const master = join(workDir, `${spec.file}.master.mp4`);

  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.goto(pathToFileURL(join(here, "shaders.html")).href);
  const renderer = await page.evaluate(([n, w, h]) => window.setup(n, w, h), [name, WIDTH, HEIGHT]);
  console.log(`\n▶ ${name}: ${frames} frames @ ${WIDTH}x${HEIGHT} (${renderer})`);

  const started = Date.now();
  await run(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${WIDTH}x${HEIGHT}`, "-r", String(spec.fps),
      "-i", "-", "-vf", "vflip", "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv444p", master],
    async (stdin) => {
      for (let i = 0; i < frames; i++) {
        const b64 = await page.evaluate(([t, s]) => window.renderFrame(t, s), [i / frames, i % 61]);
        const buf = Buffer.from(b64, "base64");
        if (!stdin.write(buf)) await new Promise((r) => stdin.once("drain", r));
        if (i % 24 === 0) {
          const per = (Date.now() - started) / (i + 1);
          process.stdout.write(`  frame ${i}/${frames}  ~${Math.round(((frames - i) * per) / 1000)}s left\r`);
        }
      }
      stdin.end();
    },
  );
  await page.close();

  const mp4 = join(outDir, `${spec.file}.mp4`);
  const webm = join(outDir, `${spec.file}.webm`);
  const poster = join(outDir, `${spec.file}.webp`);
  for (const f of [mp4, webm, poster]) if (existsSync(f)) rmSync(f);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", master, "-c:v", "libx264", "-preset", "slow", "-crf", "25",
    "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", master, "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0",
    "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-an", webm]);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", master, "-frames:v", "1", "-c:v", "libwebp", "-quality", "78", poster]);
  console.log(`\n✓ ${name} → public/videos/${spec.file}.{mp4,webm,webp} in ${Math.round((Date.now() - started) / 1000)}s`);
}

await browser.close();
