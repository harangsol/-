"""섞은 영상(38초) 음악·효과음.

    python3 score_mix.py   → build/score-mix.wav (게시용), build/score-mix-vo.wav (음성 얹기용)
"""
from pathlib import Path

from synth import (CH, ROOT as ROOTNOTE, Mix, bell, impact, load_cues, pad_chord, piano, pluck, pop, riser,
                   scan, snare, sparkle, stamp, thump, tick, whoosh, rng)

ROOT = Path(__file__).parent
C = load_cues(ROOT / "cues-mix.js")
m = Mix(C["duration"], C["bpm"])
# 2초 = 1마디. 0~38초 = 19마디
BARS = ["Am", "F", "C", "G", "Am", "F", "Gsus", "C", "G", "Am", "F", "C", "Am", "F", "G", "C", "G", "F", "C"]
chord = lambda t: BARS[min(int(t // m.bar), len(BARS) - 1)]
H, CF, FD, M, O, D, N, CT = (C[k] for k in ["hook", "cafe", "funds", "maze", "order", "diagnose", "honest", "cta"])

# ---- 음악: 사람 장면은 잔잔하게, 14초 "순서부터 정리합니다"에서 터진다
m.groove(0, 9.5, chord, "light")
m.groove(9.5, 12.5, chord, "light")
m.groove(O["drop"], 18, chord, "full")
m.groove(18, 24, chord, "mid")
m.groove(CT["start"], CT["final"], chord, "full")
m.pads(0, 8, chord, 0.9, 1300)
m.pads(8, 14, chord, 0.8, 1500)
m.pads(14, 24, chord, 0.9, 2200)
m.pads(24, 30, chord, 1.7, 1500)
m.pads(30, CT["final"], chord, 1.0, 2400)
m.add("pad", pad_chord(CH["C"], 2.6, 1.3, 2400), CT["final"], verb=0.4)
for at in [N["start"] + 0.1, N["no"], N["line"]]:
    for k, n in enumerate(CH[chord(at)]):
        m.add("lead", piano(n + 12, 2.2, 1.05), at + k * 0.02, pan=-0.2 + k * 0.2, verb=0.5)
    m.add("lead", piano(ROOTNOTE[chord(at)] + 12, 2.2, 1.1), at, verb=0.4)
t = 29.0
while t < 30.0:
    p = t - 29.0
    m.add("drums", snare(0.25 + 0.6 * p), t, verb=0.2)
    t += m.beat / 4 if p < 0.5 else m.beat / 8

# ---- 효과음
m.add("sfx", whoosh(0.5), 0.0, 0.5)
m.add("sfx", bell(76, 1.2, 0.5), 0.05, verb=0.4)
m.add("sfx", thump(0.5), H["line3"])
m.add("sfx", tick(2400, 1.0), H["mark"])
m.add("sfx", bell(84, 1.0, 0.6), H["mark"], verb=0.4)
m.add("sfx", whoosh(0.4), CF["start"] - 0.2, 0.6)
m.add("sfx", thump(0.5), CF["line1"])
m.add("sfx", thump(0.5), CF["line2"])
m.add("sfx", whoosh(0.4), CF["out"] - 0.05, 0.6)
m.add("sfx", impact(0.6, 55), FD["main"], verb=0.3)
m.add("sfx", bell(84, 1.4, 0.8), FD["main"], verb=0.5)
m.add("sfx", sparkle(0.8, 50), FD["main"], 0.9, verb=0.4)
for i in range(2):
    m.add("sfx", pop(0.8), FD["chips"] + i * 0.18)
m.add("sfx", whoosh(0.4), FD["out"], 0.5)
for i in range(10):
    m.add("sfx", pop(0.8), M["chips"] + i * M["chipStep"], pan=rng.uniform(-0.6, 0.6))
m.add("sfx", thump(0.6), M["line1"])
m.add("sfx", thump(0.7), M["line2"])
m.add("sfx", riser(1.35), O["drop"] - 1.4, 0.8)
m.add("sfx", impact(1.3, 40), O["drop"], verb=0.35)
m.add("sfx", sparkle(1.0, 50), O["drop"] + 0.05, 1.0, verb=0.4)
for i in range(10):
    m.add("sfx", tick(1800 + i * 90, 0.8), O["drop"] + 0.6 + i * 0.05, pan=-0.5 + i * 0.1)
m.add("sfx", bell(84, 1.2, 0.6), O["sub"], verb=0.4)
m.add("sfx", whoosh(0.45), O["out"], 0.6)
m.add("sfx", thump(0.6), D["start"])
for i, at in enumerate(D["rows"]):
    m.add("sfx", scan(0.3), at - 0.12, 0.7)
    m.add("sfx", tick(2400, 1.0), at + 0.15)
    m.add("sfx", pluck(72 + [0, 2, 4, 7, 9][i], 0.3, 0.6), at + 0.15, verb=0.25)
m.add("sfx", impact(0.5, 60), D["result"], verb=0.3)
m.add("sfx", bell(84, 1.3, 0.8), D["result"], verb=0.4)
m.add("sfx", whoosh(0.45), D["out"], 0.6)
m.add("sfx", thump(0.6), N["start"])
m.add("sfx", stamp(1.0), N["no"], verb=0.3)
m.add("sfx", impact(0.8, 46), N["no"], verb=0.35)
for i in range(2):
    m.add("sfx", pop(0.6), N["chips"] + i * 0.2)
m.add("sfx", riser(1.0), 29.0, 0.55)
m.add("sfx", impact(1.1, 44), CT["start"], verb=0.35)
m.add("sfx", bell(84, 1.6, 0.8), CT["start"] + 0.1, verb=0.5)
m.add("sfx", bell(88, 1.6, 0.5), CT["start"] + 0.18, verb=0.5)
m.add("sfx", pop(1.0), CT["button"])
m.add("sfx", pop(0.6), CT["guide"])
m.add("sfx", tick(1200, 1.6), CT["tap"])
m.add("sfx", thump(0.6), CT["tap"])
m.add("sfx", bell(88, 1.2, 0.8), CT["tap"] + 0.08, verb=0.4)
m.add("sfx", bell(95, 1.4, 0.7), CT["tap"] + 0.2, verb=0.5)
m.kick(CT["final"], 1.0)
m.add("sfx", impact(0.9, 40), CT["final"], verb=0.5)
for k, n in enumerate([60, 64, 67, 72]):
    m.add("lead", bell(n + 12, 2.5, 0.6), CT["final"] + k * 0.03, verb=0.6)

m.render(ROOT / "build/score-mix.wav", ROOT / "build/score-mix-vo.wav")
