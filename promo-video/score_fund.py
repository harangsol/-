"""정책자금 영상(40초) 음악·효과음.

    python3 score_fund.py   → build/score-fund.wav (게시용), build/score-fund-vo.wav (음성 얹기용)
"""
from pathlib import Path

from synth import (CH, ROOT as ROOTNOTE, Mix, bell, error_buzz, impact, load_cues, pad_chord, piano, pluck, pop, riser,
                   scan, snare, sparkle, stamp, thump, tick, whoosh, rng)

ROOT = Path(__file__).parent
C = load_cues(ROOT / "cues-fund.js")
m = Mix(C["duration"], C["bpm"])
# 2초 = 1마디. 0~40초 = 20마디
BARS = ["Am", "Am", "Am", "F", "Gsus", "C", "G", "Am", "F", "C", "G", "Am", "F", "Am", "F", "G", "C", "G", "F", "C"]
chord = lambda t: BARS[min(int(t // m.bar), len(BARS) - 1)]
H, M, O, D, E, N, CT = (C[k] for k in ["hook", "maze", "order", "diagnose", "example", "honest", "cta"])

# ---- 음악
for i in range(8):
    m.kick(i * m.beat, 0.75)
m.groove(0, 4, chord, "pulse")
m.groove(4, 8.5, chord, "light")
m.groove(O["drop"], 14, chord, "full")
m.groove(14, 26, chord, "mid")
m.groove(CT["start"], CT["final"], chord, "full")
m.pads(0, 4, chord, 0.8, 900)
m.pads(4, 8, chord, 0.6, 1400)
m.pads(8, 10, chord, 1.0, 1200)
m.pads(10, 26, chord, 0.9, 2200)
m.pads(26, 32, chord, 1.7, 1500)
m.pads(32, CT["final"], chord, 1.0, 2400)
m.add("pad", pad_chord(CH["C"], 2.6, 1.3, 2400), CT["final"], verb=0.4)
# 정직 구간: 피아노
for at in [N["start"] + 0.1, N["no"], N["line"]]:
    for k, n in enumerate(CH[chord(at)]):
        m.add("lead", piano(n + 12, 2.2, 1.05), at + k * 0.02, pan=-0.2 + k * 0.2, verb=0.5)
    m.add("lead", piano(ROOTNOTE[chord(at)] + 12, 2.2, 1.1), at, verb=0.4)
# 31~32초 스네어 롤
t = 31.0
while t < 32.0:
    p = t - 31.0
    m.add("drums", snare(0.25 + 0.6 * p), t, verb=0.2)
    t += m.beat / 4 if p < 0.5 else m.beat / 8

# ---- 효과음
m.add("sfx", whoosh(0.5), 0.0, 0.6)
m.add("sfx", thump(0.6), 0.2)
m.add("sfx", stamp(1.2), H["stamp"], verb=0.2)
m.add("sfx", impact(0.7, 42), H["stamp"], verb=0.25)
m.add("sfx", whoosh(0.5), H["turn"] - 0.1, 0.6)
m.add("sfx", bell(81, 1.4, 0.8), H["turn"] + 0.35, verb=0.5)
m.add("sfx", bell(88, 1.4, 0.5), H["turn"] + 0.45, verb=0.5)
m.add("sfx", whoosh(0.45), H["out"], 0.5)
for i in range(10):
    m.add("sfx", pop(0.8), M["chips"] + i * M["chipStep"], pan=rng.uniform(-0.6, 0.6))
m.add("sfx", error_buzz(), M["line2"], 0.6)
m.add("sfx", thump(0.7), M["line2"])
m.add("sfx", riser(1.35), O["drop"] - 1.4, 0.8)
m.add("sfx", whoosh(0.45), M["out"], 0.5)
m.add("sfx", impact(1.3, 40), O["drop"], verb=0.35)
m.add("sfx", sparkle(1.0, 50), O["drop"] + 0.05, 1.0, verb=0.4)
for i in range(10):
    m.add("sfx", tick(1800 + i * 90, 0.8), O["drop"] + 0.6 + i * 0.05, pan=-0.5 + i * 0.1)
m.add("sfx", bell(84, 1.2, 0.6), O["sub"], verb=0.4)
m.add("sfx", whoosh(0.45), O["out"], 0.6)
m.add("sfx", thump(0.6), D["start"])
for i, at in enumerate(D["rows"]):
    m.add("sfx", scan(0.35), at, 0.8)
    m.add("sfx", tick(2400, 1.0), at + 0.33)
    m.add("sfx", pluck(72 + [0, 2, 4, 7, 9][i], 0.3, 0.6), at + 0.33, verb=0.25)
m.add("sfx", impact(0.5, 60), D["result"], verb=0.3)
m.add("sfx", bell(84, 1.3, 0.8), D["result"], verb=0.4)
for i in range(4):
    m.add("sfx", pop(0.6), D["loan"] + 0.15 + i * 0.08)
m.add("sfx", whoosh(0.45), D["out"], 0.6)
for i in range(4):
    m.add("sfx", pop(0.6), E["start"] + 0.2 + i * 0.09, pan=-0.4 + i * 0.25)
m.add("sfx", pop(0.9), E["quote"])
m.add("sfx", thump(0.7), E["diag"])
m.add("sfx", sparkle(E["steps"][2] - E["steps"][0] + 0.2, 45), E["steps"][0] - 0.05, 0.9)
for k, at in enumerate(E["steps"]):
    m.add("sfx", bell([76, 79, 84][k], 1.2, 0.75), at, verb=0.4)
m.add("sfx", pop(0.7), E["also"])
m.add("sfx", whoosh(0.45), E["out"], 0.6)
m.add("sfx", thump(0.6), N["start"])
m.add("sfx", stamp(1.0), N["no"], verb=0.3)
m.add("sfx", impact(0.8, 46), N["no"], verb=0.35)
for i in range(2):
    m.add("sfx", pop(0.6), N["chips"] + i * 0.2)
m.add("sfx", riser(1.0), 31.0, 0.55)
m.add("sfx", impact(1.1, 44), CT["start"], verb=0.35)
m.add("sfx", bell(84, 1.6, 0.7), CT["logo"], verb=0.5)
m.add("sfx", pop(1.0), CT["button"])
m.add("sfx", tick(1200, 1.6), CT["tap"])
m.add("sfx", thump(0.6), CT["tap"])
m.add("sfx", bell(88, 1.2, 0.8), CT["tap"] + 0.08, verb=0.4)
m.add("sfx", bell(95, 1.4, 0.7), CT["tap"] + 0.2, verb=0.5)
m.kick(CT["final"], 1.0)
m.add("sfx", impact(0.9, 40), CT["final"], verb=0.5)
for k, n in enumerate([60, 64, 67, 72]):
    m.add("lead", bell(n + 12, 2.5, 0.6), CT["final"] + k * 0.03, verb=0.6)

m.render(ROOT / "build/score-fund.wav", ROOT / "build/score-fund-vo.wav")
