# 획득 영상(clips/<이름>/frames/keyed/*.png, sprite-gen video-frames 결과)을 웹용으로 묶는다.
#   - 모든 프레임을 같은 영역(전체 프레임의 합집합 박스)으로 잘라 위치가 흔들리지 않게 한다
#   - 높이 HEIGHT로 줄여 프레임 격자 시트(WebP, 가로 COLS칸)와 1회 재생 애니메이션 WebP를 만든다
#     (WebP는 한 변이 16383px까지라 가로 한 줄 스트립으로는 다 못 담는다)
#   - public/achieve/manifest.json 에 프레임 수·크기·속도를 적는다
# 첫/끝 프레임이 다른 변신 영상은 반복(loop) 구간이 없어서 sprite-gen video-loop 대신 이 스크립트로 조립한다.
# 사용법: <sprite-gen venv python> art/achieve/build_web.py
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
OUT = ROOT.parent.parent / 'public' / 'achieve'
HEIGHT = 420  # 웹에 쓸 프레임 높이(px)
STEP = 2  # 24fps 영상에서 2프레임마다 1장 (12fps)
FPS = 24 / STEP
COLS = 10  # 시트 한 줄의 칸 수


def find_libwebp(exe):
    found = shutil.which(exe)
    if found:
        return found
    pkgs = Path(os.environ.get('LOCALAPPDATA', '')) / 'Microsoft' / 'WinGet' / 'Packages'
    hits = sorted(pkgs.glob(f'Google.Libwebp*/*/bin/{exe}.exe'))
    return str(hits[0]) if hits else None


IMG2WEBP = find_libwebp('img2webp')
CWEBP = find_libwebp('cwebp')

def load_frames(clip):
    keyed = sorted((clip / 'frames' / 'keyed').glob('*.png'))
    if not keyed:
        return []
    frames = [Image.open(f).convert('RGBA') for f in keyed[::STEP]]
    if keyed[-1] != keyed[::STEP][-1]:
        frames.append(Image.open(keyed[-1]).convert('RGBA'))  # 끝 프레임(다음 단계 자세)은 꼭 넣는다
    return frames


OUT.mkdir(parents=True, exist_ok=True)
clips = {c.name: load_frames(c) for c in sorted((ROOT / 'clips').iterdir()) if c.is_dir()}
clips = {k: v for k, v in clips.items() if v}

# 모든 클립을 같은 영역·같은 배율로 자른다 → 앞 클립의 끝과 다음 클립의 시작이 같은 크기·위치로 이어진다
box = None
for frames in clips.values():
    for f in frames:
        b = f.getchannel('A').getbbox()
        if b:
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
pad = 6
first = next(iter(clips.values()))[0]
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(first.width, box[2] + pad), min(first.height, box[3] + pad))
scale = HEIGHT / (box[3] - box[1])
w = round((box[2] - box[0]) * scale)

manifest = {}
for name, frames in clips.items():
    cells = [f.crop(box).resize((w, HEIGHT), Image.LANCZOS) for f in frames]

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        rows = -(-len(cells) // COLS)
        strip = Image.new('RGBA', (w * min(COLS, len(cells)), HEIGHT * rows))
        for i, c in enumerate(cells):
            strip.alpha_composite(c, ((i % COLS) * w, (i // COLS) * HEIGHT))
            c.save(tmp / f'{i:03d}.png')
        strip.save(tmp / 'strip.png')
        delay = round(1000 / FPS)
        # 시트: 웹 페이지가 칸을 넘기며 재생 / 애니메이션: 미리보기·다운로드용(1회 재생)
        subprocess.run([CWEBP, '-quiet', '-q', '88', '-alpha_q', '100', '-m', '6', str(tmp / 'strip.png'), '-o', str(OUT / f'{name}.strip.webp')], check=True)
        subprocess.run([IMG2WEBP, '-loop', '1', '-lossy', '-q', '85', '-d', str(delay), *[str(tmp / f'{i:03d}.png') for i in range(len(cells))], '-o', str(OUT / f'{name}.webp')], check=True)

    manifest[name] = {'strip': f'/achieve/{name}.strip.webp', 'anim': f'/achieve/{name}.webp', 'frames': len(cells), 'cols': COLS, 'w': w, 'h': HEIGHT, 'fps': FPS}
    print(name, len(cells), 'frames', f'{w}x{HEIGHT}')

(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
