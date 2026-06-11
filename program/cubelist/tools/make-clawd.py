#!/usr/bin/env python3
"""Claw'd — Claude Code 공식 마스코트 충실 재현 v2.

참조: cache/clawd-ref2.jpg (Welcome, Claw'd — 공식 픽셀 비율)
구조: 머리 블록 + 검정 정사각 눈 2 + 어깨 풀로우(팔이 아래로 늘어짐) + 몸통 + 다리 4.
산출:
  1) 팩 아이콘: 코랄 배경 + 크림 Claw'd  → _claude-icons/_pack-character.png (512)
  2) 큐브용:   아이보리 배경 + 코랄 Claw'd → _claude-icons/_clawd-cube.png (512)
"""
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, '..', 'assets', 'cubepacks-clean', '_claude-icons')

CORAL = (201, 116, 88)    # 참조 이미지 톤
CREAM = (250, 243, 235)
IVORY = (240, 238, 230)
DARK = (20, 20, 19)       # 눈 (검정에 가까운 다크)


def draw_clawd(size, bg, body, eye):
    """공식 비율 (1000 그리드 정규화, 참조 clawd-ref2 실측)."""
    img = Image.new('RGB', (size, size), bg)
    d = ImageDraw.Draw(img)
    s = size / 1000

    def rect(x0, y0, x1, y1, color):
        d.rectangle((round(x0 * s), round(y0 * s), round(x1 * s), round(y1 * s)), fill=color)

    # 머리 블록
    rect(258, 165, 742, 295, body)
    # 어깨 풀로우 (팔 포함 전체 폭)
    rect(125, 295, 875, 424, body)
    # 팔 늘어짐 (좌/우 기둥)
    rect(125, 424, 258, 493, body)
    rect(742, 424, 875, 493, body)
    # 몸통 (팔 사이)
    rect(258, 424, 742, 549, body)
    # 다리 4
    rect(268, 549, 343, 694, body)
    rect(413, 549, 488, 694, body)
    rect(581, 549, 656, 694, body)
    rect(722, 549, 797, 694, body)
    # 눈 — 검정 정사각 2 (머리 블록 안)
    rect(323, 206, 395, 278, eye)
    rect(629, 206, 701, 278, eye)
    return img


os.makedirs(OUT_DIR, exist_ok=True)

pack = draw_clawd(2048, CORAL, CREAM, DARK).resize((512, 512), Image.NEAREST)
pack.save(os.path.join(OUT_DIR, '_pack-character.png'), 'PNG')

cube = draw_clawd(2048, IVORY, CORAL, DARK).resize((512, 512), Image.NEAREST)
cube.save(os.path.join(OUT_DIR, '_clawd-cube.png'), 'PNG')

print('생성: _pack-character.png + _clawd-cube.png (공식 비율 v2)')
