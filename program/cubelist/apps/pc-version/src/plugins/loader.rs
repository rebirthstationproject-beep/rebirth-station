//! 플러그인 로더 (M4 cron #12)
//!
//! 책임:
//! - 설치 디렉토리 (`~/.cubelist/plugins/<package_id>/manifest.json`) 스캔
//! - `.cubeplugin` ZIP 파일 → 설치 디렉토리 추출 (install_zip)
//! - 각 플러그인 manifest 로드 + parse_manifest 검증
//!
//! 보안:
//! - parse_manifest 가 사전 검증 (action_type 10 화이트리스트 + package_id 정규식)
//! - install_zip 는 ZIP 경로 traversal 차단 (`..` 거부)
//! - Ed25519 서명 검증은 후속 (signature.rs 와 연동, cron #13+)

use std::fs;
use std::io::{self, Cursor, Read};
use std::path::{Path, PathBuf};

use super::manifest::{parse_manifest, ManifestError, PluginManifest};
use super::signature::{verify_signature, PublishedPublicKey, SignatureError};

#[derive(Debug, thiserror::Error)]
pub enum LoaderError {
    #[error("home directory not found")]
    HomeMissing,

    #[error("io: {0}")]
    Io(#[from] io::Error),

    #[error("zip: {0}")]
    Zip(#[from] zip::result::ZipError),

    #[error("manifest: {0}")]
    Manifest(#[from] ManifestError),

    #[error("manifest.json missing in zip")]
    ManifestMissing,

    #[error("path traversal blocked: {0}")]
    PathTraversal(String),

    #[error("invalid utf-8 in manifest")]
    Utf8,

    #[error("signature verification failed: {0}")]
    SignatureVerificationFailed(String),
}

/// 설치 루트 디렉토리. Windows = `%USERPROFILE%\.cubelist\plugins\`
pub fn installed_dir() -> Result<PathBuf, LoaderError> {
    let home = dirs::home_dir().ok_or(LoaderError::HomeMissing)?;
    Ok(home.join(".cubelist").join("plugins"))
}

/// 설치된 모든 플러그인 manifest 목록 (직속 디렉토리 한 단계 스캔).
/// 디렉토리 자체가 없으면 빈 Vec 반환 (에러 X).
pub fn list_installed() -> Result<Vec<PluginManifest>, LoaderError> {
    let root = installed_dir()?;
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut out = Vec::new();
    for entry in fs::read_dir(&root)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }
        let manifest_path = entry.path().join("manifest.json");
        if !manifest_path.exists() {
            continue;
        }
        match read_manifest_file(&manifest_path) {
            Ok(m) => out.push(m),
            Err(e) => {
                tracing::warn!(
                    path = ?manifest_path,
                    error = %e,
                    "플러그인 manifest 로드 실패 — 건너뜀"
                );
            }
        }
    }
    Ok(out)
}

fn read_manifest_file(path: &Path) -> Result<PluginManifest, LoaderError> {
    let text = fs::read_to_string(path)?;
    Ok(parse_manifest(&text)?)
}

/// `.cubeplugin` ZIP 바이트 → 설치 디렉토리 추출.
///
/// 흐름:
/// 1. ZIP 열기 → manifest.json 읽기 → parse_manifest (검증)
/// 2. manifest.sig 가 있으면 Ed25519 서명 검증 (실패 시 경고만, v1 — 강제 거부는 v2+)
/// 3. installed_dir / `<package_id>` 디렉토리 생성 (기존 있으면 그대로 사용)
/// 4. ZIP 내부 모든 파일 추출 (경로 traversal 차단)
/// 5. parsed manifest 반환
pub fn install_zip(bytes: &[u8]) -> Result<PluginManifest, LoaderError> {
    let cursor = Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;

    // 1단계: manifest 검증 먼저 (실패 시 디스크 변경 X)
    let manifest_text = read_manifest_text(&mut archive)?;
    let manifest = parse_manifest(&manifest_text)?;

    // 2단계: 서명 검증 (코드리뷰 C1: sig 있으면 무조건 통과 강제 — 우회 차단)
    //   - manifest.sig 가 ZIP 안 존재 → 반드시 verify_signature 통과
    //   - 공개키 placeholder 인 v1 베타 환경 → 검증 우회로 InvalidPublicKey 만 허용
    //     (실 PKI 구축 후 PublishedPublicKey::PLACEHOLDER 교체 시 모든 sig 강제)
    //   - 서명 형식 오류·검증 실패 → SignatureVerificationFailed 로 즉시 거부
    if let Ok(mut sig_entry) = archive.by_name("manifest.sig") {
        let mut sig_buf = String::new();
        let _ = sig_entry.read_to_string(&mut sig_buf);
        let sig = sig_buf.trim();
        match verify_signature(&manifest_text, sig, &PublishedPublicKey::PLACEHOLDER) {
            Ok(()) => tracing::info!(package_id = %manifest.package_id, "manifest 서명 검증 OK"),
            Err(SignatureError::InvalidPublicKey) => {
                // 빌드 시 공개키 미교체 (v1 베타) — placeholder 환경에서만 우회 허용.
                // 실 PKI 활성 후 본 분기는 자동 제거 (placeholder 가 아닌 키로 검증).
                tracing::warn!(
                    package_id = %manifest.package_id,
                    "manifest.sig 발견 + 공개키 placeholder → v1 베타 한정 검증 우회 (v2 = 강제 거부 예정)"
                );
            }
            Err(e) => {
                // 서명 형식 오류·검증 실패 — 즉시 설치 거부 (코드리뷰 C1)
                return Err(LoaderError::SignatureVerificationFailed(e.to_string()));
            }
        }
    } else {
        tracing::debug!("manifest.sig 없음 — 서명 검증 스킵 (서명 없는 플러그인은 허용)");
    }
    // archive borrow 해제 → 재오픈 (manifest 추출 후 두 번째 패스)
    drop(archive);

    // 3단계: 실 추출 (새 archive)
    let cursor = Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;
    let target = installed_dir()?.join(&manifest.package_id);
    fs::create_dir_all(&target)?;

    // 2단계: 파일 추출
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let name = file.name().to_string();

        // ZIP 경로 traversal 방어
        if name.contains("..") || name.starts_with('/') || name.starts_with('\\') {
            return Err(LoaderError::PathTraversal(name));
        }
        let out_path = target.join(&name);
        // 코드리뷰 H1: canonicalize 실패 시 검증 우회 → fail-closed 로 변경.
        // 1) target canonicalize 는 반드시 성공 (디렉토리 생성 직후)
        // 2) parent canonicalize 는 디렉토리가 아직 없으면 실패 가능 →
        //    그 경우 mkdir 후 재시도 + 그래도 실패 시 거부
        let canonical_target = target.canonicalize().map_err(|e| {
            LoaderError::PathTraversal(format!("target canonicalize 실패: {e}"))
        })?;
        let parent = out_path.parent().unwrap_or(&out_path);
        // 부모 디렉토리가 아직 없을 수 있음 → 생성 시도 (mkdir -p)
        if let Some(p) = out_path.parent() {
            let _ = fs::create_dir_all(p);
        }
        let canonical_parent = parent.canonicalize().map_err(|e| {
            LoaderError::PathTraversal(format!("parent canonicalize 실패 ({name}): {e}"))
        })?;
        if !canonical_parent.starts_with(&canonical_target) && canonical_parent != canonical_target {
            return Err(LoaderError::PathTraversal(name));
        }

        if file.is_dir() {
            fs::create_dir_all(&out_path)?;
            continue;
        }
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut out = fs::File::create(&out_path)?;
        io::copy(&mut file, &mut out)?;
    }

    Ok(manifest)
}

fn read_manifest_text(
    archive: &mut zip::ZipArchive<Cursor<&[u8]>>,
) -> Result<String, LoaderError> {
    let mut entry = archive
        .by_name("manifest.json")
        .map_err(|_| LoaderError::ManifestMissing)?;
    let mut buf = Vec::new();
    entry.read_to_end(&mut buf)?;
    let text = std::str::from_utf8(&buf).map_err(|_| LoaderError::Utf8)?;
    Ok(text.to_string())
}
