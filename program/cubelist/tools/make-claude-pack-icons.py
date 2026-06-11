#!/usr/bin/env python3
"""Claude Code 큐브팩 아이콘 16종 — 자체 기하 드로잉 (승인 기준 v6 파이프라인 준수).

스타일: 배경 = Claude 로고 컬러 계열 다크 웜 브라운 풀블리드
        기본톤 = 공식 코랄(#D97757) / 액센트 = 밝은 코랄 (흰색 강제 사용 금지)
        아트 상단 균일 배치 + 하단 기능명 베이크 (Noto Sans Bold, 최장 이름 기준 단일 크기, 1줄)
4x 드로잉 후 LANCZOS 축소 (안티앨리어싱).
출력: assets/cubepacks-clean/_claude-icons/{label}.png
"""
import math
import os
import re

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'cubepacks-clean', '_claude-icons')
FONT_PATH = os.path.join(HERE, '..', 'assets', 'fonts', 'NotoSans-Bold.ttf')

BG = (31, 22, 16)         # #1F1610 다크 웜 브라운 (Claude 코랄 계열 다크)
MAIN = (217, 119, 87)     # #D97757 Claude 공식 코랄
ACCENT = (242, 205, 180)  # #F2CDB4 밝은 코랄 (액센트)

CANVAS = 256
SCALE = 4                 # 4x 드로잉 → 축소
ART_TOP = 28
CONTENT = 0.58
TEXT_MAX_W = CANVAS - 24

S = CANVAS * SCALE        # 1024
AT = ART_TOP * SCALE
TARGET = int(S * CONTENT)  # 아트 존 크기
ZONE_CY = AT + TARGET // 2
ZONE_CX = S // 2
LW = 26                   # 기본 선 두께 (4x 기준 → 6.5px @256)


def base():
    img = Image.new('RGB', (S, S), BG)
    return img, ImageDraw.Draw(img)


def rrect(d, box, r, **kw):
    d.rounded_rectangle(box, radius=r, **kw)


# ── 아트 존 좌표 헬퍼: 존 중심 (ZONE_CX, ZONE_CY), 반경 ~TARGET/2 ──────────
def zbox(w, h):
    return (ZONE_CX - w // 2, ZONE_CY - h // 2, ZONE_CX + w // 2, ZONE_CY + h // 2)


def art_plan_mode(d):
    # 체크리스트: 둥근 사각 + 줄 2 + 체크
    x0, y0, x1, y1 = zbox(440, 440)
    rrect(d, (x0, y0, x1, y1), 60, outline=MAIN, width=LW)
    d.line((x0 + 90, y0 + 140, x0 + 230, y0 + 140), fill=MAIN, width=LW)
    d.line((x0 + 90, y0 + 230, x0 + 230, y0 + 230), fill=MAIN, width=LW)
    d.line((x0 + 270, y0 + 300, x0 + 320, y0 + 360), fill=ACCENT, width=LW + 6)
    d.line((x0 + 320, y0 + 360, x1 - 70, y0 + 250), fill=ACCENT, width=LW + 6)


def art_interrupt(d):
    # 정지 팔각형 + 중앙 바
    cx, cy, r = ZONE_CX, ZONE_CY, 220
    pts = [(cx + r * math.cos(math.radians(22.5 + 45 * i)),
            cy + r * math.sin(math.radians(22.5 + 45 * i))) for i in range(8)]
    d.polygon(pts, outline=MAIN, width=LW)
    d.line((cx - 110, cy, cx + 110, cy), fill=ACCENT, width=LW + 8)


def art_stop(d):
    # 원 + 사각 정지
    d.ellipse(zbox(440, 440), outline=MAIN, width=LW)
    rrect(d, zbox(170, 170), 24, fill=ACCENT)


def art_clear(d):
    # 백스페이스(⌫): 오각형 + X
    x0, y0, x1, y1 = zbox(470, 320)
    nose = 150
    pts = [(x0 + nose, y0), (x1, y0), (x1, y1), (x0 + nose, y1), (x0, (y0 + y1) // 2)]
    d.polygon(pts, outline=MAIN, width=LW)
    cx = x0 + nose + (x1 - x0 - nose) // 2
    cy = (y0 + y1) // 2
    o = 70
    d.line((cx - o, cy - o, cx + o, cy + o), fill=ACCENT, width=LW)
    d.line((cx - o, cy + o, cx + o, cy - o), fill=ACCENT, width=LW)


def art_compact(d):
    # 압축: 위/아래 화살표가 중앙 바를 향함
    cx, cy = ZONE_CX, ZONE_CY
    d.line((cx - 180, cy, cx + 180, cy), fill=MAIN, width=LW)
    for sgn in (-1, 1):
        ay = cy + sgn * 200
        d.line((cx, ay, cx, cy + sgn * 60), fill=MAIN, width=LW)
        d.polygon([(cx - 60, cy + sgn * 120), (cx + 60, cy + sgn * 120), (cx, cy + sgn * 48)], fill=ACCENT)


def art_model(d):
    # 칩: 사각 + 핀 + 코어
    x0, y0, x1, y1 = zbox(360, 360)
    rrect(d, (x0, y0, x1, y1), 40, outline=MAIN, width=LW)
    rrect(d, zbox(140, 140), 20, fill=ACCENT)
    for t in (0.3, 0.7):
        px = x0 + (x1 - x0) * t
        d.line((px, y0 - 70, px, y0), fill=MAIN, width=LW)
        d.line((px, y1, px, y1 + 70), fill=MAIN, width=LW)
        py = y0 + (y1 - y0) * t
        d.line((x0 - 70, py, x0, py), fill=MAIN, width=LW)
        d.line((x1, py, x1 + 70, py), fill=MAIN, width=LW)


def art_resume(d):
    # 원 + ▶
    d.ellipse(zbox(440, 440), outline=MAIN, width=LW)
    cx, cy = ZONE_CX + 20, ZONE_CY
    d.polygon([(cx - 70, cy - 110), (cx - 70, cy + 110), (cx + 110, cy)], fill=ACCENT)


def art_cost(d):
    # 게이지 반원 + 바늘
    cx, cy = ZONE_CX, ZONE_CY + 90
    r = 230
    d.arc((cx - r, cy - r, cx + r, cy + r), start=180, end=360, fill=MAIN, width=LW)
    for ang in (200, 240, 280, 320):
        x1p = cx + (r - 8) * math.cos(math.radians(ang))
        y1p = cy + (r - 8) * math.sin(math.radians(ang))
        x2p = cx + (r - 56) * math.cos(math.radians(ang))
        y2p = cy + (r - 56) * math.sin(math.radians(ang))
        d.line((x1p, y1p, x2p, y2p), fill=MAIN, width=14)
    d.line((cx, cy, cx + 150 * math.cos(math.radians(300)), cy + 150 * math.sin(math.radians(300))), fill=ACCENT, width=LW)
    d.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=ACCENT)


def art_continue(d):
    # ▶▶
    cx, cy = ZONE_CX, ZONE_CY
    for off in (-120, 60):
        d.polygon([(cx + off, cy - 130), (cx + off, cy + 130), (cx + off + 180, cy)],
                  outline=MAIN, width=LW, fill=None if off == -120 else ACCENT)


def art_git_status(d):
    # 브랜치: 세로 줄기(노드 2) + 대각 분기(액센트 노드)
    lx = ZONE_CX - 140
    ty, by2 = ZONE_CY - 170, ZONE_CY + 170
    rx, ry = ZONE_CX + 160, ZONE_CY - 80
    d.line((lx, ty, lx, by2), fill=MAIN, width=LW)
    d.line((lx, ZONE_CY + 40, rx, ry), fill=MAIN, width=LW)
    for (px, py) in ((lx, ty), (lx, by2)):
        d.ellipse((px - 52, py - 52, px + 52, py + 52), fill=BG, outline=MAIN, width=LW)
    d.ellipse((rx - 52, ry - 52, rx + 52, ry + 52), fill=BG, outline=ACCENT, width=LW)


def art_git_diff(d):
    # ＋ / － 두 블록
    x0, y0, _, _ = zbox(440, 440)
    rrect(d, (x0, y0, x0 + 200, y0 + 200), 30, outline=MAIN, width=LW - 6)
    d.line((x0 + 100, y0 + 56, x0 + 100, y0 + 144), fill=MAIN, width=LW)
    d.line((x0 + 56, y0 + 100, x0 + 144, y0 + 100), fill=MAIN, width=LW)
    x2, y2 = x0 + 240, y0 + 240
    rrect(d, (x2, y2, x2 + 200, y2 + 200), 30, outline=ACCENT, width=LW - 6)
    d.line((x2 + 56, y2 + 100, x2 + 144, y2 + 100), fill=ACCENT, width=LW)


def art_git_log(d):
    # 커밋 타임라인: 점 3 + 줄
    x0, y0, x1, y1 = zbox(420, 400)
    lx = x0 + 60
    d.line((lx, y0 + 30, lx, y1 - 30), fill=MAIN, width=LW - 8)
    for i, ty in enumerate((y0 + 60, (y0 + y1) // 2, y1 - 60)):
        color = ACCENT if i == 0 else MAIN
        d.ellipse((lx - 40, ty - 40, lx + 40, ty + 40), fill=BG, outline=color, width=LW - 4)
        d.line((lx + 90, ty, x1, ty), fill=color, width=LW - 4)


def art_terminal(d):
    # 터미널 창 + >_
    x0, y0, x1, y1 = zbox(470, 380)
    rrect(d, (x0, y0, x1, y1), 44, outline=MAIN, width=LW)
    d.line((x0, y0 + 90, x1, y0 + 90), fill=MAIN, width=LW - 10)
    d.line((x0 + 70, y0 + 160, x0 + 150, y0 + 235), fill=ACCENT, width=LW)
    d.line((x0 + 150, y0 + 235, x0 + 70, y0 + 310), fill=ACCENT, width=LW)
    d.line((x0 + 200, y0 + 310, x0 + 330, y0 + 310), fill=ACCENT, width=LW)


def art_docs(d):
    # 문서: 모서리 접힌 페이지 + 줄
    x0, y0, x1, y1 = zbox(360, 450)
    fold = 110
    d.polygon([(x0, y0), (x1 - fold, y0), (x1, y0 + fold), (x1, y1), (x0, y1)], outline=MAIN, width=LW)
    d.line((x1 - fold, y0, x1 - fold, y0 + fold), fill=MAIN, width=LW - 8)
    d.line((x1 - fold, y0 + fold, x1, y0 + fold), fill=MAIN, width=LW - 8)
    for i, ly in enumerate((y0 + 190, y0 + 270, y0 + 350)):
        d.line((x0 + 70, ly, x1 - 70, ly), fill=ACCENT if i == 0 else MAIN, width=LW - 8)


def art_console(d):
    # 콘솔 대시보드: 창 + 슬라이더 2
    x0, y0, x1, y1 = zbox(470, 380)
    rrect(d, (x0, y0, x1, y1), 44, outline=MAIN, width=LW)
    for i, sy in enumerate((y0 + 130, y0 + 250)):
        d.line((x0 + 70, sy, x1 - 70, sy), fill=MAIN, width=LW - 10)
        kx = x0 + (170 if i == 0 else 320)
        d.ellipse((kx - 36, sy - 36, kx + 36, sy + 36), fill=ACCENT)


def art_claude_ai(d):
    # Claude starburst (공식 마크 모티프 — 12 레이)
    cx, cy = ZONE_CX, ZONE_CY
    for i in range(12):
        ang = math.radians(i * 30 + 8)
        x1p = cx + 70 * math.cos(ang)
        y1p = cy + 70 * math.sin(ang)
        x2p = cx + 230 * math.cos(ang)
        y2p = cy + 230 * math.sin(ang)
        d.line((x1p, y1p, x2p, y2p), fill=MAIN, width=LW + 10)


def art_thinking(d):
    # 확장 사고: 전구 (원 + 베이스)
    cx, cy = ZONE_CX, ZONE_CY - 30
    d.ellipse((cx - 160, cy - 160, cx + 160, cy + 160), outline=MAIN, width=LW)
    d.line((cx - 70, cy + 200, cx + 70, cy + 200), fill=MAIN, width=LW)
    d.line((cx - 55, cy + 260, cx + 55, cy + 260), fill=MAIN, width=LW)
    d.line((cx, cy - 60, cx, cy + 60), fill=ACCENT, width=LW)
    d.line((cx - 50, cy + 10, cx, cy + 60), fill=ACCENT, width=LW)


ICONS = {
    'Plan Mode': art_plan_mode,
    'Interrupt': art_interrupt,
    'Stop': art_stop,
    'Clear': art_clear,
    'Compact': art_compact,
    'Model': art_model,
    'Resume': art_resume,
    'Cost': art_cost,
    'Continue': art_continue,
    'Git Status': art_git_status,
    'Git Diff': art_git_diff,
    'Git Log': art_git_log,
    'Terminal': art_terminal,
    'Claude Docs': art_docs,
    'Console': art_console,
    'Claude AI': art_claude_ai,
    'Thinking': art_thinking,
}


def uniform_font_size(labels):
    probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))
    size = 40
    while size > 8:
        font = ImageFont.truetype(FONT_PATH, size)
        if max(probe.textlength(t, font=font) for t in labels) <= TEXT_MAX_W:
            return size
        size -= 1
    return 8


def main():
    os.makedirs(OUT, exist_ok=True)
    fsize = uniform_font_size(list(ICONS.keys()))
    font = ImageFont.truetype(FONT_PATH, fsize)
    art_bottom = ART_TOP + int(CANVAS * CONTENT)
    text_cy = art_bottom + (CANVAS - art_bottom) // 2
    for label, fn in ICONS.items():
        img, d = base()
        fn(d)
        tile = img.resize((CANVAS, CANVAS), Image.LANCZOS)
        td = ImageDraw.Draw(tile)
        td.text((CANVAS // 2, text_cy), label, font=font, fill=MAIN, anchor='mm')
        safe = re.sub(r'[\\/:*?"<>|]', '_', label)
        tile.save(os.path.join(OUT, f'{safe}.png'), 'PNG')
    print(f'완료: {len(ICONS)}종 / 폰트 {fsize}px')


if __name__ == '__main__':
    main()
