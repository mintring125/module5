"""기존 성장 시트의 마지막 프레임을 펫의 레벨별 정지 이미지로 내보낸다.

시트와 같은 여백·배율·발 위치를 유지하여 성장 재생 전후 크기가 튀지 않는다.
사용법: python art/achieve/build_pet.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
MOTION = PUBLIC / 'achieve'
OUT = MOTION / 'pet'


def build():
    manifest = json.loads((MOTION / 'manifest.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    for gender in ('boy', 'girl'):
        for level in range(1, 7):
            name = f'{gender}-1' if level == 1 else f'{gender}-{level - 1}to{level}'
            clip = manifest[name]
            frame = clip['frames'] - 1
            x = frame % clip['cols'] * clip['w']
            y = frame // clip['cols'] * clip['h']
            with Image.open(PUBLIC / clip['strip'].lstrip('/')) as sheet:
                assert x + clip['w'] <= sheet.width and y + clip['h'] <= sheet.height
                image = sheet.crop((x, y, x + clip['w'], y + clip['h'])).convert('RGBA')
                assert image.getchannel('A').getbbox(), f'Empty last frame: {name}'
                image.save(OUT / f'{gender}-{level}.webp', 'WEBP', lossless=True, method=6)
    print('Exported 12 aligned level images from existing growth motion sheets.')


if __name__ == '__main__':
    build()
