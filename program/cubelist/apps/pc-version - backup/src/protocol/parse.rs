//! 2단계 파싱 디스패처
//!
//! 1단계: serde_json::Value로 `event` 필드 확인
//! 2단계: typed enum으로 deserialize
//!
//! 알 수 없는 event는 조용히 무시하되 로그 (DoS 방어). 잘못된 JSON은 에러.

use serde::de::DeserializeOwned;
use thiserror::Error;

use super::messages::ClientEvent;

#[derive(Debug, Error)]
pub enum ProtocolError {
    #[error("malformed json: {0}")]
    MalformedJson(String),

    #[error("missing `event` field")]
    MissingEventField,

    #[error("unknown event: {0}")]
    UnknownEvent(String),

    #[error("payload mismatch for event `{event}`: {detail}")]
    PayloadMismatch { event: String, detail: String },
}

/// raw JSON → typed `ClientEvent`
pub fn dispatch(raw: &str) -> Result<ClientEvent, ProtocolError> {
    let value: serde_json::Value = serde_json::from_str(raw)
        .map_err(|e| ProtocolError::MalformedJson(e.to_string()))?;

    let event = value
        .get("event")
        .and_then(|v| v.as_str())
        .ok_or(ProtocolError::MissingEventField)?
        .to_string();

    // 알려진 event 목록 (DoS 방어용 1차 화이트리스트)
    const KNOWN_EVENTS: &[&str] = &[
        "hello",
        "subscribe_board",
        "press_item",
        "run_macro",
        "ping",
    ];
    if !KNOWN_EVENTS.contains(&event.as_str()) {
        return Err(ProtocolError::UnknownEvent(event));
    }

    typed_from_value::<ClientEvent>(&value, &event)
}

fn typed_from_value<T: DeserializeOwned>(
    value: &serde_json::Value,
    event_name: &str,
) -> Result<T, ProtocolError> {
    serde_json::from_value::<T>(value.clone()).map_err(|e| ProtocolError::PayloadMismatch {
        event: event_name.into(),
        detail: e.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dispatch_ping() {
        let raw = r#"{"event":"ping"}"#;
        let parsed = dispatch(raw).unwrap();
        matches!(parsed, ClientEvent::Ping);
    }

    #[test]
    fn dispatch_unknown_event_rejected() {
        let raw = r#"{"event":"drop_database","force":true}"#;
        let err = dispatch(raw).unwrap_err();
        matches!(err, ProtocolError::UnknownEvent(_));
    }

    #[test]
    fn dispatch_malformed_json() {
        let raw = "{not json";
        let err = dispatch(raw).unwrap_err();
        matches!(err, ProtocolError::MalformedJson(_));
    }

    #[test]
    fn dispatch_missing_event_field() {
        let raw = r#"{"foo":"bar"}"#;
        let err = dispatch(raw).unwrap_err();
        matches!(err, ProtocolError::MissingEventField);
    }
}
