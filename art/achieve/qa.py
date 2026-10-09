# 획득 영상 점검용 몽타주: 클립마다 한 줄, 처음·중간·끝을 고르게 9장 뽑아 회색 바탕에 붙인다 → qa-<이름들>.png
# 사용법: <sprite-gen venv python> art/achieve/qa.py boy-1 boy-1to2 ...
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent
names = sys.argv[1:]
W, H, N = 150, 200, 9
sheet = Image.new('RGBA', (W * N + 90, H * len(names)), (70, 80, 110, 255))
draw = ImageDraw.Draw(sheet)
for r, name in enumerate(names):
    fs = sorted((ROOT / 'clips' / name / 'frames' / 'keyed').glob('*.png'))
    draw.text((6, r * H + 8), name, fill=(255, 255, 255, 255))
    if not fs:
        continue
    pick = [fs[round(i * (len(fs) - 1) / (N - 1))] for i in range(N)]
    for c, f in enumerate(pick):
        im = Image.open(f).convert('RGBA')
        im.thumbnail((W, H))
        sheet.alpha_composite(im, (90 + c * W, r * H + H - im.height))
out = ROOT / f"qa-{'_'.join(names)[:60]}.png"
sheet.convert('RGB').save(out)
print(out)
