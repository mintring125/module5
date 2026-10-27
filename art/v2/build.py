# 라이브 프레젠테이션 v2 에셋을 웹용(public/v2/assets)으로 만든다.
#   pose/<성별>-<자세>.webp   : GPT로 그린 상황별 자세 (투명)
#   char/<성별>-<단계>.webp   : 성장 6단계 캐릭터 (art/achieve/cut, 투명)
#   bg/<boy|girl>/<이름>.webp : 템플릿별 배경 (남학생=선명한 바다, 여학생=부드러운 파스텔)
#   icon/<1~12>.webp          : 아이콘 시트(4x3)를 칸별로 잘라 여백을 다듬은 것
#   shot/<번호>.webp          : 원본 슬라이드의 플랫폼 화면 캡처 부분
# 사용법: <sprite-gen venv python> art/v2/build.py
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'art' / 'v2' / 'raw'
OUT = ROOT / 'public' / 'v2' / 'assets'


def save(im, path, q=86):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)


def trim(im, thr=12):
    a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > thr)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)) if len(xs) else im


def fit_h(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS) if im.height > h else im


done = []
for f in sorted(RAW.glob('pose-*.png')):
    if f.name.endswith('.raw.png'):
        continue
    name = f.stem.replace('pose-', '')
    save(fit_h(trim(Image.open(f).convert('RGBA')), 900), OUT / 'pose' / f'{name}.webp')
    done.append(f'pose/{name}')

for sex in ('boy', 'girl'):
    for n in range(1, 7):
        f = ROOT / 'art' / 'achieve' / 'cut' / f'{sex}-{n}.png'
        save(fit_h(trim(Image.open(f).convert('RGBA'), 40), 640), OUT / 'char' / f'{sex}-{n}.webp')
        done.append(f'char/{sex}-{n}')

for f in sorted(RAW.glob('*bg-*.png')):
    if f.name.endswith('.raw.png'):
        continue
    theme = 'girl' if f.stem.startswith('girl-') else 'boy'
    name = f.stem.replace('girl-', '')
    im = Image.open(f).convert('RGB')
    w, h = im.size  # 16:9로 가운데를 잘라 1920x1080
    th = round(w * 9 / 16)
    if th <= h:
        im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    else:
        tw = round(h * 16 / 9)
        im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
    save(im.resize((1920, 1080), Image.LANCZOS), OUT / 'bg' / theme / f'{name}.webp', q=82)
    done.append(f'bg/{theme}/{name}')

icons = RAW / 'icons.png'
if icons.exists():
    sheet = Image.open(icons).convert('RGBA')
    cw, ch = sheet.width / 4, sheet.height / 3
    for i in range(12):
        c, r = i % 4, i // 4
        cell = sheet.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        cell = trim(cell, 20)
        cell.thumbnail((320, 320), Image.LANCZOS)
        save(cell, OUT / 'icon' / f'{i + 1}.webp', q=90)
    done.append('icon/1..12')

# 원본 슬라이드에서 플랫폼 화면 부분만 (원본 제목 띠·겹쳐 쓴 글자를 뺀 영역, 1920x1080 좌표)
SHOTS = {
    18: (90, 195, 1830, 1000), 19: (90, 200, 1830, 1000), 20: (90, 195, 1830, 1000), 21: (90, 195, 1830, 1000),
    24: (100, 230, 960, 860), 25: (170, 180, 830, 1000), 26: (100, 140, 950, 930), 33: (100, 290, 1820, 1000),
}
for n, box in SHOTS.items():
    im = Image.open(ROOT / 'public' / 'slides' / f'{n}.png').convert('RGB')
    im = im.crop(box)
    im.thumbnail((1500, 1500), Image.LANCZOS)
    save(im, OUT / 'shot' / f'{n}.webp', q=84)
    done.append(f'shot/{n}')

total = sum(p.stat().st_size for p in OUT.rglob('*.webp')) / 1048576
print(len(done), 'files,', f'{total:.1f} MB')
