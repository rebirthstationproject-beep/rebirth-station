//! 링크 액션 — OS default browser로 URL 오픈
//!
//! 보안 (정착본 §6, §4)
//! - http(s) 스킴만 허용 — file://, javascript:, data: 차단
//! - 명령행 인젝션 방지: URL을 별도 인자로 전달 (셸 해석 X)

use super::ActionError;

/// URL을 OS default browser로 오픈.
pub fn open_default_browser(url: &str) -> Result<(), ActionError> {
    if !is_safe_scheme(url) {
        return Err(ActionError::UnsafeScheme(url.to_string()));
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: rundll32로 안전하게 위임 (cmd /C start는 셸 인터프리트 발생)
        // ShellExecuteW가 가장 안전하나 winapi 의존 → 1주차에는 rundll32 사용
        use std::process::Command;
        Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", url])
            .spawn()
            .map_err(|e| ActionError::OsCommand(e.to_string()))?;
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| ActionError::OsCommand(e.to_string()))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|e| ActionError::OsCommand(e.to_string()))?;
    }

    Ok(())
}

fn is_safe_scheme(url: &str) -> bool {
    let lower = url.to_ascii_lowercase();
    lower.starts_with("http://") || lower.starts_with("https://")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_http_and_https() {
        assert!(is_safe_scheme("http://example.com"));
        assert!(is_safe_scheme("https://example.com"));
        assert!(is_safe_scheme("HTTPS://EXAMPLE.COM"));
    }

    #[test]
    fn rejects_dangerous() {
        assert!(!is_safe_scheme("file:///c:/windows/system32"));
        assert!(!is_safe_scheme("javascript:alert(1)"));
        assert!(!is_safe_scheme("data:text/html,<script>"));
        assert!(!is_safe_scheme("ftp://example.com"));
        assert!(!is_safe_scheme(""));
    }
}
