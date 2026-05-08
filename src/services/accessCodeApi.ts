import { Storage, STORAGE_KEYS, SESSION_KEYS } from '@/utils/storage';

const CODE_LENGTH = 6;

// ─── 접근 코드 저장 / 조회 ──────────────────────────────────────────────────────

/** 설정된 접근 코드를 반환합니다. 미설정이면 null. */
export async function getAccessCode(): Promise<string | null> {
  return Storage.get(STORAGE_KEYS.ACCESS_CODE);
}

/** 새 접근 코드를 저장합니다. */
export async function saveAccessCode(code: string): Promise<void> {
  if (code.length !== CODE_LENGTH || !/^\d{6}$/.test(code)) {
    throw new Error(`접근 코드는 숫자 ${CODE_LENGTH}자리여야 합니다.`);
  }
  await Storage.set(STORAGE_KEYS.ACCESS_CODE, code);
}

/** 접근 코드를 초기화(삭제)합니다. */
export async function clearAccessCode(): Promise<void> {
  await Storage.remove(STORAGE_KEYS.ACCESS_CODE);
}

/** 입력한 코드가 저장된 코드와 일치하는지 검증합니다. */
export async function verifyAccessCode(input: string): Promise<boolean> {
  const stored = await getAccessCode();
  if (!stored) return true; // 미설정이면 항상 통과
  return input === stored;
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

// ─── 국가 차단 설정 ────────────────────────────────────────────────────────────

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
