"""build/stills/*.jpg 를 한 장에 모아 검토용 밀착 인화(contact sheet)를 만든다."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

src = Path(sys.argv[1] if len(sys.argv) > 1 else "build/stills")
out = Path(sys.argv[2] if len(sys.argv) > 2 else "build/sheet")
cols, rows, w, h = 4, 2, 405, 720
files = sorted(src.glob("*.jpg"))
out.mkdir(parents=True, exist_ok=True)
for i in range(0, len(files), cols * rows):
    sheet = Image.new("RGB", (cols * w, rows * (h + 30)), "#222")
    d = ImageDraw.Draw(sheet)
    for j, f in enumerate(files[i:i + cols * rows]):
        im = Image.open(f).resize((w, h))
        x, y = (j % cols) * w, (j // cols) * (h + 30)
        sheet.paste(im, (x, y + 30))
        d.text((x + 8, y + 8), f.stem, fill="#fff")
    p = out / f"sheet{i // (cols * rows):02d}.jpg"
    sheet.save(p, quality=88)
    print(p)
