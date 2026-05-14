import { Storage, STORAGE_KEYS, SESSION_KEYS } from '@/utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';
const CODE_LENGTH = 6;

// ─── 접근 코드 (백엔드 DB 저장) ─────────────────────────────────────────────────
// localStorage는 브라우저-오리진 단위라 외부 기기에서는 비어있음.
// 모든 기기가 공유해야 하므로 백엔드에 BCrypt 해시로 저장.

/**
 * 접근 코드가 백엔드에 설정되어 있는지 확인합니다.
 * @returns true = 설정됨 | false = 미설정 | null = 백엔드 연결 불가
 */
export async function checkAccessCodeExists(): Promise<boolean | null> {
  try {
    const res = await fetch(`${BASE_URL}/settings/access-code/exists`);
    if (!res.ok) return null; // 서버 오류
    const data = await res.json();
    return data.exists === true;
  } catch {
    return null; // 네트워크 오류
  }
}

/** 새 접근 코드를 백엔드에 저장합니다. */
export async function saveAccessCode(code: string): Promise<void> {
  if (code.length !== CODE_LENGTH || !/^\d{6}$/.test(code)) {
    throw new Error(`접근 코드는 숫자 ${CODE_LENGTH}자리여야 합니다.`);
  }
  const res = await fetch(`${BASE_URL}/settings/access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('접근 코드 저장에 실패했습니다.');
}

/** 접근 코드를 백엔드에서 삭제합니다. */
export async function clearAccessCode(): Promise<void> {
  const res = await fetch(`${BASE_URL}/settings/access-code`, { method: 'DELETE' });
  if (!res.ok) throw new Error('접근 코드 초기화에 실패했습니다.');
}

/** 입력한 코드가 백엔드에 저장된 코드와 일치하는지 검증합니다. */
export async function verifyAccessCode(input: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/settings/access-code/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: input }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

// ─── 세션 통과 기록 (sessionStorage) ─────────────────────────────────────────
// 탭을 닫으면 초기화, 새로고침은 유지

/** 이번 세션에서 접근 코드를 통과했는지 확인합니다. */
export function getSessionPassed(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEYS.ACCESS_CODE_PASSED) === 'true';
}

/** 이번 세션에서 접근 코드를 통과했음을 기록합니다. */
export function setSessionPassed(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEYS.ACCESS_CODE_PASSED, 'true');
}

// ─── 국가 차단 설정 (localStorage 유지 — 관리자 기기 전용 설정) ──────────────────

/** 대한민국 외 접근 차단 ON/OFF (기본값: true) */
export async function getCountryBlockEnabled(): Promise<boolean> {
  const raw = await Storage.get(STORAGE_KEYS.COUNTRY_BLOCK_ENABLED);
  if (raw === null) return true;
  return raw === 'true';
}

export async function setCountryBlockEnabled(enabled: boolean): Promise<void> {
  await Storage.set(STORAGE_KEYS.COUNTRY_BLOCK_ENABLED, String(enabled));
}

// ─── GeoIP (ipapi.co) ────────────────────────────────────────────────────────

interface GeoIpResponse {
  ip: string;
  country_code: string;
  error?: boolean;
}

/** 현재 접속 IP의 국가코드를 조회합니다. 실패 시 null 반환 (fail-open). */
export async function fetchCountryCode(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timer);
    const data: GeoIpResponse = await res.json();
    if (data.error) return null;
    return data.country_code ?? null;
  } catch {
    return null;
  }
}
