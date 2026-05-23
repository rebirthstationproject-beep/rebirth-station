/**
 * 헬퍼 자격증명 저장소 — IndexedDB (XSS 안전)
 *
 * localStorage 절대 금지 (스크립트로 직접 노출).
 * IndexedDB + 비추출 키 패턴.
 *
 * 페어링 성공 시:
 *   1. Edge Function 응답에서 secret(64바이트 hex) 수신
 *   2. crypto.subtle.importKey({extractable: false}) 로 변환
 *   3. IndexedDB에 deviceId + raw secret(byte array) 저장
 *      ※ 1주차 골격: raw 저장. 추후 SubtleCrypto 비추출 키만 저장하도록 강화.
 */

const DB_NAME = 'cubelist-credentials';
const STORE_NAME = 'helper';
const RECORD_ID = 'main';

export interface HelperCredentials {
  deviceId: string;
  secret: ArrayBuffer;
}

export async function saveHelperCredentials(creds: HelperCredentials): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({
      id: RECORD_ID,
      deviceId: creds.deviceId,
      secret: new Uint8Array(creds.secret),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadHelperCredentials(): Promise<HelperCredentials | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(RECORD_ID);
    req.onsuccess = () => {
      const rec = req.result as { deviceId: string; secret: Uint8Array } | undefined;
      if (!rec) {
        resolve(null);
        return;
      }
      const buf = rec.secret.buffer.slice(
        rec.secret.byteOffset,
        rec.secret.byteOffset + rec.secret.byteLength,
      );
      resolve({ deviceId: rec.deviceId, secret: buf as ArrayBuffer });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearHelperCredentials(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(RECORD_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
