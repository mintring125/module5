# 성장 단계 시트(boy/girl.webp)를 캐릭터 6명씩 잘라 낸다 → crops/<성별>-<단계>.png (흰 배경 유지)
#   - 아래쪽 '○단계' 남색 라벨의 가로 위치로 단계 6칸의 중심을 찾는다
#   - 단계 중심 근처 그림 픽셀에서 동시에 퍼져 나가며(그림 픽셀을 따라) 먼저 닿은 단계가 그 픽셀을 갖는다
#     → 옆 캐릭터의 망토·손·머리카락이 닿아 있어도 각자 몸에서 이어진 쪽으로 나뉜다
#   - 어디에도 이어지지 않은 조각은 가장 가까운 몸에 붙인다
#   - 다른 단계 픽셀은 흰색으로 지운 뒤 잘라 낸다
# 사용법: <sprite-gen venv python> art/achieve/slice.py
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
LABEL_TOP = 0.835  # 이 아래는 단계 라벨
INK = 14  # 흰색(255)에서 이만큼 이상 어두우면 그림으로 본다 (밝은 피부색·그림자까지 포함)
SEED_HALF = 25  # 단계 중심 ±px 안의 그림 픽셀에서 퍼지기 시작한다
PAD = 12


def stage_centers(a, h):
    band = a[int(h * LABEL_TOP) : int(h * 0.92)]
    navy = (band[..., 2] > 90) & (band[..., 0] < 70) & (band[..., 1] < 110)
    cols = navy.sum(axis=0) > 3
    runs, start = [], None
    for x, on in enumerate(list(cols) + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            if x - start > 30:
                runs.append((start + x - 1) / 2)
            start = None
    return runs


def grow(ink, centers):
    """단계 중심에서 그림 픽셀을 따라 동시에 퍼지며 주인을 정한다 (0 = 닿지 않음)."""
    h, w = ink.shape
    owner = np.zeros((h, w), dtype=np.int8)
    q = deque()
    for s, cx in enumerate(centers, 1):
        x0, x1 = int(cx - SEED_HALF), int(cx + SEED_HALF)
        ys, xs = np.nonzero(ink[:, x0:x1])
        for y, x in zip(ys, xs + x0):
            if not owner[y, x]:
                owner[y, x] = s
                q.append((y, x))
    while q:
        y, x = q.popleft()
        s = owner[y, x]
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1), (y - 1, x - 1), (y - 1, x + 1), (y + 1, x - 1), (y + 1, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and ink[ny, nx] and not owner[ny, nx]:
                owner[ny, nx] = s
                q.append((ny, nx))
    return owner


def attach_orphans(ink, owner):
    """어느 단계에서도 닿지 않은 그림 픽셀은 가장 가까운 주인 있는 픽셀의 단계로."""
    ys, xs = np.nonzero(ink & (owner == 0))
    if not len(ys):
        return
    oy, ox = np.nonzero(owner)
    ref = np.stack([oy, ox], 1)[::4].astype(np.float32)
    lab = owner[oy, ox][::4]
    pts = np.stack([ys, xs], 1).astype(np.float32)
    for i in range(0, len(pts), 256):
        d = ((pts[i : i + 256, None, :] - ref[None, :, :]) ** 2).sum(-1)
        owner[ys[i : i + 256], xs[i : i + 256]] = lab[np.argmin(d, axis=1)]


out = ROOT / 'crops'
out.mkdir(exist_ok=True)
for sex in ('boy', 'girl'):
    im = Image.open(ROOT / 'src' / f'{sex}.webp').convert('RGB')
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    centers = stage_centers(a, h)
    assert len(centers) == 6, f'{sex}: 단계 라벨을 6개 찾지 못함 {centers}'

    top = int(h * LABEL_TOP)
    ink = (255 - a[:top].min(axis=2)) > INK
    owner = grow(ink, centers)
    attach_orphans(ink, owner)

    for stage in range(1, 7):
        mine = owner == stage
        ys, xs = np.nonzero(mine)
        box = (max(0, xs.min() - PAD), max(0, ys.min() - PAD), min(w, xs.max() + PAD + 1), min(top, ys.max() + PAD + 1))
        piece = a[:top].copy()
        piece[(owner != 0) & ~mine] = 255  # 옆 캐릭터 조각은 지운다
        Image.fromarray(piece.astype(np.uint8)).crop(box).save(out / f'{sex}-{stage}.png')
        print(sex, stage, tuple(int(v) for v in box))
