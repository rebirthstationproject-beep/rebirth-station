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

    // 2단계: 서명 hook (선택) — manifest.sig 가 있으면 검증 시도
    if let Ok(mut sig_entry) = archive.by_name("manifest.sig") {
        let mut sig_buf = String::new();
        let _ = sig_entry.read_to_string(&mut sig_buf);
        let sig = sig_buf.trim();
        match verify_signature(&manifest_text, sig, &PublishedPublicKey::PLACEHOLDER) {
            Ok(()) => tracing::info!(package_id = %manifest.package_id, "manifest 서명 검증 OK"),
            Err(SignatureError::InvalidPublicKey) => {
                // 빌드 시 공개키 미교체 — 정상 (v1, 검증 본격 활성은 v2+)
                tracing::debug!("manifest.sig 발견했으나 공개키 placeholder — 검증 스킵 (v1)");
            }
            Err(e) => {
                // 서명 형식 오류·검증 실패 — v1 경고만 (v2+ 거부)
                tracing::warn!(
                    package_id = %manifest.package_id,
                    error = %e,
                    "manifest 서명 검증 실패 (v1 = 경고만, v2+ = 거부 예정)"
                );
            }
        }
    } else {
        tracing::debug!("manifest.sig 없음 — 서명 검증 스킵");
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
        // 정규화 후 target 외부로 탈출했는지 재확인
        if let Ok(canonical_target) = target.canonicalize() {
            let parent = out_path.parent().unwrap_or(&out_path);
            if let Ok(canonical_parent) = parent.canonicalize() {
                if !canonical_parent.starts_with(&canonical_target)
                    && canonical_parent != canonical_target
                {
                    return Err(LoaderError::PathTraversal(name));
                }
            }
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
