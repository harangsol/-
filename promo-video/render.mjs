// 영상 렌더러: index.html 을 프레임 단위로 캡처해 MP4로 만든다.
//
//   node render.mjs                     전체 렌더 (build/score.wav 가 있으면 음악까지 합침)
//   node render.mjs --stills 0.5,9,20   지정한 초의 정지화면만 build/stills/ 에 저장
//   node render.mjs --fps 60            프레임레이트 변경 (기본: cues.js 의 fps)
//   node render.mjs --workers 4         병렬 브라우저 페이지 수
import { createServer } from "node:http";
import { readFile, mkdir, rm, access } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".wav": "audio/wav", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  try {
    const p = resolve(ROOT, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    const body = await readFile(p);
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html?render`;

const browser = await chromium.launch();
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", e => console.error("[page error]", e.message));
  await page.goto(URL_);
  await page.evaluate(() => window.__ready);
  return page;
}

const sh = (cmd, a) => new Promise((ok, no) => { const p = spawn(cmd, a, { stdio: ["ignore", "inherit", "inherit"] }); p.on("close", c => c === 0 ? ok() : no(new Error(cmd + " exited " + c))); });

if (args.includes("--stills")) {
  const times = opt("--stills").split(",").map(Number);
  const dir = join(ROOT, "build/stills"); await mkdir(dir, { recursive: true });
  const page = await openPage();
  for (const t of times) {
    await page.evaluate(t => window.__seek(t), t);
    await page.screenshot({ path: join(dir, `t${t.toFixed(2).padStart(6, "0")}.jpg`), type: "jpeg", quality: 85 });
  }
  console.log("stills ->", dir);
} else {
  const page0 = await openPage();
  const { duration, cfps } = await page0.evaluate(() => ({ duration: window.__duration, cfps: window.CUES.fps }));
  await page0.close();
  const fps = +opt("--fps", cfps);
  const workers = +opt("--workers", 4);
  const total = Math.round(duration * fps);
  const fdir = join(ROOT, "build/frames");
  await rm(fdir, { recursive: true, force: true }); await mkdir(fdir, { recursive: true });
  let done = 0; const t0 = Date.now();
  const chunk = Math.ceil(total / workers);
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage();
    const a = w * chunk, b = Math.min(total, a + chunk);
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.__seek(t), f / fps);
      await page.screenshot({ path: join(fdir, `f${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 94 });
      if (++done % 60 === 0) process.stdout.write(`\r${done}/${total} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  console.log(`\nframes done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await mkdir(join(ROOT, "out"), { recursive: true });
  const wav = join(ROOT, "build/score.wav");
  const hasAudio = await access(wav).then(() => true, () => false);
  const out = join(ROOT, opt("--out", "out/harangsol-promo-9x16.mp4"));
  const ff = ["-y", "-framerate", String(fps), "-i", join(fdir, "f%05d.jpg")];
  if (hasAudio) ff.push("-i", wav);
  ff.push("-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart");
  if (hasAudio) ff.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  ff.push(out);
  await sh("ffmpeg", ["-hide_banner", "-loglevel", "error", ...ff]);
  console.log("video ->", out, hasAudio ? "(with audio)" : "(no audio)");
}
await browser.close();
server.close();
