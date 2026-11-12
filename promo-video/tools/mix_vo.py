"""일레븐랩스 음성 파일을 영상에 얹는다.

1. 대본(scripts/voiceover.md)의 줄마다 음성을 따로 만들어 줄 ID 이름으로 저장한다.
     vo/short/S1.mp3, vo/short/S2.mp3 ...   (숏폼)
     vo/fund/F1.mp3,  vo/fund/F2.mp3 ...    (정책자금)
   mp3·wav·m4a 모두 됩니다.
2. 실행
     python3 tools/mix_vo.py short
     python3 tools/mix_vo.py fund
   → out/harangsol-short-9x16-with-voice.mp4 (또는 fund)
     python3 tools/mix_vo.py fund --ad
   → 광고판 영상에 얹기. 광고판에서 대사가 다른 줄(S6, F1, F7)은 S6-ad.mp3 처럼 저장

각 음성은 cues 파일에 적힌 시작 시간에 놓이고, 음성이 나오는 동안 배경음악이 자동으로 줄어든다.
음성이 다음 줄 자리까지 넘치면 경고를 띄운다(일레븐랩스 속도를 1.05~1.1로 올려 다시 만들면 된다).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from synth import load_cues  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("name", choices=["short", "fund"])
ap.add_argument("--dir", help="음성 파일 폴더 (기본: vo/<name>)")
ap.add_argument("--gain", type=float, default=0.0, help="음성 볼륨 보정(dB)")
ap.add_argument("--ad", action="store_true", help="광고판 영상(out/ad-…)에 얹기. <ID>-ad.mp3 가 있으면 그 줄은 그것을 씀")
a = ap.parse_args()

cues = load_cues(ROOT / f"cues-{a.name}.js")
vdir = Path(a.dir) if a.dir else ROOT / "vo" / a.name
prefix = "ad" if a.ad else "harangsol"
video = ROOT / f"out/{prefix}-{a.name}-9x16-voice-ready.mp4"
out = ROOT / f"out/{prefix}-{a.name}-9x16-with-voice.mp4"
if not video.exists():
    sys.exit(f"영상이 없습니다: {video}")


def duration(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(p)], capture_output=True, text=True)
    return float(json.loads(r.stdout)["format"]["duration"])


clips, missing = [], []
for v in cues["vo"]:
    names = ([f"{v['id']}-ad"] if a.ad else []) + [v["id"]]
    f = next((vdir / f"{n}{ext}" for n in names for ext in (".mp3", ".wav", ".m4a") if (vdir / f"{n}{ext}").exists()), None)
    if not f:
        missing.append(v["id"])
        continue
    d = duration(f)
    slot = v["end"] - v["at"]
    flag = "" if d <= slot + 0.15 else f"  ⚠ {d - slot:.1f}초 넘침 → 속도를 {d / slot:.2f}배 이상으로 다시 생성 권장"
    print(f"{v['id']}  {v['at']:5.2f}s  길이 {d:4.1f}s / 자리 {slot:4.1f}s{flag}")
    clips.append((f, v["at"]))
if missing:
    print("없는 파일:", ", ".join(missing), f"(폴더: {vdir})")
if not clips:
    sys.exit("음성 파일이 하나도 없습니다.")

args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video)]
for f, _ in clips:
    args += ["-i", str(f)]
parts = []
for i, (_, at) in enumerate(clips, 1):
    ms = int(at * 1000)
    parts.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},volume={a.gain}dB[v{i}]")
vin = "".join(f"[v{i}]" for i in range(1, len(clips) + 1))
parts.append(f"{vin}amix=inputs={len(clips)}:normalize=0:dropout_transition=0,asplit=2[vox][key]")
parts.append("[0:a]aresample=48000[bed]")
parts.append("[bed][key]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350:makeup=1[duck]")
parts.append("[duck][vox]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[mix]")
args += ["-filter_complex", ";".join(parts), "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-t", str(cues["duration"]), "-movflags", "+faststart", str(out)]
subprocess.run(args, check=True)
print("완성 →", out.relative_to(ROOT))
