/**
 * CubeIconUpload (수정 #3) — 인스펙터 최상단 큐브 아이콘 미리보기 + 업로드.
 *
 * - 정사각형 미리보기 (모서리 둥글게 8px)
 * - "불러오기" 버튼 + file input (image/* accept)
 * - FileReader.readAsDataURL → base64 data URL → cube.icon_url 저장
 * - 최적 사이즈 · 가능 형식 안내
 *
 * 주의: data URL 형태로 저장 → cube payload size 증가 가능. 큰 이미지는 사용자 책임.
 * v2+ 에서 .cubeone ZIP 안 icon.webp 로 자동 이전 검토.
 */

interface CubeIconUploadProps {
  iconUrl: string | null;
  label?: string;
  onChange: (next: string | null) => void;
}

const ACCEPTED_FORMATS = '.png,.jpg,.jpeg,.webp,.svg,.gif';
const ACCEPTED_HINT = 'PNG · JPEG · WEBP · SVG · GIF';
const RECOMMENDED_HINT = '권장 144 × 144 (정사각형). 최대 128 KB (base64 인라인 저장)';

// 코드리뷰 M5: base64 data URL 은 1.37× 팽창 → 1 MB 그대로면 .cubepack 직렬화 폭증.
// v1 베타 = 128 KB 제한 (작은 아이콘만). v2 = .cubeone ZIP 안 icon.webp 자동 이전 계획.
const MAX_BYTES = 128 * 1024; // 128 KB

export function CubeIconUpload({ iconUrl, label, onChange }: CubeIconUploadProps) {
  function handlePick(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_FORMATS;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        window.alert(
          `이미지가 너무 큽니다 (${(file.size / 1024).toFixed(0)} KB). 최대 128 KB 권장.\n` +
            `(.cubepack 내부 base64 인라인 저장이라 큰 이미지는 파일 비대.)`,
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.onerror = () => window.alert('이미지 로드 실패');
      reader.onabort = () => window.alert('이미지 로드 중단됨');
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function handleClear(): void {
    onChange(null);
  }

  return (
    <div className="cube-icon-upload">
      <div
        className="cube-icon-preview"
        style={iconUrl ? { backgroundImage: `url("${iconUrl}")` } : undefined}
        role="img"
        aria-label={label ? `${label} 아이콘` : '큐브 아이콘'}
      >
        {!iconUrl && <span className="cube-icon-placeholder">icon</span>}
      </div>
      <div className="cube-icon-actions">
        <button type="button" className="btn-ghost btn-sm" onClick={handlePick}>
          불러오기
        </button>
        {iconUrl && (
          <button type="button" className="btn-ghost btn-sm btn-danger" onClick={handleClear}>
            삭제
          </button>
        )}
        <div className="cube-icon-hint">
          <div>{ACCEPTED_HINT}</div>
          <div>{RECOMMENDED_HINT}</div>
        </div>
      </div>
    </div>
  );
}
