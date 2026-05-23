//! Manifest 정적 분석 — 위험 키워드/URL 패턴 탐지
//!
//! 정착본: tech-review.md §6 — "exec/shell/eval/fs.write 키워드 발견 시 import 거부"
//!
//! 본 스캔은 manifest 전체 JSON 문자열에 대해 수행. payload 내부에 의도된 위험
//! 패턴이 숨겨져 있는 경우 잡아냄.

use super::manifest::PluginManifest;

/// 위험 키워드 (대소문자 무시)
const DANGEROUS_KEYWORDS: &[&str] = &[
    "exec",
    "shell",
    "eval",
    "system",
    "spawn",
    "cmd.exe",
    "powershell",
    "/bin/sh",
    "rm -rf",
    "registry",
    "regedit",
    "fs.write",
    "writefile",
    "writebinaryfile",
];

/// 외부 도메인 화이트리스트. 이 외 도메인은 정적 분석 경고.
const TRUSTED_DOMAINS: &[&str] = &[
    "주소모아.com",
    "xn--v52b19jw9czye.com",
    "rebirthstation.com",
    "supabase.co",
    "github.com",
    "naver.com",
    "daum.net",
    "kakao.com",
    "google.com",
    "youtube.com",
];

#[derive(Debug, Clone)]
pub enum StaticScanFinding {
    DangerousKeyword {
        keyword: String,
        location: String,
    },
    ExternalDomain {
        domain: String,
        url: String,
    },
    HttpScheme {
        url: String,
    },
}

/// manifest 정적 분석 — 발견된 모든 risk 반환
pub fn scan_manifest(manifest: &PluginManifest) -> Vec<StaticScanFinding> {
    let mut findings = Vec::new();
    let json = match serde_json::to_string(manifest) {
        Ok(s) => s,
        Err(_) => return findings,
    };
    let lower = json.to_ascii_lowercase();

    for kw in DANGEROUS_KEYWORDS {
        if lower.contains(kw) {
            findings.push(StaticScanFinding::DangerousKeyword {
                keyword: kw.to_string(),
                location: "manifest".into(),
            });
        }
    }

    // URL 패턴 스캔 (간단: http/https로 시작하는 토큰 추출)
    for url in extract_urls(&json) {
        let lower = url.to_ascii_lowercase();
        if lower.starts_with("http://") {
            findings.push(StaticScanFinding::HttpScheme { url: url.clone() });
        }
        if let Some(domain) = extract_domain(&url) {
            if !TRUSTED_DOMAINS.iter().any(|t| domain.ends_with(t)) {
                findings.push(StaticScanFinding::ExternalDomain {
                    domain: domain.to_string(),
                    url,
                });
            }
        }
    }

    findings
}

fn extract_urls(text: &str) -> Vec<String> {
    let mut urls = Vec::new();
    let mut i = 0;
    let bytes = text.as_bytes();
    while i < bytes.len() {
        // http:// 또는 https://
        if &bytes[i..(i + 7).min(bytes.len())] == b"http://"
            || &bytes[i..(i + 8).min(bytes.len())] == b"https://"
        {
            let end = (i..bytes.len())
                .find(|&j| matches!(bytes[j], b'"' | b' ' | b'\\' | b'<' | b'>' | b')'))
                .unwrap_or(bytes.len());
            urls.push(text[i..end].to_string());
            i = end;
        } else {
            i += 1;
        }
    }
    urls
}

fn extract_domain(url: &str) -> Option<&str> {
    let after_scheme = url.split("://").nth(1)?;
    let domain = after_scheme.split(['/', '?', '#']).next()?;
    let host_only = domain.split(':').next()?;
    Some(host_only)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plugins::manifest::parse_manifest;

    #[test]
    fn detects_dangerous_keyword() {
        let json = r#"{
            "package_id": "kr.x.y",
            "name": "x",
            "version": "1.0.0",
            "actions": [{
                "id": "a", "label": "a", "action_type": "link",
                "default_payload": {"url": "https://example.com/eval"}
            }],
            "requested_permissions": []
        }"#;
        let m = parse_manifest(json).unwrap();
        let findings = scan_manifest(&m);
        assert!(findings.iter().any(|f| matches!(f, StaticScanFinding::DangerousKeyword { .. })));
    }

    #[test]
    fn detects_http_scheme() {
        let json = r#"{
            "package_id": "kr.x.y",
            "name": "x",
            "version": "1.0.0",
            "actions": [{
                "id": "a", "label": "a", "action_type": "link",
                "default_payload": {"url": "http://example.com"}
            }],
            "requested_permissions": []
        }"#;
        let m = parse_manifest(json).unwrap();
        let findings = scan_manifest(&m);
        assert!(findings.iter().any(|f| matches!(f, StaticScanFinding::HttpScheme { .. })));
    }

    #[test]
    fn trusts_known_domain() {
        let json = r#"{
            "package_id": "kr.x.y",
            "name": "x",
            "version": "1.0.0",
            "actions": [{
                "id": "a", "label": "a", "action_type": "link",
                "default_payload": {"url": "https://주소모아.com/list"}
            }],
            "requested_permissions": []
        }"#;
        let m = parse_manifest(json).unwrap();
        let findings = scan_manifest(&m);
        assert!(!findings.iter().any(|f| matches!(f, StaticScanFinding::ExternalDomain { .. })));
    }
}
