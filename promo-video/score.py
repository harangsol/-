"""하랑솔루션 홍보영상 음악·효과음 합성.

cues.js 의 타이밍을 읽어 120BPM 음악과 효과음을 만들고 build/score.wav 로 저장한다.
외부 샘플을 쓰지 않고 전부 수식으로 합성하므로 저작권 걱정이 없다.

    python3 score.py
"""
import json
import re
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

ROOT = Path(__file__).parent
SR = 48000
rng = np.random.default_rng(7)

raw = (ROOT / "cues.js").read_text(encoding="utf-8")
raw = "\n".join(l for l in raw.splitlines() if not l.strip().startswith("//"))
C = json.loads(re.sub(r"^\s*window\.CUES\s*=\s*", "", raw).strip().rstrip(";"))
DUR = C["duration"]
N = int((DUR + 0.5) * SR)
BEAT = 60 / C["bpm"]
BAR = BEAT * 4

# 버스(bus): 각각 [2, N]
bus = {k: np.zeros((2, N)) for k in ["drums", "bass", "pad", "lead", "sfx", "verb"]}


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output="sos")


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def add(name, sig, t0, gain=1.0, pan=0.0, verb=0.0):
    """mono 또는 stereo 신호를 버스에 더한다. pan -1(왼쪽)~1(오른쪽)."""
    i = int(round(t0 * SR))
    if i >= N or i + 1 <= 0:
        return
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        st = np.vstack([sig * l, sig * r]) * np.sqrt(2)
    else:
        st = sig
    a, b = max(i, 0), min(i + st.shape[1], N)
    seg = st[:, a - i:b - i] * gain
    bus[name][:, a:b] += seg
    if verb:
        bus["verb"][:, a:b] += seg * verb


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ------------------------------------------------------------- 악기
def kick(vel=1.0):
    t = tt(0.5)
    f = 46 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 6.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.4
    return np.tanh((s + click) * 1.6) * vel


def clap(vel=1.0):
    t = tt(0.35)
    n = rng.standard_normal(len(t))
    n = sosfilt(sos("bandpass", [900, 3200]), n)
    e = np.zeros(len(t))
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR)
        e[i:] += np.exp(-(t[i:] - d) * (180 if k < 2 else 16))
    return n * e * 0.9 * vel


def hat(vel=1.0, open_=False):
    t = tt(0.4 if open_ else 0.08)
    n = sosfilt(sos("highpass", 7000), rng.standard_normal(len(t)))
    return n * np.exp(-t * (9 if open_ else 70)) * 0.35 * vel


def snare(vel=1.0):
    t = tt(0.25)
    n = sosfilt(sos("bandpass", [1500, 7000]), rng.standard_normal(len(t))) * np.exp(-t * 28)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 35) * 0.5
    return (n + body) * 0.6 * vel


def saw(f, t, detune=0.0):
    ph = (f * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def bass_note(m, dur, vel=1.0):
    t = tt(dur)
    f = mtof(m)
    s = saw(f, t) * 0.6 + np.sin(2 * np.pi * f * t) * 0.8
    s = sosfilt(sos("lowpass", 520), s)
    return np.tanh(s * 1.4) * adsr(len(t), 0.004, 0.04) * np.exp(-t * 2.2) * vel


def pad_chord(notes, dur, vel=1.0, cutoff=1700):
    t = tt(dur)
    out = np.zeros((2, len(t)))
    for m in notes:
        f = mtof(m)
        for ch, dt in enumerate([-0.006, 0.006]):
            out[ch] += saw(f, t, dt) + saw(f, t, dt * 0.5) * 0.6
    sv = sos("lowpass", cutoff)
    out = np.vstack([sosfilt(sv, out[0]), sosfilt(sv, out[1])])
    e = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.4).clip(0, 1)
    return out * e * 0.08 * vel


def bell(m, dur=1.4, vel=1.0):
    t = tt(dur)
    f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
         + 0.45 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 5)
         + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 8)
         + 0.12 * np.sin(2 * np.pi * f * 4.2 * t) * np.exp(-t * 12))
    return s * adsr(len(t), 0.002, 0.05) * 0.35 * vel


def pluck(m, dur=0.35, vel=1.0):
    t = tt(dur)
    f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
         + 0.15 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t * 60))
    return s * np.exp(-t * 11) * adsr(len(t), 0.001, 0.02) * 0.4 * vel


def piano(m, dur=2.0, vel=1.0):
    t = tt(dur)
    f = mtof(m)
    s = np.zeros(len(t))
    for k in range(1, 7):
        s += np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k)) * np.exp(-t * (1.2 + k * 0.9)) / k
    return s * adsr(len(t), 0.003, 0.15) * 0.3 * vel


def sweep_noise(dur, f0, f1, q=1.0, shape="up"):
    """중심 주파수가 움직이는 대역 통과 노이즈 (블록 단위 필터)."""
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 256
    for i in range(0, n, blk):
        p = i / n
        fc = f0 * (f1 / f0) ** p
        lo, hi = max(40, fc / (1 + q)), min(SR / 2 - 100, fc * (1 + q))
        out[i:i + blk] = sosfilt(sos("bandpass", [lo, hi], 1), noise[i:i + blk])
    return out


def riser(dur):
    t = tt(dur)
    n = sweep_noise(dur, 300, 9000, 0.6)
    f = 180 * (8 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    e = (t / dur) ** 2.2
    return (n * 0.5 + tone) * e


def whoosh(dur=0.45, up=True):
    t = tt(dur)
    n = sweep_noise(dur, 400 if up else 5000, 5000 if up else 400, 0.8)
    e = np.sin(np.pi * t / dur) ** 2
    return n * e * 0.9


def impact(vel=1.0, sub=48):
    t = tt(2.2)
    f = sub + 40 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    n = sosfilt(sos("lowpass", 3500), rng.standard_normal(len(t))) * np.exp(-t * 7) * 0.6
    crash = sosfilt(sos("highpass", 5000), rng.standard_normal(len(t))) * np.exp(-t * 2.5) * 0.18
    return np.tanh((boom * 1.3 + n + crash) * 1.2) * vel


def deflate():
    t = tt(0.9)
    f = 420 * np.exp(-t * 3.2) + 50
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.5) * 0.6


def slash():
    t = tt(0.22)
    n = sosfilt(sos("highpass", 2500), rng.standard_normal(len(t))) * np.exp(-t * 30)
    f = 1400 * np.exp(-t * 14) + 200
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * 0.5
    return (n * 0.7 + tone)


def thump(vel=1.0):
    t = tt(0.35)
    f = 90 + 80 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) * vel


def tick(f=2200, vel=1.0):
    t = tt(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) * 0.5 * vel


def coin(f=None):
    f = f or rng.uniform(2400, 3600)
    t = tt(0.35)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 14) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 22)
            + 0.3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 35)) * 0.22


def plink():
    t = tt(0.14)
    f = 700 + 900 * (1 - np.exp(-t * 90))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.4


def key_click():
    t = tt(0.03)
    n = sosfilt(sos("bandpass", [2000, 6000]), rng.standard_normal(len(t))) * np.exp(-t * 300)
    return n * 0.5 + np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 200) * 0.15


def sparkle(dur, density=40):
    out = np.zeros(int(dur * SR))
    for _ in range(int(dur * density)):
        st = rng.uniform(0, dur - 0.06)
        f = rng.uniform(3500, 8000)
        t = tt(0.06)
        g = np.sin(2 * np.pi * f * t) * np.exp(-t * 60) * rng.uniform(0.04, 0.12)
        i = int(st * SR)
        out[i:i + len(g)] += g
    return out


def pop(vel=1.0):
    t = tt(0.08)
    f = 500 + 1400 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.5 * vel


# ------------------------------------------------------------- 화성 진행 (2초 = 1마디)
CH = {
    "Am": [57, 60, 64], "F": [53, 57, 60], "C": [48, 52, 55, 60], "G": [55, 59, 62],
    "Dm": [50, 53, 57], "Gsus": [55, 60, 62], "Em": [52, 55, 59],
}
ROOT_ = {"Am": 33, "F": 29, "C": 36, "G": 31, "Dm": 38, "Gsus": 31, "Em": 28}
BARS = ["Am", "Am", "Am", "F", "C", "G", "Am", "C", "G", "Am", "F", "C", "Gsus", "Am", "F", "Dm", "G", "C", "F", "C"]


def chord_at(t):
    return BARS[min(int(t // BAR), len(BARS) - 1)]


# 구간별 편성
def section(t):
    if t < 4: return "hook"
    if t < 10: return "pain"
    if t < 13: return "notonly"
    if t < 14: return "pre"
    if t < 24: return "drop"
    if t < 26: return "overview"
    if t < 29: return "principles"
    if t < 30: return "build"
    if t < 34: return "process"
    if t < 38: return "cta"
    return "end"


kicks = []
steps = np.arange(0, 38.0, BEAT / 4)  # 16분음표
for st in steps:
    sec = section(st)
    pos16 = int(round(st / (BEAT / 4))) % 16  # 마디 안 위치
    on_beat = pos16 % 4 == 0
    if sec in ("hook",) and on_beat:
        add("drums", kick(0.8), st); kicks.append(st)
    if sec in ("pain", "notonly", "drop", "process", "cta") and on_beat:
        v = {"pain": 0.75, "notonly": 0.9, "drop": 1.0, "process": 0.9, "cta": 1.0}[sec]
        add("drums", kick(v), st); kicks.append(st)
    # 하이햇
    if sec == "pain" and pos16 % 4 == 2:
        add("drums", hat(0.8), st, pan=0.2)
    if sec in ("notonly", "process") and pos16 % 2 == 0 and not on_beat:
        add("drums", hat(0.7), st, pan=0.25)
    if sec in ("notonly", "process") and pos16 % 2 == 1:
        add("drums", hat(0.35), st, pan=0.25)
    if sec in ("drop", "cta"):
        if pos16 % 4 == 2:
            add("drums", hat(0.7, open_=True), st, pan=0.2, verb=0.1)
        elif not on_beat:
            add("drums", hat(0.45), st, pan=-0.2)
    if sec == "overview" and pos16 % 2 == 0:
        add("drums", hat(0.3), st, pan=0.3)
    # 클랩 (2, 4박)
    if pos16 in (4, 12) and (sec in ("notonly", "drop", "cta") or (sec == "pain" and st >= 6) or (sec == "process" and st >= 32)):
        add("drums", clap(0.85), st, verb=0.25)
    # 베이스 (8분음표)
    if pos16 % 2 == 0 and sec in ("hook", "pain", "notonly", "drop", "process", "cta"):
        r = ROOT_[chord_at(st)]
        oct_ = 12 if (pos16 % 4 == 2 and sec in ("drop", "cta")) else 0
        v = {"hook": 0.75, "pain": 0.6, "notonly": 0.85, "drop": 1.0, "process": 0.85, "cta": 1.0}[sec]
        add("bass", bass_note(r + oct_, BEAT / 2 * 0.95, v), st)
    # 벨 아르페지오
    if sec in ("drop", "cta") and pos16 % 2 == 0:
        notes = CH[chord_at(st)]
        seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[1] + 24]
        add("lead", bell(seq[(pos16 // 2) % 4], 0.9, 0.42), st, pan=0.35 if pos16 % 4 else -0.35, verb=0.35)
    if sec == "pain" and pos16 % 4 == 0:
        notes = CH[chord_at(st)]
        add("lead", pluck(notes[(pos16 // 4) % len(notes)] + 12, 0.4, 0.6), st, pan=-0.3, verb=0.3)

# 스네어 롤 빌드업 (29~30초)
t = 29.0
while t < 30.0:
    p = (t - 29.0)
    add("drums", snare(0.25 + 0.6 * p), t, verb=0.2)
    t += BEAT / 4 if p < 0.5 else BEAT / 8
# 패드 (마디마다)
for b, name in enumerate(BARS):
    t0 = b * BAR
    if t0 >= DUR:
        break
    sec = section(t0 + 0.01)
    if sec in ("pre",):
        continue
    v = {"hook": 0.8, "pain": 0.55, "notonly": 0.6, "drop": 1.0, "overview": 1.5, "principles": 1.7, "build": 0.9,
         "process": 0.8, "cta": 1.0, "end": 1.2}[sec]
    cut = 900 if sec == "hook" else (2400 if sec in ("drop", "cta", "end") else 1600)
    dur = BAR + 0.5 if b < len(BARS) - 1 else 3.0
    add("pad", pad_chord(CH[name], dur, v, cut), t0, verb=0.3)
# 원칙: 피아노
for at in C["principles"]["lines"]:
    for k, m in enumerate(CH[chord_at(at)]):
        add("lead", piano(m + 12, 2.2, 1.05), at + k * 0.02, pan=-0.2 + k * 0.2, verb=0.5)
    add("lead", piano(ROOT_[chord_at(at)] + 12, 2.2, 1.1), at, verb=0.4)

# ------------------------------------------------------------- 효과음
H, PN, NO, RV, ST = C["hook"], C["pain"], C["notonly"], C["reveal"], C["stages"]
OV, PR, PC, CT = C["overview"], C["principles"], C["process"], C["cta"]
# hook
add("sfx", impact(0.75, 50), 0.0, verb=0.25)
for i, m in enumerate([69, 72, 76, 79, 81]):
    add("sfx", pluck(m, 0.4, 1.1), i * 0.12, pan=-0.4 + i * 0.2, verb=0.3)
add("sfx", bell(84, 1.0, 0.8), 1.15, verb=0.4)
add("sfx", coin(3200), 1.2, 1.2)
add("sfx", impact(0.8, 42), H["leak"], verb=0.3)
add("sfx", deflate(), H["leak"] + 0.05, 0.9)
for i in range(26):
    add("sfx", coin(), H["leak"] + 0.2 + i * 0.045 + rng.uniform(0, 0.05), 0.55, pan=rng.uniform(-0.7, 0.7))
for i in range(4):
    add("sfx", pop(0.8), H["leak"] + 0.35 + i * 0.18, pan=-0.3 + i * 0.2)
add("sfx", whoosh(0.5), H["out"] - 0.05, 0.6)
# pain
for i, at in enumerate(PN["checks"]):
    add("sfx", tick(2600, 1.0), at, pan=-0.2)
    add("sfx", pluck(72 + [0, 2, 4, 7, 9, 12][i], 0.3, 0.7), at, verb=0.2)
add("sfx", thump(0.8), PN["line2"], verb=0.2)
add("sfx", bell(76, 1.2, 0.7), PN["line2"] + 0.02, verb=0.4)
add("sfx", whoosh(0.45), PN["out"] - 0.05, 0.6)
# not only
for at in NO["lines"]:
    add("sfx", thump(0.9), at)
    add("sfx", slash(), at + NO["strike"], 0.8, pan=0.2)
add("sfx", impact(0.6, 55), NO["close"], verb=0.2)
add("sfx", whoosh(0.5), NO["out"], 0.7)
# pre-drop
add("sfx", riser(1.35), RV["drop"] - 1.4, 0.8)
for i in range(11):
    add("sfx", key_click(), RV["start"] + 0.1 + i * 0.075, 0.9, pan=rng.uniform(-0.3, 0.3))
# drop
add("sfx", impact(1.3, 40), RV["drop"], verb=0.35)
add("sfx", sparkle(1.2, 50), RV["drop"] + 0.05, 1.0, verb=0.4)
add("sfx", bell(88, 1.6, 0.9), RV["logo"], verb=0.5)
add("sfx", bell(84, 1.6, 0.6), RV["logo"] + 0.08, verb=0.5)
add("sfx", whoosh(0.5), RV["out"], 0.7)
# stages
T0, E = ST["start"], ST["each"]
for k in range(4):
    at = T0 + k * E
    add("sfx", thump(0.7), at)
    add("sfx", bell([72, 76, 79, 84][k], 1.2, 0.7), at + 0.02, verb=0.4)
    if k:
        add("sfx", whoosh(0.55), at - 0.45, 0.55)
add("sfx", sparkle(0.8, 60), T0 + 0.3, 1.0)
for i in range(3):
    add("sfx", pop(0.7), T0 + 0.1 + i * 0.06, pan=-0.6 + i * 0.6)
add("sfx", bell(79, 1.0, 0.6), T0 + 1.0, verb=0.3)
add("sfx", coin(2800), T0 + 1.0, 0.8)
for k, (a, d) in enumerate([(T0 + 1.3, 0.85), (T0 + E + 0.15, 0.75), (T0 + E + 1.3, 0.85), (T0 + 2 * E + 0.12, 0.55),
                            (T0 + 2 * E + 1.3, 0.95), (T0 + 3 * E + 0.3, 0.8)]):
    add("sfx", sparkle(d, 45), a, 0.9)
add("sfx", bell(88, 0.8, 0.6), T0 + E + 0.9, verb=0.3)       # 체크
for i in range(9):
    add("sfx", plink(), T0 + 2 * E + 0.3 + i * 0.07 + 0.34, 0.7, pan=(i % 3 - 1) * 0.4, verb=0.2)
add("sfx", tick(1500, 1.4), T0 + 2 * E + 1.05)               # 자물쇠
add("sfx", thump(0.5), T0 + 2 * E + 1.05)
for i in range(4):
    add("sfx", pluck(72 + [0, 4, 7, 12][i], 0.3, 0.7), T0 + 3 * E + 0.15 + i * 0.1, verb=0.25)
add("sfx", bell(91, 1.0, 0.7), T0 + 3 * E + 1.1, verb=0.4)
# overview
add("sfx", whoosh(0.8, up=False), OV["start"] - 0.05, 0.7)
add("sfx", bell(84, 1.6, 0.5), OV["text"], verb=0.5)
add("sfx", bell(88, 1.6, 0.6), OV["text"] + 0.45, verb=0.5)
add("sfx", whoosh(0.45), OV["out"], 0.6)
# principles
for at in PR["lines"]:
    add("sfx", thump(0.6), at)
add("sfx", riser(1.0), 29.0, 0.55)
# process
for i, at in enumerate(PC["steps"]):
    add("sfx", tick(2000 + i * 200, 1.0), at)
    add("sfx", pluck(76 + [0, 2, 4, 7, 9][i], 0.3, 0.6), at, verb=0.25)
for i in range(7):
    add("sfx", pop(0.55), PC["network"] + 0.08 + i * 0.045, pan=-0.6 + i * 0.2)
add("sfx", whoosh(0.4), PC["out"], 0.6)
# cta
add("sfx", impact(1.1, 44), CT["start"], verb=0.35)
add("sfx", bell(84, 1.6, 0.7), CT["logo"], verb=0.5)
add("sfx", pop(1.0), CT["button"], 1.0)
add("sfx", tick(1200, 1.6), CT["tap"])
add("sfx", thump(0.6), CT["tap"])
add("sfx", bell(88, 1.2, 0.8), CT["tap"] + 0.08, verb=0.4)
add("sfx", bell(95, 1.4, 0.7), CT["tap"] + 0.2, verb=0.5)
# 끝맺음
add("drums", kick(1.0), 38.0)
add("sfx", impact(0.9, 40), 38.0, verb=0.5)
for k, m in enumerate([60, 64, 67, 72]):
    add("lead", bell(m + 12, 2.5, 0.6), 38.0 + k * 0.03, verb=0.6)

# ------------------------------------------------------------- 사이드체인, 리버브, 마스터
sc = np.ones(N)
idx = np.arange(N) / SR
for k in kicks:
    i = int(k * SR)
    j = min(N, i + int(0.3 * SR))
    sc[i:j] = np.minimum(sc[i:j], 1 - 0.55 * np.exp(-(idx[i:j] - k) / 0.09))
bus["bass"] *= sc
bus["pad"] *= sc


def make_ir(sec=2.2):
    t = tt(sec)
    ir = np.vstack([rng.standard_normal(len(t)), rng.standard_normal(len(t))]) * np.exp(-t / 0.55)
    lp = sos("lowpass", 5500)
    ir = np.vstack([sosfilt(lp, ir[0]), sosfilt(lp, ir[1])])
    ir[:, :int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum() / 2)


ir = make_ir()
wet = np.vstack([fftconvolve(bus["verb"][0], ir[0])[:N], fftconvolve(bus["verb"][1], ir[1])[:N]])

mix = (bus["drums"] * 0.95 + bus["bass"] * 0.8 + bus["pad"] * 0.9 + bus["lead"] * 0.85 + bus["sfx"] * 1.0 + wet * 0.22)
hp = sos("highpass", 28)
mix = np.vstack([sosfilt(hp, mix[0]), sosfilt(hp, mix[1])])
# 끝 페이드
fade0 = int((DUR - 0.9) * SR)
mix[:, fade0:] *= np.linspace(1, 0, N - fade0) ** 1.5
mix = mix / (np.abs(mix).max() + 1e-9) * 1.6
mix = np.tanh(mix) / np.tanh(1.6) * 0.70  # 약 -14 LUFS, 피크 -1dB 이하
mix = mix[:, :int(DUR * SR)]

out = ROOT / "build" / "score.wav"
out.parent.mkdir(exist_ok=True)
wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
print("wrote", out, f"{mix.shape[1] / SR:.2f}s")
