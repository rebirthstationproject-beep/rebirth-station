/**
 * App 루트 드래그드롭 zone (v0.1.2).
 *
 * 처리 가능 파일:
 *   - .streamDeckPlugin → plugin-converter 자동 호출 (라이브러리 등록)
 *   - .streamDeckProfile → profile 변환기 (다음 단계, 현재 안내만)
 *   - .cubeone / .cubelist / .cubepack → cubepack-io importer
 *
 * 다중 파일 드롭 시 type 별 분류 처리.
 * dragover 시 전체 화면 overlay 표시.
 */

import { useEffect, useState, type DragEvent } from 'react';

interface DroppedSummary {
  plugins: number;
  profiles: number;
  cubeones: number;
  cubelists: number;
  cubepacks: number;
  unknown: number;
  errors: string[];
}

interface DropZoneProps {
  /** plugin import 콜백 — App.tsx 의 기존 변환 흐름 재사용 */
  readonly onPluginsDropped: (files: File[]) => Promise<void> | void;
  /** cubeone/.cubelist/.cubepack import 콜백 */
  readonly onCubeFilesDropped: (files: File[]) => Promise<void> | void;
  /** profile import 콜백 (선택, 미구현 시 안내만) */
  readonly onProfilesDropped?: (files: File[]) => Promise<void> | void;
}

function classifyExtension(name: string): keyof Omit<DroppedSummary, 'errors'> | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.streamdeckplugin')) return 'plugins';
  if (lower.endsWith('.streamdeckprofile')) return 'profiles';
  if (lower.endsWith('.cubeone')) return 'cubeones';
  if (lower.endsWith('.cubelist') || lower.endsWith('.cubedeck')) return 'cubelists';
  if (lower.endsWith('.cubepack')) return 'cubepacks';
  return null;
}

export function DropZone({ onPluginsDropped, onCubeFilesDropped, onProfilesDropped }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    let depth = 0;
    function handleDragEnter(e: globalThis.DragEvent): void {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
      e.preventDefault();
      depth++;
      setIsOver(true);
    }
    function handleDragLeave(e: globalThis.DragEvent): void {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
      depth--;
      if (depth <= 0) {
        depth = 0;
        setIsOver(false);
      }
    }
    function handleDragOver(e: globalThis.DragEvent): void {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
    function handleDrop(): void {
      depth = 0;
      setIsOver(false);
    }
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  async function handleDrop(e: DragEvent<HTMLDivElement>): Promise<void> {
    e.preventDefault();
    setIsOver(false);

    const dt = e.dataTransfer;
    if (!dt || dt.files.length === 0) return;

    const files = Array.from(dt.files);
    const summary: DroppedSummary = {
      plugins: 0,
      profiles: 0,
      cubeones: 0,
      cubelists: 0,
      cubepacks: 0,
      unknown: 0,
      errors: [],
    };

    const plugins: File[] = [];
    const profiles: File[] = [];
    const cubeFiles: File[] = [];

    for (const file of files) {
      const cat = classifyExtension(file.name);
      switch (cat) {
        case 'plugins':
          plugins.push(file);
          summary.plugins++;
          break;
        case 'profiles':
          profiles.push(file);
          summary.profiles++;
          break;
        case 'cubeones':
          cubeFiles.push(file);
          summary.cubeones++;
          break;
        case 'cubelists':
          cubeFiles.push(file);
          summary.cubelists++;
          break;
        case 'cubepacks':
          cubeFiles.push(file);
          summary.cubepacks++;
          break;
        default:
          summary.unknown++;
          summary.errors.push(`${file.name}: 지원하지 않는 형식`);
      }
    }

    // 순차 처리 (변환 작업이 무거우므로 한 카테고리씩)
    try {
      if (plugins.length > 0) await onPluginsDropped(plugins);
    } catch (err) {
      summary.errors.push(`plugin 변환: ${err instanceof Error ? err.message : String(err)}`);
    }
    try {
      if (cubeFiles.length > 0) await onCubeFilesDropped(cubeFiles);
    } catch (err) {
      summary.errors.push(`cube 파일 가져오기: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (profiles.length > 0) {
      if (onProfilesDropped) {
        try {
          await onProfilesDropped(profiles);
        } catch (err) {
          summary.errors.push(`profile 변환: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        summary.errors.push(
          `.streamDeckProfile ${profiles.length}개 — PC 앱 내장 변환기 v0.1.2 예정. scripts/import-streamdeck-profile.mjs 사용`,
        );
      }
    }

    // 결과 요약 alert
    const parts: string[] = [];
    if (summary.plugins > 0) parts.push(`StreamDeck plugin ${summary.plugins}개 변환 시작`);
    if (summary.profiles > 0) parts.push(`StreamDeck profile ${summary.profiles}개 (PC 앱 변환 미구현)`);
    if (summary.cubeones > 0) parts.push(`.cubeone ${summary.cubeones}개`);
    if (summary.cubelists > 0) parts.push(`.cubelist ${summary.cubelists}개`);
    if (summary.cubepacks > 0) parts.push(`.cubepack ${summary.cubepacks}개`);
    if (summary.unknown > 0) parts.push(`미지원 ${summary.unknown}개 (확장자 확인)`);
    const errLines = summary.errors.length > 0 ? `\n\n[경고]\n${summary.errors.join('\n')}` : '';
    if (parts.length > 0 || summary.errors.length > 0) {
      window.alert(`드래그드롭 처리 결과:\n${parts.join('\n')}${errLines}`);
    }
  }

  if (!isOver) return null;

  return (
    <div
      className="drop-zone-overlay"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDrop}
      role="region"
      aria-label="파일 드롭"
    >
      <div className="drop-zone-card">
        <div className="drop-zone-icon">📥</div>
        <div className="drop-zone-title">파일을 여기에 놓으세요</div>
        <div className="drop-zone-sub">
          .streamDeckPlugin · .streamDeckProfile · .cubeone · .cubelist · .cubepack
        </div>
      </div>
    </div>
  );
}
