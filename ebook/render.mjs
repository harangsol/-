// book.html → PDF (Chromium 인쇄 엔진). build.py가 호출한다.
// 사용: node render.mjs <입력.html> <출력.pdf> <제목>
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [, , input, output, title] = process.argv;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(input).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: output,
    preferCSSPageSize: true,
    printBackground: true,
    outline: true, // PDF 책갈피(장 제목)
    tagged: true,
  });
  console.log(`PDF 저장: ${output} (${title})`);
} finally {
  await browser.close();
}
