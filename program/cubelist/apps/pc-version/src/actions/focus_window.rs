//! 창 포커스 액션 (M3 cron #10) — Tier 2, Windows-only
//!
//! `EnumWindows` 로 모든 최상위 창을 순회하며 제목이 패턴과 일치하는 첫 창을
//! `SetForegroundWindow` 로 전경 활성화.
//!
//! 패턴 문법 (M3 단순화): `*` 를 둘러싼 부분을 contains 매칭.
//!   - `"VS Code"`     → 제목에 "VS Code" 포함
//!   - `"* — VS Code"` → "— VS Code" 포함 (앞 `*` 무시)
//!   - `"*VS Code*"`   → "VS Code" 포함
//! 정밀 와일드카드(`*` 위치 정확 매칭)는 후속.
//!
//! macOS/Linux 빌드는 `FeatureDisabled` 반환 (Phase 2 cocoa/x11 별도 모듈).

use super::ActionError;

#[cfg(target_os = "windows")]
pub fn focus(title_pattern: &str) -> Result<(), ActionError> {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows_sys::Win32::Foundation::{BOOL, FALSE, HWND, LPARAM, TRUE};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible, SetForegroundWindow,
    };

    struct State<'a> {
        pattern: &'a str,
        found: Option<HWND>,
    }

    extern "system" fn cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        // SAFETY: lparam 은 본 호출 직전 EnumWindows 에 넘긴 State 의 raw pointer.
        // 콜백 호출 동안 State 가 살아있음 (스택 frame 유지).
        let state = unsafe { &mut *(lparam as *mut State) };
        unsafe {
            if IsWindowVisible(hwnd) == 0 {
                return TRUE;
            }
        }
        let len = unsafe { GetWindowTextLengthW(hwnd) };
        if len <= 0 {
            return TRUE;
        }
        let mut buf: Vec<u16> = vec![0; (len + 1) as usize];
        let copied = unsafe { GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32) };
        if copied <= 0 {
            return TRUE;
        }
        let title = OsString::from_wide(&buf[..copied as usize])
            .to_string_lossy()
            .into_owned();
        if matches_pattern(&title, state.pattern) {
            state.found = Some(hwnd);
            return FALSE; // 순회 중단
        }
        TRUE
    }

    let mut state = State {
        pattern: title_pattern,
        found: None,
    };
    unsafe {
        EnumWindows(Some(cb), &mut state as *mut _ as LPARAM);
    }

    match state.found {
        Some(hwnd) => {
            let ok = unsafe { SetForegroundWindow(hwnd) };
            if ok == 0 {
                Err(ActionError::OsCommand(
                    "SetForegroundWindow 실패 (포커스 도용 방지 정책일 수 있음)".into(),
                ))
            } else {
                Ok(())
            }
        }
        None => Err(ActionError::OsCommand(format!(
            "패턴 일치 창 없음: {title_pattern}"
        ))),
    }
}

#[cfg(not(target_os = "windows"))]
pub fn focus(_title_pattern: &str) -> Result<(), ActionError> {
    Err(ActionError::FeatureDisabled("focus_window: Windows-only"))
}

/// M3 단순화 매칭 — 대소문자 무시 + `*` 제거 후 contains.
fn matches_pattern(haystack: &str, pattern: &str) -> bool {
    let clean = pattern.trim_matches('*').trim();
    if clean.is_empty() {
        return false;
    }
    haystack.to_lowercase().contains(&clean.to_lowercase())
}

#[cfg(test)]
mod tests {
    use super::matches_pattern;

    #[test]
    fn contains_exact() {
        assert!(matches_pattern("Visual Studio Code", "Visual"));
    }

    #[test]
    fn ignores_wildcards() {
        assert!(matches_pattern("foo - VS Code", "*VS Code*"));
        assert!(matches_pattern("foo - VS Code", "*VS Code"));
    }

    #[test]
    fn case_insensitive() {
        assert!(matches_pattern("Visual Studio Code", "visual studio"));
    }

    #[test]
    fn empty_or_only_stars_rejected() {
        assert!(!matches_pattern("any", ""));
        assert!(!matches_pattern("any", "*"));
        assert!(!matches_pattern("any", "**"));
    }
}
