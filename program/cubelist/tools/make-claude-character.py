#!/usr/bin/env python3
"""Claude 캐릭터 팩 아이콘 — 공식 starburst 로고의 의인화 (자체 디자인, fal.ai 미사용 정책 준수).

코랄 배경 + 크림 starburst + 얼굴(눈·스마일). 4x 드로잉 후 축소.
출력: assets/cubepacks-clean/_claude-icons/_pack-character.png (512)
"""
import math
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'cubepacks-clean', '_claude-icons', '_pack-character.png')

CORAL = (217, 119, 87)    # #D97757 공식 코랄 배경
CREAM = (250, 243, 235)   # 크림 (로고 버스트 톤)
DARK = (38, 26, 20)       # 얼굴 다크

S = 2048  # 4x → 512
cx, cy = S // 2, S // 2

img = Image.new('RGB', (S, S), CORAL)
d = ImageDraw.Draw(img)

# starburst — 공식 로고 모티프 (12 레이, 불규칙 길이로 손그림 느낌)
ray_w = 150
lengths = [880, 800, 860, 790, 870, 810, 880, 800, 850, 790, 870, 820]
for i in range(12):
    ang = math.radians(i * 30 + 8)
    r1, r2 = 430, lengths[i]
    x1, y1 = cx + r1 * math.cos(ang), cy + r1 * math.sin(ang)
    x2, y2 = cx + r2 * math.cos(ang), cy + r2 * math.sin(ang)
    d.line((x1, y1, x2, y2), fill=CREAM, width=ray_w)

# 중앙 얼굴판
d.ellipse((cx - 460, cy - 460, cx + 460, cy + 460), fill=CREAM)

# 눈 — 좌우 동그란 다크 눈 (살짝 아래)
for ex in (cx - 185, cx + 185):
    d.ellipse((ex - 75, cy - 135, ex + 75, cy + 15), fill=DARK)

# 스마일 — 호
d.arc((cx - 240, cy - 80, cx + 240, cy + 290), start=20, end=160, fill=DARK, width=62)

# 볼터치 — 연코랄
BLUSH = (235, 168, 140)
for bx in (cx - 320, cx + 320):
    d.ellipse((bx - 78, cy + 45, bx + 78, cy + 175), fill=BLUSH)

img = img.resize((512, 512), Image.LANCZOS)
img.save(OUT, 'PNG')
print('생성:', OUT)
