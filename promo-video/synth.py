"""영상 음악·효과음 합성 공용 모듈 (score_short.py, score_fund.py 가 사용).

외부 샘플 없이 수식으로만 소리를 만든다. Mix.render() 는 두 가지 파일을 쓴다.
  - 기본본: 음악+효과음, -14 LUFS (그대로 게시용)
  - 음성용: 음악을 낮추고 효과음은 살린 판, -21 LUFS (일레븐랩스 내레이션을 얹을 때)
"""
import json
import re
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def load_cues(path):
    raw = Path(path).read_text(encoding="utf-8")
    raw = "\n".join(l for l in raw.splitlines() if not l.strip().startswith("//"))
    return json.loads(re.sub(r"^\s*window\.CUES\s*=\s*", "", raw).strip().rstrip(";"))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output="sos")


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ------------------------------------------------------------------ 악기
def kick(vel=1.0):
    t = tt(0.5)
    f = 46 + 120 * np.exp(-t * 32)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.4
    return np.tanh((s + click) * 1.6) * vel


def clap(vel=1.0):
    t = tt(0.35)
    n = sosfilt(sos("bandpass", [900, 3200]), rng.standard_normal(len(t)))
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
    s = sosfilt(sos("lowpass", 520), saw(f, t) * 0.6 + np.sin(2 * np.pi * f * t) * 0.8)
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
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.45 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 5)
         + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 8) + 0.12 * np.sin(2 * np.pi * f * 4.2 * t) * np.exp(-t * 12))
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


def sweep_noise(dur, f0, f1, q=1.0):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    for i in range(0, n, 256):
        fc = f0 * (f1 / f0) ** (i / n)
        lo, hi = max(40, fc / (1 + q)), min(SR / 2 - 100, fc * (1 + q))
        out[i:i + 256] = sosfilt(sos("bandpass", [lo, hi], 1), noise[i:i + 256])
    return out


def riser(dur):
    t = tt(dur)
    f = 180 * (8 ** (t / dur))
    return (sweep_noise(dur, 300, 9000, 0.6) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25) * (t / dur) ** 2.2


def whoosh(dur=0.45, up=True):
    t = tt(dur)
    return sweep_noise(dur, 400 if up else 5000, 5000 if up else 400, 0.8) * np.sin(np.pi * t / dur) ** 2 * 0.9


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
    return n * 0.7 + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * 0.5


def thump(vel=1.0):
    t = tt(0.35)
    f = 90 + 80 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) * vel


def stamp(vel=1.0):
    """도장 찍는 소리: 낮은 쿵 + 종이 탁."""
    t = tt(0.5)
    f = 70 + 60 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    slap = sosfilt(sos("bandpass", [600, 4000]), rng.standard_normal(len(t))) * np.exp(-t * 60) * 0.8
    return np.tanh((body + slap) * 1.5) * vel


def tick(f=2200, vel=1.0):
    t = tt(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) * 0.5 * vel


def coin(f=None):
    f = f or rng.uniform(2400, 3600)
    t = tt(0.35)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 14) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 22)
            + 0.3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 35)) * 0.22


def key_click():
    t = tt(0.03)
    n = sosfilt(sos("bandpass", [2000, 6000]), rng.standard_normal(len(t))) * np.exp(-t * 300)
    return n * 0.5 + np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 200) * 0.15


def sparkle(dur, density=40):
    out = np.zeros(int(dur * SR))
    for _ in range(int(dur * density)):
        st = rng.uniform(0, max(0.01, dur - 0.06))
        t = tt(0.06)
        g = np.sin(2 * np.pi * rng.uniform(3500, 8000) * t) * np.exp(-t * 60) * rng.uniform(0.04, 0.12)
        i = int(st * SR)
        out[i:i + len(g)] += g[:len(out) - i]
    return out


def pop(vel=1.0):
    t = tt(0.08)
    f = 500 + 1400 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.5 * vel


def scan(dur=0.6):
    """스캔 소리: 위로 미끄러지는 사인 + 잔잔한 노이즈."""
    t = tt(dur)
    f = 600 + 1800 * (t / dur)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18 + sweep_noise(dur, 1500, 6000, 0.5) * 0.15) * np.sin(np.pi * t / dur)


def error_buzz():
    t = tt(0.32)
    s = np.sign(np.sin(2 * np.pi * 140 * t)) * 0.25 + np.sign(np.sin(2 * np.pi * 147 * t)) * 0.25
    return sosfilt(sos("lowpass", 1800), s) * np.exp(-t * 7)


# ------------------------------------------------------------------ 화성
CH = {"Am": [57, 60, 64], "F": [53, 57, 60], "C": [48, 52, 55, 60], "G": [55, 59, 62],
      "Dm": [50, 53, 57], "Gsus": [55, 60, 62], "Em": [52, 55, 59]}
ROOT = {"Am": 33, "F": 29, "C": 36, "G": 31, "Dm": 38, "Gsus": 31, "Em": 28}


class Mix:
    BUSES = ["drums", "bass", "pad", "lead", "sfx", "verb"]

    def __init__(self, dur, bpm=120):
        self.dur, self.N = dur, int((dur + 0.5) * SR)
        self.beat = 60 / bpm
        self.bar = self.beat * 4
        self.bus = {k: np.zeros((2, self.N)) for k in self.BUSES}
        self.kicks = []

    def add(self, name, sig, t0, gain=1.0, pan=0.0, verb=0.0):
        i = int(round(t0 * SR))
        if i >= self.N:
            return
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            st = np.vstack([sig * l, sig * r]) * np.sqrt(2)
        else:
            st = sig
        a, b = max(i, 0), min(i + st.shape[1], self.N)
        seg = st[:, a - i:b - i] * gain
        self.bus[name][:, a:b] += seg
        if verb:
            self.bus["verb"][:, a:b] += seg * verb

    def kick(self, t, vel=1.0):
        self.add("drums", kick(vel), t)
        self.kicks.append(t)

    def groove(self, t0, t1, chords, level="full", bells=True):
        """t0~t1 구간에 드럼·베이스·벨 아르페지오. chords(t) -> 화음 이름."""
        step = self.beat / 4
        for st in np.arange(t0, t1 - 1e-6, step):
            pos = int(round(st / step)) % 16
            on = pos % 4 == 0
            name = chords(st)
            if level in ("full", "mid", "light") and on:
                self.kick(st, {"full": 1.0, "mid": 0.85, "light": 0.7}[level])
            if level == "full":
                if pos % 4 == 2:
                    self.add("drums", hat(0.7, open_=True), st, pan=0.2, verb=0.1)
                elif not on:
                    self.add("drums", hat(0.45), st, pan=-0.2)
                if pos in (4, 12):
                    self.add("drums", clap(0.85), st, verb=0.25)
            elif level == "mid":
                if not on and pos % 2 == 0:
                    self.add("drums", hat(0.7), st, pan=0.25)
                elif pos % 2 == 1:
                    self.add("drums", hat(0.35), st, pan=0.25)
                if pos in (4, 12):
                    self.add("drums", clap(0.7), st, verb=0.25)
            elif level == "light" and pos % 4 == 2:
                self.add("drums", hat(0.8), st, pan=0.2)
            if pos % 2 == 0 and level in ("full", "mid", "light", "pulse"):
                oct_ = 12 if (pos % 4 == 2 and level == "full") else 0
                v = {"full": 1.0, "mid": 0.85, "light": 0.6, "pulse": 0.7}[level]
                self.add("bass", bass_note(ROOT[name] + oct_, self.beat / 2 * 0.95, v), st)
            if bells and level == "full" and pos % 2 == 0:
                n = CH[name]
                seq = [n[0] + 12, n[1] + 12, n[2] + 12, n[1] + 24]
                self.add("lead", bell(seq[(pos // 2) % 4], 0.9, 0.42), st, pan=0.35 if pos % 4 else -0.35, verb=0.35)
            if level == "light" and on:
                n = CH[name]
                self.add("lead", pluck(n[(pos // 4) % len(n)] + 12, 0.4, 0.6), st, pan=-0.3, verb=0.3)

    def pads(self, t0, t1, chords, vel=1.0, cutoff=2000):
        t = t0
        while t < t1 - 1e-6:
            d = min(self.bar, t1 - t)
            self.add("pad", pad_chord(CH[chords(t + 0.01)], d + 0.5, vel, cutoff), t, verb=0.3)
            t += self.bar

    def render(self, out_path, vo_path=None):
        idx = np.arange(self.N) / SR
        sc = np.ones(self.N)
        for k in self.kicks:
            i, j = int(k * SR), min(self.N, int(k * SR) + int(0.3 * SR))
            sc[i:j] = np.minimum(sc[i:j], 1 - 0.55 * np.exp(-(idx[i:j] - k) / 0.09))
        b = {k: v.copy() for k, v in self.bus.items()}
        b["bass"] *= sc
        b["pad"] *= sc
        t = tt(2.2)
        ir = np.vstack([rng.standard_normal(len(t)), rng.standard_normal(len(t))]) * np.exp(-t / 0.55)
        lp = sos("lowpass", 5500)
        ir = np.vstack([sosfilt(lp, ir[0]), sosfilt(lp, ir[1])])
        ir[:, :int(0.012 * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum() / 2)
        wet = np.vstack([fftconvolve(b["verb"][0], ir[0])[:self.N], fftconvolve(b["verb"][1], ir[1])[:self.N]])
        music = b["drums"] * 0.95 + b["bass"] * 0.8 + b["pad"] * 0.9 + b["lead"] * 0.85 + wet * 0.22
        sfx = b["sfx"]
        meter = pyln.Meter(SR)
        outs = [(out_path, music + sfx, -14.0)]
        if vo_path:
            outs.append((vo_path, music * 0.42 + sfx * 0.8, -21.0))
        hp = sos("highpass", 28)
        n_out = int(self.dur * SR)
        fade0 = int((self.dur - 0.9) * SR)
        for path, mix, target in outs:
            mix = np.vstack([sosfilt(hp, mix[0]), sosfilt(hp, mix[1])])
            mix[:, fade0:] *= np.linspace(1, 0, self.N - fade0) ** 1.5
            mix = mix / (np.abs(mix).max() + 1e-9) * 1.6
            mix = np.tanh(mix) / np.tanh(1.6)
            mix = mix[:, :n_out]
            loud = meter.integrated_loudness(mix.T)
            mix *= 10 ** ((target - loud) / 20)
            peak = np.abs(mix).max()
            if peak > 0.89:  # 약 -1 dBFS 넘으면 살짝 눌러 준다
                mix = np.tanh(mix / 0.89 * 1.2) / np.tanh(1.2) * 0.89
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            wavfile.write(path, SR, (mix.T * 32767).astype(np.int16))
            print(f"wrote {path}  {meter.integrated_loudness(mix.T):.1f} LUFS  peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")
