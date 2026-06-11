#!/usr/bin/env python3
"""Claude Code 큐브팩 아이콘 v2 — 라이트(아이보리) 테마 + /명령어 타이포 시리즈.

2026-06-11 사용자 지침:
- 배경 = Claude 홈페이지 아이보리(#F0EEE6) 풀블리드
- 아이콘 아트 = 메인 코랄(#D97757) (+ 진한 코랄 액센트)
- 글씨(타이포 아이콘·라벨) = 블랙에 가까운 다크그레이(#1F1E1D), 전체 터미널 모노 폰트(Consolas Bold)
- /명령어 시리즈 = "/clear" 텍스트 자체를 터미널 폰트로 아이콘화 (최장 명령 기준 단일 크기)
출력: assets/cubepacks-clean/_claude-icons/{label}.png
"""
import math
import os
import re

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'cubepacks-clean', '_claude-icons')
MONO_FONT = 'C:/Windows/Fonts/consolab.ttf'  # Consolas Bold — 터미널 폰트

BG = (240, 238, 230)      # #F0EEE6 Claude 아이보리
MAIN = (217, 119, 87)     # #D97757 메인 코랄
ACCENT = (193, 95, 60)    # #C15F3C 진한 코랄 (라이트 배경 대비 액센트)
TEXT = (31, 30, 29)       # #1F1E1D 블랙에 가까운 다크그레이

CANVAS = 256
SCALE = 4
ART_TOP = 28
CONTENT = 0.58
TEXT_MAX_W = CANVAS - 24

S = CANVAS * SCALE
AT = ART_TOP * SCALE
TARGET = int(S * CONTENT)
ZONE_CY = AT + TARGET // 2
ZONE_CX = S // 2
LW = 26


def base():
    img = Image.new('RGB', (S, S), BG)
    return img, ImageDraw.Draw(img)


def rrect(d, box, r, **kw):
    d.rounded_rectangle(box, radius=r, **kw)


def zbox(w, h):
    return (ZONE_CX - w // 2, ZONE_CY - h // 2, ZONE_CX + w // 2, ZONE_CY + h // 2)


# ── 그림 아이콘 (12종) ──────────────────────────────────────────────────────

def art_plan_mode(d):
    x0, y0, x1, y1 = zbox(440, 440)
    rrect(d, (x0, y0, x1, y1), 60, outline=MAIN, width=LW)
    d.line((x0 + 90, y0 + 140, x0 + 230, y0 + 140), fill=MAIN, width=LW)
    d.line((x0 + 90, y0 + 230, x0 + 230, y0 + 230), fill=MAIN, width=LW)
    d.line((x0 + 270, y0 + 300, x0 + 320, y0 + 360), fill=ACCENT, width=LW + 6)
    d.line((x0 + 320, y0 + 360, x1 - 70, y0 + 250), fill=ACCENT, width=LW + 6)


def art_thinking(d):
    cx, cy = ZONE_CX, ZONE_CY - 30
    d.ellipse((cx - 160, cy - 160, cx + 160, cy + 160), outline=MAIN, width=LW)
    d.line((cx - 70, cy + 200, cx + 70, cy + 200), fill=MAIN, width=LW)
    d.line((cx - 55, cy + 260, cx + 55, cy + 260), fill=MAIN, width=LW)
    d.line((cx, cy - 60, cx, cy + 60), fill=ACCENT, width=LW)
    d.line((cx - 50, cy + 10, cx, cy + 60), fill=ACCENT, width=LW)


def art_interrupt(d):
    cx, cy, r = ZONE_CX, ZONE_CY, 220
    pts = [(cx + r * math.cos(math.radians(22.5 + 45 * i)),
            cy + r * math.sin(math.radians(22.5 + 45 * i))) for i in range(8)]
    d.polygon(pts, outline=MAIN, width=LW)
    d.line((cx - 110, cy, cx + 110, cy), fill=ACCENT, width=LW + 8)


def art_stop(d):
    d.ellipse(zbox(440, 440), outline=MAIN, width=LW)
    rrect(d, zbox(170, 170), 24, fill=ACCENT)


def art_continue(d):
    cx, cy = ZONE_CX, ZONE_CY
    for off in (-120, 60):
        d.polygon([(cx + off, cy - 130), (cx + off, cy + 130), (cx + off + 180, cy)],
                  outline=MAIN, width=LW, fill=None if off == -120 else ACCENT)


def art_git_status(d):
    lx = ZONE_CX - 140
    ty, by2 = ZONE_CY - 170, ZONE_CY + 170
    rx, ry = ZONE_CX + 160, ZONE_CY - 80
    d.line((lx, ty, lx, by2), fill=MAIN, width=LW)
    d.line((lx, ZONE_CY + 40, rx, ry), fill=MAIN, width=LW)
    for (px, py) in ((lx, ty), (lx, by2)):
        d.ellipse((px - 52, py - 52, px + 52, py + 52), fill=BG, outline=MAIN, width=LW)
    d.ellipse((rx - 52, ry - 52, rx + 52, ry + 52), fill=BG, outline=ACCENT, width=LW)


def art_git_diff(d):
    x0, y0, _, _ = zbox(440, 440)
    rrect(d, (x0, y0, x0 + 200, y0 + 200), 30, outline=MAIN, width=LW - 6)
    d.line((x0 + 100, y0 + 56, x0 + 100, y0 + 144), fill=MAIN, width=LW)
    d.line((x0 + 56, y0 + 100, x0 + 144, y0 + 100), fill=MAIN, width=LW)
    x2, y2 = x0 + 240, y0 + 240
    rrect(d, (x2, y2, x2 + 200, y2 + 200), 30, outline=ACCENT, width=LW - 6)
    d.line((x2 + 56, y2 + 100, x2 + 144, y2 + 100), fill=ACCENT, width=LW)


def art_git_log(d):
    x0, y0, x1, y1 = zbox(420, 400)
    lx = x0 + 60
    d.line((lx, y0 + 30, lx, y1 - 30), fill=MAIN, width=LW - 8)
    for i, ty in enumerate((y0 + 60, (y0 + y1) // 2, y1 - 60)):
        color = ACCENT if i == 0 else MAIN
        d.ellipse((lx - 40, ty - 40, lx + 40, ty + 40), fill=BG, outline=color, width=LW - 4)
        d.line((lx + 90, ty, x1, ty), fill=color, width=LW - 4)


def art_terminal(d):
    x0, y0, x1, y1 = zbox(470, 380)
    rrect(d, (x0, y0, x1, y1), 44, outline=MAIN, width=LW)
    d.line((x0, y0 + 90, x1, y0 + 90), fill=MAIN, width=LW - 10)
    d.line((x0 + 70, y0 + 160, x0 + 150, y0 + 235), fill=ACCENT, width=LW)
    d.line((x0 + 150, y0 + 235, x0 + 70, y0 + 310), fill=ACCENT, width=LW)
    d.line((x0 + 200, y0 + 310, x0 + 330, y0 + 310), fill=ACCENT, width=LW)


def art_docs(d):
    x0, y0, x1, y1 = zbox(360, 450)
    fold = 110
    d.polygon([(x0, y0), (x1 - fold, y0), (x1, y0 + fold), (x1, y1), (x0, y1)], outline=MAIN, width=LW)
    d.line((x1 - fold, y0, x1 - fold, y0 + fold), fill=MAIN, width=LW - 8)
    d.line((x1 - fold, y0 + fold, x1, y0 + fold), fill=MAIN, width=LW - 8)
    for i, ly in enumerate((y0 + 190, y0 + 270, y0 + 350)):
        d.line((x0 + 70, ly, x1 - 70, ly), fill=ACCENT if i == 0 else MAIN, width=LW - 8)


def art_console(d):
    x0, y0, x1, y1 = zbox(470, 380)
    rrect(d, (x0, y0, x1, y1), 44, outline=MAIN, width=LW)
    for i, sy in enumerate((y0 + 130, y0 + 250)):
        d.line((x0 + 70, sy, x1 - 70, sy), fill=MAIN, width=LW - 10)
        kx = x0 + (170 if i == 0 else 320)
        d.ellipse((kx - 36, sy - 36, kx + 36, sy + 36), fill=ACCENT)


def art_claude_ai(d):
    # Claw'd — Claude Code 공식 마스코트 (픽셀 게, 참조 clawd-ref2 비율)
    Z = int(S * 0.66)  # 캐릭터 박스
    ox = ZONE_CX - Z // 2
    oy = ZONE_CY - Z // 2 + int(Z * 0.07)  # 캐릭터 y중심(430/1000) 보정

    def prect(x0, y0, x1, y1, color):
        d.rectangle((ox + x0 * Z // 1000, oy + y0 * Z // 1000,
                     ox + x1 * Z // 1000, oy + y1 * Z // 1000), fill=color)

    prect(258, 165, 742, 295, MAIN)    # 머리
    prect(125, 295, 875, 424, MAIN)    # 어깨 풀로우
    prect(125, 424, 258, 493, MAIN)    # 좌팔
    prect(742, 424, 875, 493, MAIN)    # 우팔
    prect(258, 424, 742, 549, MAIN)    # 몸통
    prect(268, 549, 343, 694, MAIN)    # 다리 1
    prect(413, 549, 488, 694, MAIN)    # 다리 2
    prect(581, 549, 656, 694, MAIN)    # 다리 3
    prect(722, 549, 797, 694, MAIN)    # 다리 4
    prect(323, 206, 395, 278, TEXT)    # 눈 좌
    prect(629, 206, 701, 278, TEXT)    # 눈 우


def art_claude_run(d):
    # 터미널 창 + 미니 Claw'd — 터미널에서 Claude 시작 버튼 (2026-06-11)
    x0, y0, x1, y1 = zbox(500, 420)
    rrect(d, (x0, y0, x1, y1), 44, outline=MAIN, width=LW)
    d.line((x0, y0 + 80, x1, y0 + 80), fill=MAIN, width=LW - 10)
    # 미니 Claw'd (창 내부 중앙)
    mx, my = (x0 + x1) // 2, y0 + 80 + (y1 - y0 - 80) // 2 - 10
    u = 0.42  # 미니 스케일

    def crect(rx0, ry0, rx1, ry1, color):
        d.rectangle((mx + rx0 * u, my + ry0 * u, mx + rx1 * u, my + ry1 * u), fill=color)

    crect(-242, -200, 242, -70, MAIN)            # 머리
    crect(-375, -70, 375, 60, MAIN)              # 어깨
    crect(-375, 60, -242, 130, MAIN)             # 좌팔
    crect(242, 60, 375, 130, MAIN)               # 우팔
    crect(-242, 60, 242, 185, MAIN)              # 몸통
    for lx0 in (-232, -87, 81, 222):             # 다리 4
        crect(lx0, 185, lx0 + 75, 330, MAIN)
    crect(-177, -160, -105, -88, TEXT)           # 눈 좌
    crect(129, -160, 201, -88, TEXT)             # 눈 우


PICTORIAL = {
    'Claude Run': art_claude_run,
    'Plan Mode': art_plan_mode,
    'Thinking': art_thinking,
    'Interrupt': art_interrupt,
    'Stop': art_stop,
    'Continue': art_continue,
    'Git Status': art_git_status,
    'Git Diff': art_git_diff,
    'Git Log': art_git_log,
    'Terminal': art_terminal,
    'Claude Docs': art_docs,
    'Console': art_console,
    'Claude AI': art_claude_ai,
}

# ── /명령어 타이포 시리즈 — 커맨드 텍스트 = 타일 정중앙 아이콘 (라벨 없음) ──
SLASH_SERIES = [
    # 자주 쓰는 기본
    '/clear', '/compact', '/model', '/resume', '/cost', '/init', '/memory', '/agents',
    # 잘 모르는데 유용한 기본
    '/mcp', '/config', '/permissions', '/doctor', '/review', '/rewind', '/context', '/export',
    '/vim', '/hooks', '/statusline', '/add-dir', '/usage', '/todos', '/bug',
    # 워크스페이스 커스텀 (E:\Claude-Workspace commands/skills)
    '/plan', '/tdd', '/verify', '/code-review', '/e2e', '/loop', '/schedule', '/learn',
]

# 사고 강화/오케스트레이션 키워드 (슬래시 아님 — 프롬프트 키워드)
KEYWORDS = ['think', 'think hard', 'ultrathink', 'ultracode']


def fit_font(texts, max_w, start=64):
    probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))
    size = start
    while size > 8:
        font = ImageFont.truetype(MONO_FONT, size)
        if max(probe.textlength(t, font=font) for t in texts) <= max_w:
            return font, size
        size -= 1
    return ImageFont.truetype(MONO_FONT, 8), 8


def save_tile(img_s, label, label_font, text_cy):
    tile = img_s.resize((CANVAS, CANVAS), Image.LANCZOS)
    td = ImageDraw.Draw(tile)
    td.text((CANVAS // 2, text_cy), label, font=label_font, fill=TEXT, anchor='mm')
    safe = re.sub(r'[\\/:*?"<>|]', '_', label) if not label.startswith('/') else label[1:]
    tile.save(os.path.join(OUT, f'{safe}.png'), 'PNG')


def main():
    os.makedirs(OUT, exist_ok=True)
    label_font, label_size = fit_font(list(PICTORIAL.keys()), TEXT_MAX_W, start=40)
    # 2026-06-11 사용자 지침: 라벨 일괄 10% 축소
    label_size = max(8, int(label_size * 0.9))
    label_font = ImageFont.truetype(MONO_FONT, label_size)
    art_bottom = ART_TOP + int(CANVAS * CONTENT)
    text_cy = art_bottom + (CANVAS - art_bottom) // 2

    # 그림 아이콘 — 아트 상단 + 라벨 아래 (유지)
    for label, fn in PICTORIAL.items():
        img, d = base()
        fn(d)
        save_tile(img, label, label_font, text_cy)

    # /명령어·키워드 타이포 아이콘 — 텍스트만 타일 정중앙, 라벨 없음 (2026-06-11 사용자 확정)
    typo_all = SLASH_SERIES + KEYWORDS
    cmd_font_s, cmd_size = fit_font(typo_all, (S - 24 * SCALE), start=60 * SCALE)
    for cmd in typo_all:
        img, d = base()
        d.text((S // 2, S // 2), cmd, font=cmd_font_s, fill=TEXT, anchor='mm')
        tile = img.resize((CANVAS, CANVAS), Image.LANCZOS)
        prefix = 'slash-' if cmd.startswith('/') else 'kw-'
        safe = re.sub(r'[\\/:*?"<>| ]', '_', cmd.lstrip('/'))
        tile.save(os.path.join(OUT, f'{prefix}{safe}.png'), 'PNG')

    print(f'완료: 그림 {len(PICTORIAL)} + 타이포 {len(typo_all)} / 라벨 {label_size}px / 명령 {cmd_size // SCALE}px@256')


if __name__ == '__main__':
    main()
