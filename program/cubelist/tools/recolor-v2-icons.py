#!/usr/bin/env python3
"""v2(Elgato) Photoshop 아이콘 → 클린 타일 변환 v2 (2026-06-11 사용자 지시 2차).

1) 이미지 안에 박힌 영문 텍스트 블록 제거 (하단 분리 블록 감지) — 기능명은 셀 라벨로만
2) 아트워크 bbox 추출 → 256 캔버스 중앙, 사방 19% 균일 여백으로 재배치
3) 컬러: 검정 배경 → 다크네이비(#001E36) 풀블리드
         흰색 아트워크 → PS 블루(#31A8FF) 기본톤
         기존 블루 액센트 → 밝은 블루(#9ED7FF) — 흰색 강제 사용 금지
출력: assets/cubepacks-clean/_recolored/{원라벨}.png
"""
import base64
import colorsys
import io
import json
import os
import re
import sys
import zipfile

from PIL import Image, ImageDraw, ImageFont

SRC = os.path.join(os.path.expanduser('~'), 'Downloads', '플러그인', 'CUBE', 'Adobe Photoshop v2')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'cubepacks-clean', '_recolored')

NAVY = (0, 30, 54)        # #001E36
BLUE = (49, 168, 255)     # #31A8FF 기본톤
LIGHT = (158, 215, 255)   # #9ED7FF 액센트 (흰색 대체)

CANVAS = 256
CONTENT = 0.58            # 아트워크 영역 비율
ART_TOP = 28              # 아트워크 상단 고정 (중앙 대비 약 20% 위)
FONT_PATH = os.path.join(HERE, '..', 'assets', 'fonts', 'NotoSans-Bold.ttf')
TEXT_MAX_W = CANVAS - 24  # 텍스트 좌우 여백 12px

# 라벨 정정 (빌더 RELABEL과 동기) — 2026-06-11 단축 라벨 (글씨 크기 확보)
RELABEL = {
    'Foreground': 'Default Colors',
    'Background': 'Swap Colors',
    'Fill with Foreground Color': 'Fill Foreground',
    'Fill with Background Color': 'Fill Background',
    'Increase Brush Size': 'Brush Size +',
    'Decrease Brush Size': 'Brush Size -',
    'Adj Black And White': 'Black & White',
    'Adj Color Balance': 'Color Balance',
}


def uniform_font_size(labels):
    """가장 긴 이름이 TEXT_MAX_W 안에 들어가는 최대 크기 — 전 타일 단일 크기."""
    probe = Image.new('RGB', (8, 8))
    draw = ImageDraw.Draw(probe)
    size = 40
    while size > 8:
        font = ImageFont.truetype(FONT_PATH, size)
        widest = max(draw.textlength(t, font=font) for t in labels)
        if widest <= TEXT_MAX_W:
            return size
        size -= 1
    return 8


def content_mask(img):
    """비배경(아트워크/텍스트) 픽셀 마스크."""
    g = img.convert('L')
    return g.point(lambda v: 255 if v > 55 else 0)


def row_blocks(mask):
    """세로 방향 콘텐츠 블록 [(top,bottom)] — 6px 이상 빈 행이 구분자."""
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


# 텍스트 제거 한도 — 하단 아트가 텍스트 줄과 동일 메트릭인 아이콘만 예외
# Levels: ▲▲▲ 슬라이더 (gap 규칙으로도 보존되지만 이중 안전)
# Select All: marquee 아래 점선 변(h60)이 텍스트 줄(h50)과 메트릭 겹침 → 1블록만
STRIP_LIMIT = {'Levels': 1, 'Select All': 1}


def strip_text(img, label=''):
    """하단 분리 텍스트 블록 제거 → 아트워크만 남김.

    2줄 텍스트("Fill with BG" / "Color")는 줄마다 별도 블록이므로
    조건 충족하는 동안 꼬리 블록을 반복 제거한다. (라벨별 한도 STRIP_LIMIT)
    """
    mask = content_mask(img)
    h = img.size[1]
    blocks = row_blocks(mask)
    # 실측 기반 규칙 (diag-blocks.py, 350px 기준 비율):
    #  1줄째(맨 아래): 바닥 밀착(bottom>=92%) + 높이<=20% + top>=55%
    #  2줄째: 직전 줄과 gap<=4% + 줄 높이 11~19% (텍스트 줄 고유 높이)
    #  → 도장 밑판(h6%)·Levels ▲(gap 8%)는 자동 보존
    limit = STRIP_LIMIT.get(label, 2)
    removed = 0
    while len(blocks) >= 2 and removed < limit:
        top, bottom = blocks[-1]
        bh = bottom - top
        if removed == 0:
            # 높이 한도 0.36 — 줄 간격이 좁아 2줄이 한 블록으로 병합되는 경우 수용
            # (Adj Black And White h=31%, Duplicate Layers h=34% 실측)
            ok = bottom >= h * 0.92 and bh <= h * 0.36 and top >= h * 0.55
        else:
            gap = prev_top - bottom
            ok = gap <= h * 0.04 and h * 0.11 <= bh <= h * 0.19 and top >= h * 0.55
        if not ok:
            break
        prev_top = top
        blocks = blocks[:-1]
        removed += 1
    if not blocks:
        return img
    y0 = max(0, blocks[0][0] - 2)
    y1 = min(h, blocks[-1][1] + 3)
    return img.crop((0, y0, img.size[0], y1))


def draw_paste_art():
    """Paste 대체 아트 — v2 원본(풀 튜브)은 영어 말장난이라 혼란.
    표준 '클립보드' 마크를 흰색(기본톤 변환)으로 직접 드로잉."""
    img = Image.new('RGB', (512, 512), (0, 0, 0))
    d = ImageDraw.Draw(img)
    W = (255, 255, 255)
    A = (40, 140, 255)  # 블루 계열 → 액센트(밝은 블루)로 변환됨
    # 보드
    d.rounded_rectangle((112, 80, 400, 460), radius=42, outline=W, width=26)
    # 상단 클립
    d.rounded_rectangle((196, 38, 316, 124), radius=24, fill=W)
    # 내용 줄 (액센트)
    for y in (210, 280, 350):
        d.rounded_rectangle((176, y, 336, y + 24), radius=12, fill=A)
    return img


def art_bbox(img):
    m = content_mask(img)
    return m.getbbox()


def recolor_px(img):
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if vv < 0.16:
                px[x, y] = NAVY
            elif ss > 0.30 and 0.52 <= hh <= 0.65:
                t = vv
                px[x, y] = tuple(int(NAVY[i] + (LIGHT[i] - NAVY[i]) * t) for i in range(3))
            else:
                t = vv * (1 - ss * 0.3)
                px[x, y] = tuple(int(NAVY[i] + (BLUE[i] - NAVY[i]) * t) for i in range(3))
    return img


def to_tile(img, label, font, raw_label=''):
    """아트워크 상단(약 20% 위) 균일 배치 + 하단 기능명 1줄 (Noto Sans Bold, 블루)."""
    img = img.convert('RGB')
    img = strip_text(img, raw_label)
    box = art_bbox(img)
    if box:
        img = img.crop(box)
    target = int(CANVAS * CONTENT)
    ratio = min(target / img.size[0], target / img.size[1])
    nw, nh = max(1, int(img.size[0] * ratio)), max(1, int(img.size[1] * ratio))
    img = img.resize((nw, nh), Image.LANCZOS)
    img = recolor_px(img)
    tile = Image.new('RGB', (CANVAS, CANVAS), NAVY)
    # 아트워크: 가로 중앙 / 세로 = 고정 영역(ART_TOP..ART_TOP+target) 안 중앙
    tile.paste(img, ((CANVAS - nw) // 2, ART_TOP + (target - nh) // 2))
    # 기능명: 아트워크 영역 아래 잔여 공간 세로 중앙
    draw = ImageDraw.Draw(tile)
    art_bottom = ART_TOP + target
    text_cy = art_bottom + (CANVAS - art_bottom) // 2
    draw.text((CANVAS // 2, text_cy), label, font=font, fill=BLUE, anchor='mm')
    return tile


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    # 1차 스캔: 라벨 수집 → 최장 이름 기준 단일 폰트 크기
    items = []
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
        raw_label = cube.get('label', f)
        # 파일명 = 원본 라벨 (빌더 매칭 키), 표기 텍스트 = 정정 라벨
        items.append((raw_label, RELABEL.get(raw_label, raw_label), m.group(2)))

    size = uniform_font_size([fin for _, fin, _ in items])
    font = ImageFont.truetype(FONT_PATH, size)
    print('폰트 크기(최장 이름 기준):', size)

    done = 0
    for raw_label, final_label, b64 in items:
        if raw_label == 'Paste':
            img = draw_paste_art()  # 풀 튜브 말장난 → 표준 클립보드
        else:
            img = Image.open(io.BytesIO(base64.b64decode(b64)))
        tile = to_tile(img, final_label, font, raw_label)
        safe = re.sub(r'[\\/:*?"<>|]', '_', raw_label)
        tile.save(os.path.join(OUT, f'{safe}.png'), 'PNG')
        done += 1
    print('완료:', done)


if __name__ == '__main__':
    sys.exit(main())
