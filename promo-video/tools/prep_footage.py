"""assets/footage/*.mp4 를 프레임 그림으로 풀어 build/footage/<이름>/f0001.jpg ... 로 저장한다.

mix.html 은 영상을 직접 재생하지 않고 이 그림을 시간에 맞춰 한 장씩 보여 준다(프레임 단위 렌더용).

    python3 tools/prep_footage.py
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for clip in sorted((ROOT / "assets/footage").glob("*.mp4")):
    out = ROOT / "build/footage" / clip.stem
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("f*.jpg"):
        old.unlink()
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(clip), "-q:v", "2", str(out / "f%04d.jpg")], check=True)
    print(f"{clip.stem}: {len(list(out.glob('f*.jpg')))} frames")
