//! Nonce 재사용 방지 캐시 (LRU 100개)
//!
//! 정착본: tech-review.md §6 — replay attack 방어
//! 동시성: 단일 WS 서버 인스턴스에 RwLock으로 감싸 사용.

use std::collections::VecDeque;
use std::collections::HashSet;

use super::NONCE_CACHE_CAPACITY;

#[derive(Debug)]
pub struct NonceCache {
    set: HashSet<String>,
    order: VecDeque<String>,
    capacity: usize,
}

impl Default for NonceCache {
    fn default() -> Self {
        Self::with_capacity(NONCE_CACHE_CAPACITY)
    }
}

impl NonceCache {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            set: HashSet::with_capacity(capacity),
            order: VecDeque::with_capacity(capacity),
            capacity,
        }
    }

    /// true면 새 nonce (받아들임), false면 재사용 (거부).
    pub fn insert_if_new(&mut self, nonce: &str) -> bool {
        if self.set.contains(nonce) {
            return false;
        }

        if self.order.len() >= self.capacity {
            if let Some(oldest) = self.order.pop_front() {
                self.set.remove(&oldest);
            }
        }

        self.order.push_back(nonce.to_string());
        self.set.insert(nonce.to_string());
        true
    }

    pub fn len(&self) -> usize {
        self.set.len()
    }

    pub fn is_empty(&self) -> bool {
        self.set.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_new_nonce() {
        let mut cache = NonceCache::with_capacity(3);
        assert!(cache.insert_if_new("a"));
        assert!(cache.insert_if_new("b"));
    }

    #[test]
    fn rejects_reused_nonce() {
        let mut cache = NonceCache::with_capacity(3);
        cache.insert_if_new("a");
        assert!(!cache.insert_if_new("a"));
    }

    #[test]
    fn evicts_oldest_when_full() {
        let mut cache = NonceCache::with_capacity(2);
        cache.insert_if_new("a");
        cache.insert_if_new("b");
        cache.insert_if_new("c"); // evicts "a"
        assert_eq!(cache.len(), 2);
        // "a"는 이제 캐시에 없으므로 다시 받아들여진다
        assert!(cache.insert_if_new("a"));
    }
}
