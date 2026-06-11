#!/usr/bin/env python3
"""v2(Elgato) Photoshop 아이콘 컬러 스왑 — 형태 100% 유지 (2026-06-11 사용자 지시).

매핑: 검정 배경 → PS 다크네이비(#001E36) 풀블리드
      흰색 아트워크 → PS 블루(#31A8FF) (기본 톤)
      기존 블루 액센트 → 흰색 (투톤 반전 유지)
입력: Downloads/플러그인/CUBE/Adobe Photoshop v2/*.cubeone (shortcut만)
출력: assets/cubepacks-clean/_recolored/{원라벨}.png (256px)
"""
import base64
import colorsys
import io
import json
import os
import re
import sys
import zipfile

from PIL import Image

SRC = os.path.join(os.path.expanduser('~'), 'Downloads', '플러그인', 'CUBE', 'Adobe Photoshop v2')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'cubepacks-clean', '_recolored')

NAVY = (0, 30, 54)        # #001E36
BLUE = (49, 168, 255)     # #31A8FF
WHITE = (255, 255, 255)


def recolor(img: Image.Image) -> Image.Image:
    img = img.convert('RGB').resize((256, 256), Image.LANCZOS)
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if vv < 0.16:
                # 배경(검정) → 네이비
                px[x, y] = NAVY
            elif ss > 0.30 and 0.52 <= hh <= 0.65:
                # 기존 블루 액센트 → 흰색 (밝기 보존)
                t = vv
                px[x, y] = (
                    int(NAVY[0] + (WHITE[0] - NAVY[0]) * t),
                    int(NAVY[1] + (WHITE[1] - NAVY[1]) * t),
                    int(NAVY[2] + (WHITE[2] - NAVY[2]) * t),
                )
            else:
                # 흰색/회색 아트워크 → 블루 (밝기 보존, 안티앨리어싱 자연 처리)
                t = vv * (1 - ss * 0.3)
                px[x, y] = (
                    int(NAVY[0] + (BLUE[0] - NAVY[0]) * t),
                    int(NAVY[1] + (BLUE[1] - NAVY[1]) * t),
                    int(NAVY[2] + (BLUE[2] - NAVY[2]) * t),
                )
    return img


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    done = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.cubeone'):
            continue
        with zipfile.ZipFile(os.path.join(SRC, f)) as z:
            manifest = json.loads(z.read('manifest.json').decode('utf-8'))
        cube = manifest.get('cube', {})
        if cube.get('action_type') != 'shortcut':
            continue
        icon_url = cube.get('icon_url') or ''
        m = re.match(r'data:image/(png|jpeg);base64,(.+)', icon_url)
        if not m:
            print('SKIP(no icon):', cube.get('label'))
            continue
        img = Image.open(io.BytesIO(base64.b64decode(m.group(2))))
        out = recolor(img)
        safe = re.sub(r'[\\/:*?"<>|]', '_', cube.get('label', f))
        out.save(os.path.join(OUT, f'{safe}.png'), 'PNG')
        done += 1
        print(f'[{done}] {cube.get("label")}')
    print('완료:', done)


if __name__ == '__main__':
    sys.exit(main())
