"""내레이션 줄마다 글자 수와 예상 길이를 계산해 영상 자리(슬롯)에 들어가는지 본다.

    python3 tools/vo_check.py cues-short.js cues-fund.js
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from synth import load_cues  # noqa: E402

RATE = 6.5      # 한국어 TTS 기준 초당 음절 수(보통 속도)
PAUSE = {",": 0.15, ".": 0.3, "?": 0.3, "…": 0.4}

for f in sys.argv[1:]:
    c = load_cues(f)
    print(f"\n{f}")
    print(f"{'ID':4} {'시작':>6} {'슬롯':>5} {'음절':>4} {'예상':>5}  판정")
    for v in c["vo"]:
        syl = len(re.findall(r"[가-힣A-Za-z0-9]", v["text"]))
        est = syl / RATE + sum(PAUSE.get(ch, 0) for ch in v["text"])
        slot = v["end"] - v["at"]
        ok = "OK" if est <= slot else f"초과 {est - slot:.1f}s → 속도 {est / slot:.2f}배"
        print(f"{v['id']:4} {v['at']:6.1f} {slot:5.1f} {syl:4d} {est:5.1f}  {ok}")
