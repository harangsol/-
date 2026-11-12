"""인스타 숏폼(20초) 음악·효과음.

    python3 score_short.py   → build/score-short.wav (게시용), build/score-short-vo.wav (음성 얹기용)
"""
from pathlib import Path

from synth import (CH, Mix, bell, coin, deflate, impact, key_click, load_cues, pad_chord, pluck, pop, riser,
                   sparkle, thump, tick, whoosh, rng)

ROOT = Path(__file__).parent
C = load_cues(ROOT / "cues-short.js")
m = Mix(C["duration"], C["bpm"])
BARS = ["Am", "Am", "F", "F", "C", "G", "Am", "F", "C", "C"]
chord = lambda t: BARS[min(int(t // m.bar), len(BARS) - 1)]
H, O, RV, S, CT = C["hook"], C["order"], C["reveal"], C["stack"], C["cta"]

# ---- 음악
for st in [i * m.beat for i in range(8)]:
    m.kick(st, 0.8)
m.groove(0, 4, chord, "pulse")
m.groove(4, 6.5, chord, "light")
m.groove(RV["drop"], CT["final"], chord, "full")
m.pads(0, 4, chord, 0.8, 900)
m.pads(4, 6, chord, 0.6, 1600)
m.pads(6, 8, chord, 1.0, 1200)
m.pads(8, CT["final"], chord, 1.0, 2400)
m.add("pad", pad_chord(CH["C"], 2.6, 1.3, 2400), CT["final"], verb=0.4)

# ---- 효과음
m.add("sfx", impact(0.75, 50), 0.0, verb=0.25)
for i, n in enumerate([69, 72, 76, 79, 81]):
    m.add("sfx", pluck(n, 0.4, 1.1), i * 0.12, pan=-0.4 + i * 0.2, verb=0.3)
m.add("sfx", bell(84, 1.0, 0.8), 1.15, verb=0.4)
m.add("sfx", coin(3200), 1.2, 1.2)
m.add("sfx", impact(0.8, 42), H["leak"], verb=0.3)
m.add("sfx", deflate(), H["leak"] + 0.05, 0.9)
for i in range(26):
    m.add("sfx", coin(), H["leak"] + 0.2 + i * 0.045 + rng.uniform(0, 0.05), 0.55, pan=rng.uniform(-0.7, 0.7))
for i in range(4):
    m.add("sfx", pop(0.8), H["leak"] + 0.35 + i * 0.18, pan=-0.3 + i * 0.2)
m.add("sfx", whoosh(0.5), H["out"] - 0.05, 0.6)
m.add("sfx", thump(0.6), O["lineA"])
m.add("sfx", thump(0.9), O["lineB"], verb=0.2)
m.add("sfx", bell(76, 1.2, 0.7), O["lineB"] + 0.02, verb=0.4)
for i in range(4):
    m.add("sfx", tick(2200 + i * 250), O["lineB"] + 0.4 + i * 0.12)
    m.add("sfx", pluck(72 + [0, 4, 7, 12][i], 0.3, 0.6), O["lineB"] + 0.4 + i * 0.12, verb=0.2)
m.add("sfx", whoosh(0.45), O["out"], 0.6)
m.add("sfx", riser(1.35), RV["drop"] - 1.4, 0.8)
for i in range(11):
    m.add("sfx", key_click(), RV["start"] + 0.1 + i * 0.075, 0.9, pan=rng.uniform(-0.3, 0.3))
m.add("sfx", impact(1.3, 40), RV["drop"], verb=0.35)
m.add("sfx", sparkle(1.2, 50), RV["drop"] + 0.05, 1.0, verb=0.4)
m.add("sfx", bell(88, 1.6, 0.9), RV["logo"], verb=0.5)
m.add("sfx", bell(84, 1.6, 0.6), RV["logo"] + 0.08, verb=0.5)
m.add("sfx", whoosh(0.5), RV["out"], 0.7)
m.add("sfx", sparkle(S["rows"][3] - S["rows"][0] + 0.6, 45), S["rows"][0] - 0.15, 0.9)
for k, at in enumerate(S["rows"]):
    m.add("sfx", thump(0.6), at)
    m.add("sfx", bell([72, 76, 79, 84][k], 1.2, 0.7), at + 0.02, verb=0.4)
m.add("sfx", bell(88, 1.2, 0.6), S["glow"], verb=0.5)
m.add("sfx", whoosh(0.45), S["out"], 0.6)
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

m.render(ROOT / "build/score-short.wav", ROOT / "build/score-short-vo.wav")
