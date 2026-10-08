#!/usr/bin/env python3
"""
사이트 문구에 실제로 쓰인 글자만 담은 Pretendard 가변 폰트(woff2) 한 개를 만든다.
→ public/fonts/pretendard-site.woff2 (layout.tsx 에서 preload)

문구를 크게 바꿨다면 다시 실행한다. 다시 실행하지 않아도 빠진 글자는
public/fonts/pretendard/ 의 동적 서브셋이 자동으로 채워주므로 깨지지 않는다.

준비: pip install fonttools brotli
      PretendardVariable.woff2 원본(npm pack pretendard → dist/web/variable/woff2/)
사용: python3 scripts/build-site-font.py <PretendardVariable.woff2 경로>
"""
import pathlib, sys
from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
text = set()
for p in list((root / "src").rglob("*.ts")) + list((root / "src").rglob("*.tsx")):
    text.update(p.read_text(encoding="utf-8"))
chars = {c for c in text if "가" <= c <= "힣"}
chars |= {chr(c) for c in range(0x20, 0x7F)}
chars |= set("·‘’“”…–—×→")

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["kern", "liga", "calt", "tnum"]
opts.hinting = False
opts.desubroutinize = True
font = subset.load_font(sys.argv[1], opts)
s = subset.Subsetter(opts)
s.populate(text="".join(sorted(chars)))
s.subset(font)
out = root / "public/fonts/pretendard-site.woff2"
subset.save_font(font, str(out), opts)
print(f"{len([c for c in chars if ord(c) > 0x7f])} glyph chars → {out.relative_to(root)} ({out.stat().st_size // 1024} KB)")
