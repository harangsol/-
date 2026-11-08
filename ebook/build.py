"""전자책 원고(Markdown)를 A5 PDF로 만든다.

    pip install markdown
    npm install playwright && npx playwright install chromium   # 처음 한 번
    python build.py --author "회사 이름" --cta "kmong.com/... 또는 메일 주소"

결과: dist/나라장터-첫-입찰-가이드.pdf (+ 확인용 dist/book.html)
한글 글꼴은 나눔 글꼴(나눔바른고딕·나눔스퀘어)을 씁니다. 없으면 시스템 기본 한글 글꼴로 대체됩니다.
"""

from __future__ import annotations

import argparse
import html
import re
import subprocess
import sys
from pathlib import Path

import markdown

HERE = Path(__file__).resolve().parent
DEFAULT_CTA = "이 책을 받으신 판매 페이지의 문의하기로 연락 주세요."

CSS = r"""
@page {
  size: 148mm 210mm;
  margin: 18mm 16mm 20mm;
  @bottom-center { content: counter(page); font: 8.5pt "NanumBarunGothic", sans-serif; color: #90a4ae; }
}
@page cover { margin: 0; @bottom-center { content: none; } }
@page front { @bottom-center { content: none; } }

:root { --ink: #263238; --sub: #546e7a; --line: #dfe5ea; --accent: #1565c0; --accent-soft: #e3f2fd; --warm: #fff8e1; }
html { font-family: "NanumBarunGothic", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: var(--ink);
       font-size: 9.6pt; line-height: 1.78; word-break: keep-all; overflow-wrap: break-word; }
body { margin: 0; counter-reset: chapter; }

/* 표지 */
.cover { page: cover; height: 210mm; position: relative; overflow: hidden; break-after: page;
         background: linear-gradient(160deg, #0d47a1 0%, #1565c0 55%, #1e88e5 100%); color: #fff; }
.cover .grid { position: absolute; inset: 0; opacity: .13;
  background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
  background-size: 9mm 9mm; }
.cover .inner { position: absolute; left: 16mm; right: 16mm; top: 34mm; }
.cover .kicker { font: 800 9pt "NanumSquare", sans-serif; letter-spacing: .12em; opacity: .85; }
.cover h1.title { font: 800 34pt/1.22 "NanumSquare", sans-serif; margin: 6mm 0 0; padding: 0; border: none; break-before: auto; }
.cover h1.title::before { content: none; }
.cover .subtitle { margin-top: 6mm; font-size: 11pt; line-height: 1.6; opacity: .92; }
.cover .stamp { margin-top: 12mm; display: inline-block; padding: 2mm 4mm; border: 1px solid rgba(255,255,255,.6);
                border-radius: 2mm; font-size: 8.5pt; }
.cover .foot { position: absolute; left: 16mm; right: 16mm; bottom: 18mm; font-size: 9pt; opacity: .9; }
.cover .checks { position: absolute; right: 14mm; bottom: 40mm; width: 46mm; }
.cover .checks div { background: rgba(255,255,255,.14); border-radius: 2mm; margin-top: 2mm; padding: 2mm 3mm; font-size: 8pt; }
.cover .checks div::before { content: "✓ "; font-weight: 800; }

/* 판권 · 목차 */
.front { page: front; break-after: page; }
.front h2 { font: 800 13pt "NanumSquare", sans-serif; margin: 0 0 3mm; }
.toc ol { list-style: none; padding: 0; margin: 0; counter-reset: toc; }
.toc li { display: flex; gap: 3mm; padding: 1.5mm 0; font-size: 9.4pt; line-height: 1.5; border-bottom: 1px solid var(--line); }
.toc li .no { color: var(--accent); font-weight: 800; min-width: 10mm; }
.toc li .subs { margin-top: .3mm; font-size: 7.6pt; line-height: 1.55; color: var(--sub); }
.imprint { font-size: 8.4pt; color: var(--sub); line-height: 1.7; }
.imprint p { margin: 0 0 3mm; }

/* 본문 */
h1 { font: 800 17pt/1.35 "NanumSquare", sans-serif; margin: 0 0 7mm; padding-bottom: 4mm;
     border-bottom: 2px solid var(--accent); break-before: page; break-after: avoid; }
h1:not(.unnumbered) { counter-increment: chapter; }
h1:not(.unnumbered)::before { content: counter(chapter) "장"; display: block; font-size: 9pt; letter-spacing: .1em;
                               color: var(--accent); margin-bottom: 1.5mm; }
h2 { font: 800 12pt/1.4 "NanumSquare", sans-serif; margin: 8mm 0 2.5mm; break-after: avoid; color: #0d47a1; }
p { margin: 0 0 3mm; orphans: 2; widows: 2; }
strong { font-weight: 700; color: #102027; }
ul, ol { margin: 0 0 3.5mm; padding-left: 5.5mm; }
li { margin: 0 0 1.5mm; }
li > p { margin: 0 0 1mm; }

table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 8.4pt; line-height: 1.55; break-inside: auto; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th { background: #eef3f8; color: #0d47a1; font-weight: 700; text-align: left; }
th, td { border: 1px solid var(--line); padding: 1.6mm 2.2mm; vertical-align: top; }
tr > :first-child { white-space: nowrap; }

blockquote { margin: 3mm 0 5mm; padding: 3.5mm 4.5mm; background: var(--warm); border-radius: 2.5mm;
             border-left: 3px solid #f9a825; break-inside: avoid; }
blockquote p { margin: 0 0 1.5mm; }
blockquote p:last-child { margin: 0; }
blockquote strong:first-child { display: block; margin-bottom: 1mm; color: #6d4c41; }

ul.checklist { list-style: none; padding-left: 0; }
li.check { position: relative; padding-left: 7mm; margin-bottom: 3mm; break-inside: avoid; }
li.check::before { content: ""; position: absolute; left: 0; top: 1.3mm; width: 3.4mm; height: 3.4mm;
                   border: 1.4px solid var(--accent); border-radius: .8mm; }
li.check strong:first-child { display: block; }
li.check:not(:has(strong)) { margin-bottom: 1.4mm; }

.pagebreak { break-before: page; height: 0; }
.end { margin-top: 12mm; text-align: center; color: var(--sub); font-size: 8.5pt; }
"""


def split_front_matter(text: str) -> tuple[dict, str]:
    meta: dict[str, str] = {}
    if text.startswith("---"):
        _, fm, body = text.split("---", 2)
        for line in fm.strip().splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
        return meta, body
    return meta, text


def to_html(body_md: str) -> str:
    md = markdown.Markdown(extensions=["tables", "attr_list", "sane_lists"])
    out = md.convert(body_md)
    # 체크리스트: "- [ ] 항목" → 네모 상자 목록
    out = re.sub(r"<li>(\s*<p>)?\s*\[ \]\s*", lambda m: '<li class="check">' + (m.group(1) or ""), out)
    out = re.sub(r"<ul>(\s*<li class=\"check\">)", r'<ul class="checklist">\1', out)
    return out


def toc_html(body_html: str) -> str:
    entries: list[dict] = []
    chapter = 0
    for level, attrs, inner in re.findall(r"<h([12])([^>]*)>(.*?)</h\1>", body_html, flags=re.S):
        text = html.escape(re.sub(r"<[^>]+>", "", inner).strip())
        if level == "1":
            no = ""
            if "unnumbered" not in attrs:
                chapter += 1
                no = f"{chapter}장"
            entries.append({"no": no, "title": text, "subs": []})
        elif entries and entries[-1]["no"] and "unnumbered" not in attrs:
            entries[-1]["subs"].append(text)
    items = []
    for e in entries:
        subs = f'<div class="subs">{" · ".join(e["subs"])}</div>' if e["subs"] else ""
        items.append(f'<li><span class="no">{e["no"]}</span><div><div>{e["title"]}</div>{subs}</div></li>')
    return '<section class="front toc"><h2>차례</h2><ol>' + "".join(items) + "</ol></section>"


def build(author: str, cta: str, out_dir: Path) -> Path:
    src = (HERE / "first-bid-guide.md").read_text(encoding="utf-8")
    meta, body = split_front_matter(src)
    body = body.replace("{{CTA}}", cta)
    body_html = to_html(body)

    title, subtitle, edition = meta.get("title", ""), meta.get("subtitle", ""), meta.get("edition", "")
    by = f"<div>{html.escape(author)} 지음</div>" if author else ""
    cover_title = html.escape(title).replace(" 첫 ", "<br>첫 ", 1)
    cover = f"""
<section class="cover"><div class="grid"></div>
  <div class="inner">
    <div class="kicker">공공조달 입문 실무서</div>
    <h1 class="title unnumbered">{cover_title}</h1>
    <div class="subtitle">{html.escape(subtitle)}</div>
    <div class="stamp">{html.escape(edition)} · 용역·물품 입찰 기준</div>
  </div>
  <div class="checks"><div>입찰 준비물 체크리스트</div><div>공고문 읽는 10가지</div><div>첫 실적 만드는 법</div><div>제안서 평가 구조</div></div>
  <div class="foot">{by}</div>
</section>"""
    imprint = f"""
<section class="front imprint">
  <h2>이 책에 대하여</h2>
  <p>{html.escape(title)} — {html.escape(subtitle)}</p>
  <p>{html.escape(edition)}{(' · ' + html.escape(author)) if author else ''}</p>
  <p>이 책은 2026년 11월 기준의 공개 자료와 실제 입찰공고 사례를 바탕으로 정리한 입문서입니다.
  계약 제도와 금액 기준은 바뀔 수 있으며, 개별 입찰에는 언제나 해당 공고문과 현행 법령이 우선합니다.
  이 책의 내용은 법률 자문이 아니며, 중요한 판단 전에는 발주기관이나 전문가에게 확인하시기 바랍니다.</p>
  <p>이 책의 저작권은 지은이에게 있습니다. 구입하신 분이 업무에 참고하는 것 외에 무단 복제·재배포·재판매를 금합니다.</p>
</section>"""
    doc = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>{CSS}</style></head><body>{cover}{imprint}{toc_html(body_html)}
<main>{body_html}<p class="end">— 끝 —</p></main></body></html>"""

    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = out_dir / "book.html"
    html_path.write_text(doc, encoding="utf-8")
    pdf_path = out_dir / "나라장터-첫-입찰-가이드.pdf"
    subprocess.run(["node", str(HERE / "render.mjs"), str(html_path), str(pdf_path), title], check=True)
    return pdf_path


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--author", default="", help="표지에 넣을 지은이(회사) 이름. 비우면 생략")
    p.add_argument("--cta", default=DEFAULT_CTA, help="9장 알림 서비스 신청처(판매 페이지 주소나 메일)")
    p.add_argument("--out", default=str(HERE / "dist"))
    args = p.parse_args()
    pdf = build(args.author, args.cta, Path(args.out))
    print(f"완성: {pdf}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
