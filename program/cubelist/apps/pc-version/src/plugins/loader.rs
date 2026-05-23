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
/// 2. installed_dir / `<package_id>` 디렉토리 생성 (기존 있으면 그대로 사용)
/// 3. ZIP 내부 모든 파일 추출 (경로 traversal 차단)
/// 4. parsed manifest 반환
pub fn install_zip(bytes: &[u8]) -> Result<PluginManifest, LoaderError> {
    let cursor = Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;

    // 1단계: manifest 검증 먼저 (실패 시 디스크 변경 X)
    let manifest = read_manifest_from_archive(&mut archive)?;
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

fn read_manifest_from_archive(
    archive: &mut zip::ZipArchive<Cursor<&[u8]>>,
) -> Result<PluginManifest, LoaderError> {
    let mut entry = archive
        .by_name("manifest.json")
        .map_err(|_| LoaderError::ManifestMissing)?;
    let mut buf = Vec::new();
    entry.read_to_end(&mut buf)?;
    let text = std::str::from_utf8(&buf).map_err(|_| LoaderError::Utf8)?;
    Ok(parse_manifest(text)?)
}
