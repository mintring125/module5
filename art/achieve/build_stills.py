# 잘라 낸 캐릭터(crops/)의 흰 배경을 sprite-gen cutout으로 지우고,
# 12명을 모두 같은 초록 캔버스(768x1024)에 같은 배율·같은 발 위치로 올린다 → stills/<성별>-<단계>.png
# 단계 사이 변신 영상은 앞뒤 그림을 첫/끝 프레임으로 쓰므로, 크기와 발 위치가 같아야 자연스럽게 이어진다.
# 사용법: <sprite-gen venv python> art/achieve/build_stills.py
import json
import os
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
SG = Path(os.environ['USERPROFILE']) / '.claude' / 'skills' / 'sprite-gen' / '.venv' / 'Scripts' / 'sprite-gen.exe'
W, H = 768, 1024
TALLEST = 0.80  # 가장 큰 캐릭터(6단계)의 키 = 캔버스 높이의 80%
FLOOR = 0.95  # 발끝(그림 아래 끝)의 위치
GREEN = (0, 255, 0, 255)

names = [f'{s}-{i}' for s in ('boy', 'girl') for i in range(1, 7)]
(ROOT / 'cut').mkdir(exist_ok=True)
(ROOT / 'stills').mkdir(exist_ok=True)

def whiten_floor(src, dst):
    """테두리에서 이어진 흰색·연한 그림자색을 순백으로 바꾼다.
    바닥 그림자 타원이 다리 사이 흰 배경을 가둬 cutout이 못 지우는 것을 막는다.
    옷의 흰 부분은 진한 외곽선 안에 있어 테두리와 이어지지 않으므로 그대로 남는다."""
    a = np.asarray(Image.open(src).convert('RGB')).astype(int)
    h, w, _ = a.shape
    light = (a.min(axis=2) >= 205) & ((a.max(axis=2) - a.min(axis=2)) <= 30)
    seen = np.zeros((h, w), bool)
    stack = [(y, x) for y in range(h) for x in (0, w - 1) if light[y, x]] + [(y, x) for x in range(w) for y in (0, h - 1) if light[y, x]]
    while stack:
        y, x = stack.pop()
        if seen[y, x]:
            continue
        seen[y, x] = True
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not seen[ny, nx]:
                stack.append((ny, nx))
    a[seen] = 255
    Image.fromarray(a.astype(np.uint8)).save(dst)


def drop_specks(im, min_px=40):
    """본체와 떨어진 작은 점(옆 캐릭터 잔여물 등)을 지운다."""
    alpha = np.asarray(im.getchannel('A')).copy()
    solid = alpha > 0
    h, w = solid.shape
    label = np.zeros((h, w), np.int32)
    sizes = [0]
    for y, x in zip(*np.nonzero(solid)):
        if label[y, x]:
            continue
        n = len(sizes)
        label[y, x] = n
        stack, count = [(y, x)], 0
        while stack:
            cy, cx = stack.pop()
            count += 1
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not label[ny, nx]:
                    label[ny, nx] = n
                    stack.append((ny, nx))
        sizes.append(count)
    sizes = np.array(sizes)
    alpha[(sizes[label] < min_px) & solid] = 0
    im.putalpha(Image.fromarray(alpha))
    return im


cuts = {}
(ROOT / 'prep').mkdir(exist_ok=True)
for n in names:
    prep = ROOT / 'prep' / f'{n}.png'
    out = ROOT / 'cut' / f'{n}.png'
    whiten_floor(ROOT / 'crops' / f'{n}.png', prep)
    subprocess.run([str(SG), 'cutout', str(prep), '--key', 'white', '--out', str(out)], check=True, capture_output=True)
    im = drop_specks(Image.open(out).convert('RGBA'))
    cuts[n] = im.crop(im.getchannel('A').getbbox())

scale = TALLEST * H / max(im.height for im in cuts.values())
meta = {}
for n, im in cuts.items():
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    alpha = np.asarray(im.getchannel('A')).astype(float)
    cx = (alpha.sum(axis=0) * np.arange(im.width)).sum() / alpha.sum()  # 몸의 무게중심을 가운데에
    x = round(W / 2 - cx)
    y = round(H * FLOOR - im.height)
    canvas = Image.new('RGBA', (W, H), GREEN)
    canvas.alpha_composite(im, (x, y))
    canvas.convert('RGB').save(ROOT / 'stills' / f'{n}.png')
    meta[n] = {'x': x, 'y': y, 'w': im.width, 'h': im.height}
    print(n, meta[n])

(ROOT / 'stills' / 'layout.json').write_text(json.dumps({'canvas': [W, H], 'scale': scale, 'items': meta}, indent=2))
