// 영상 렌더러: HTML 장면을 프레임 단위로 캡처해 MP4로 만든다.
//
//   node render.mjs                                   본편(index.html) → out/harangsol-promo-9x16.mp4
//   node render.mjs --page short.html --fps 60 \
//        --mux build/score-short.wav=out/a.mp4 \
//        --mux build/score-short-vo.wav=out/b.mp4     프레임 한 번 뽑아 음악별로 여러 파일 만들기
//   node render.mjs --page fund.html --mux-only --mux ...   이미 뽑은 프레임으로 음악만 다시 합치기
//   node render.mjs --page fund.html --stills 0.5,9,20      정지화면만 build/stills-<page>/ 에 저장
//   --variant ad  광고판 문구로 렌더 (페이지 주소에 ?ad 를 붙임)
//   --workers 4   병렬 브라우저 페이지 수
import { createServer } from "node:http";
import { readFile, mkdir, rm, access, readdir } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const opts = k => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));

const PAGE = opt("--page", "index.html");
const VARIANT = opt("--variant", "");
const TAG = PAGE.replace(/\.html$/, "") + (VARIANT ? `-${VARIANT}` : "");
const FRAMES = join(ROOT, TAG === "index" ? "build/frames" : `build/frames-${TAG}`);
let MUX = opts("--mux").map(s => s.split("="));
if (!MUX.length && TAG === "index") MUX = [["build/score.wav", opt("--out", "out/harangsol-promo-9x16.mp4")]];

const sh = (cmd, a) => new Promise((ok, no) => { const p = spawn(cmd, a, { stdio: ["ignore", "inherit", "inherit"] }); p.on("close", c => c === 0 ? ok() : no(new Error(cmd + " exited " + c))); });
const exists = p => access(p).then(() => true, () => false);

async function mux(fps) {
  await mkdir(join(ROOT, "out"), { recursive: true });
  for (const [wav, out] of MUX) {
    const w = join(ROOT, wav), o = join(ROOT, out);
    const hasAudio = await exists(w);
    const ff = ["-y", "-framerate", String(fps), "-i", join(FRAMES, "f%05d.jpg")];
    if (hasAudio) ff.push("-i", w);
    ff.push("-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart");
    if (hasAudio) ff.push("-c:a", "aac", "-b:a", "192k", "-shortest");
    ff.push(o);
    await sh("ffmpeg", ["-hide_banner", "-loglevel", "error", ...ff]);
    console.log("video ->", out, hasAudio ? `(audio: ${wav})` : "(no audio)");
  }
}

if (args.includes("--mux-only")) {
  const n = (await readdir(FRAMES)).filter(f => f.endsWith(".jpg")).length;
  const fps = +opt("--fps", 60);
  console.log(`${n} frames @ ${fps}fps`);
  await mux(fps);
  process.exit(0);
}

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
const URL_ = `http://127.0.0.1:${server.address().port}/${PAGE}?render${VARIANT ? "&" + VARIANT : ""}`;

const browser = await chromium.launch();
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", e => console.error("[page error]", e.message));
  await page.goto(URL_);
  await page.evaluate(() => window.__ready);
  return page;
}

if (args.includes("--stills")) {
  const times = opt("--stills").split(",").map(Number);
  const dir = join(ROOT, TAG === "index" ? "build/stills" : `build/stills-${TAG}`);
  await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
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
  await rm(FRAMES, { recursive: true, force: true }); await mkdir(FRAMES, { recursive: true });
  let done = 0; const t0 = Date.now();
  const chunk = Math.ceil(total / workers);
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage();
    const a = w * chunk, b = Math.min(total, a + chunk);
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.__seek(t), f / fps);
      await page.screenshot({ path: join(FRAMES, `f${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 94 });
      if (++done % 120 === 0) console.log(`${done}/${total} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await mux(fps);
}
await browser.close();
server.close();
