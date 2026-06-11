#!/usr/bin/env python3
"""진단: v2 아이콘들의 세로 블록 배치(top, bottom, 직전 블록과의 gap) 출력."""
import base64
import io
import json
import os
import re
import sys
import zipfile

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib
rv = importlib.import_module('recolor-v2-icons'.replace('-', '_')) if False else None

SRC = os.path.join(os.path.expanduser('~'), 'Downloads', '플러그인', 'CUBE', 'Adobe Photoshop v2')
TARGETS = {'Adj Black And White', 'Adj Color Balance', 'Auto Color', 'Duplicate Layers', 'Group Layers'}


def content_mask(img):
    g = img.convert('L')
    return g.point(lambda v: 255 if v > 55 else 0)


def row_blocks(mask):
    w, h = mask.size
    px = mask.load()
    rows = [any(px[x, y] for x in range(0, w, 2)) for y in range(h)]
    blocks, start, gap = [], None, 0
    for y, has in enumerate(rows):
        if has:
            if start is None:
                start = y
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= 6:
                blocks.append((start, y - gap))
                start, gap = None, 0
    if start is not None:
        blocks.append((start, h - 1))
    return blocks


for f in sorted(os.listdir(SRC)):
    if not f.endswith('.cubeone'):
        continue
    with zipfile.ZipFile(os.path.join(SRC, f)) as z:
        manifest = json.loads(z.read('manifest.json').decode('utf-8'))
    cube = manifest.get('cube', {})
    if cube.get('label') not in TARGETS:
        continue
    m = re.match(r'data:image/(png|jpeg);base64,(.+)', cube.get('icon_url') or '')
    if not m:
        continue
    img = Image.open(io.BytesIO(base64.b64decode(m.group(2)))).convert('RGB')
    h = img.size[1]
    blocks = row_blocks(content_mask(img))
    parts = []
    prev_bottom = None
    for (t, b) in blocks:
        gap = (t - prev_bottom) if prev_bottom is not None else 0
        parts.append(f'[{t}..{b}] h={b-t} top%={t*100//h} gap={gap}')
        prev_bottom = b
    print(f"{cube['label']} (h={h}):")
    for p in parts:
        print('   ', p)
