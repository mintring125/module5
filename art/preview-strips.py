# 테마별 걷기 스트립 미리보기: 캐릭터마다 한 줄, 4칸 간격으로 뽑아 회색 배경에 붙인다
import json
import sys
from pathlib import Path
from PIL import Image

theme = sys.argv[1] if len(sys.argv) > 1 else 'teacher'
state = sys.argv[2] if len(sys.argv) > 2 else 'walk'
root = Path(__file__).parent.parent / 'public' / 'chars' / theme
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
rows = []
for cid in sorted(manifest, key=int):
    s = manifest[cid].get(state)
    if not s:
        continue
    strip = Image.open(root / Path(s['src']).name).convert('RGBA')
    cells = [strip.crop((i * s['w'], 0, (i + 1) * s['w'], s['h'])) for i in range(0, s['frames'], 4)]
    rows.append(cells)
cw, ch = 140, 210
sheet = Image.new('RGBA', (cw * max(len(r) for r in rows), ch * len(rows)), (200, 205, 215, 255))
for y, cells in enumerate(rows):
    for x, c in enumerate(cells):
        sheet.alpha_composite(c, (x * cw + (cw - c.width) // 2, y * ch + ch - c.height))
out = root.parent.parent.parent / 'art' / f'preview-{theme}-{state}.png'
sheet.convert('RGB').resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(out)
print(out)
