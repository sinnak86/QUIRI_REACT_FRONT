import { IpEntry } from '@/types/ip';
import { Storage, STORAGE_KEYS } from '@/utils/storage';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function getIpList(): Promise<IpEntry[]> {
  const raw = await Storage.get(STORAGE_KEYS.IP_LIST);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as IpEntry[];
  } catch {
    return [];
  }
}

async function saveIpList(list: IpEntry[]): Promise<void> {
  await Storage.set(STORAGE_KEYS.IP_LIST, JSON.stringify(list));
}

export async function addIpEntry(data: {
  name: string;
  ip: string;
  note: string;
}): Promise<IpEntry> {
  const list = await getIpList();
  const entry: IpEntry = {
    id: generateId(),
    name: data.name.trim(),
    ip: data.ip.trim(),
    note: data.note.trim(),
    createdAt: new Date().toISOString(),
  };
  await saveIpList([...list, entry]);
  return entry;
}

export async function updateIpEntry(
  id: string,
  data: { name: string; ip: string; note: string }
): Promise<IpEntry> {
  const list = await getIpList();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('항목을 찾을 수 없습니다.');
  const updated: IpEntry = {
    ...list[idx],
    name: data.name.trim(),
    ip: data.ip.trim(),
    note: data.note.trim(),
  };
  list[idx] = updated;
  await saveIpList(list);
  return updated;
}

export async function deleteIpEntry(id: string): Promise<void> {
  const list = await getIpList();
  await saveIpList(list.filter((e) => e.id !== id));
}

// ─── 국가 차단 설정 ────────────────────────────────────────────────────────────

/** 대한민국 외 접근 차단 ON/OFF (기본값: true) */
export async function getCountryBlockEnabled(): Promise<boolean> {
  const raw = await Storage.get(STORAGE_KEYS.COUNTRY_BLOCK_ENABLED);
  if (raw === null) return true; // 기본값: 활성화
  return raw === 'true';
}

export async function setCountryBlockEnabled(enabled: boolean): Promise<void> {
  await Storage.set(STORAGE_KEYS.COUNTRY_BLOCK_ENABLED, String(enabled));
}

// ─── 미들웨어 유틸 ────────────────────────────────────────────────────────────

const ALWAYS_ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1'];

function isLocalhost(hostname: string): boolean {
  return ALWAYS_ALLOWED_HOSTS.includes(hostname) || hostname.startsWith('127.');
}

function ipMatchesEntry(clientIp: string, entry: IpEntry): boolean {
  const pattern = entry.ip.trim();

  // CIDR 범위 (예: 192.168.1.0/24)
  if (pattern.includes('/')) {
    return ipInCidr(clientIp, pattern);
  }
  // 와일드카드 (예: 192.168.1.*)
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[0-9]{1,3}') + '$'
    );
    return regex.test(clientIp);
  }
  return clientIp === pattern;
}

function ipInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const toNum = (addr: string) =>
      addr
        .split('.')
        .reduce((acc, oct) => ((acc << 8) >>> 0) + parseInt(oct, 10), 0) >>> 0;
    return (toNum(ip) & mask) === (toNum(range) & mask);
  } catch {
    return false;
  }
}

/** ipapi.co 응답 타입 */
interface GeoIpResponse {
  ip: string;
  country_code: string;
  error?: boolean;
  reason?: string;
}

/**
 * GeoIP 정보를 조회합니다 (ipapi.co 무료 API 사용).
 * 실패 시 null 반환 → 호출부에서 fail-open 처리.
 */
async function fetchGeoIp(): Promise<GeoIpResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data: GeoIpResponse = await res.json();
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export type AccessDeniedReason = 'country-blocked' | 'ip-blocked';
export type AccessAllowedReason =
  | 'localhost'
  | 'no-restrictions'
  | 'detection-failed'
  | 'non-web'
  | 'allowed';

export type CheckIpAccessResult = {
  allowed: boolean;
  clientIp: string | null;
  countryCode: string | null;
  reason: AccessDeniedReason | AccessAllowedReason;
};

/**
 * 현재 접속자의 국가 및 IP를 검사합니다.
 *
 * 검사 순서:
 *   1. localhost / 127.x → 항상 허용 (API 호출 없음)
 *   2. 국가 차단 & IP 목록 둘 다 비활성 → 허용 (API 호출 없음)
 *   3. GeoIP 조회 (ipapi.co) → ip + country_code 획득
 *      - 실패 시 fail-open (허용)
 *   4. 국가 차단 ON & 국가코드 ≠ 'KR' → 차단 (country-blocked)
 *   5. IP 목록 있음 & 목록에 없는 IP → 차단 (ip-blocked)
 *   6. 허용
 */
export async function checkIpAccess(): Promise<CheckIpAccessResult> {
  if (typeof window === 'undefined') {
    return { allowed: true, clientIp: null, countryCode: null, reason: 'non-web' };
  }

  const hostname = window.location.hostname;

  // 1. localhost 항상 허용
  if (isLocalhost(hostname)) {
    return { allowed: true, clientIp: hostname, countryCode: null, reason: 'localhost' };
  }

  // 2. 설정값 로드
  const [countryBlockEnabled, ipList] = await Promise.all([
    getCountryBlockEnabled(),
    getIpList(),
  ]);

  // 제한이 전혀 없으면 API 호출 없이 바로 허용
  if (!countryBlockEnabled && ipList.length === 0) {
    return { allowed: true, clientIp: null, countryCode: null, reason: 'no-restrictions' };
  }

  // 3. GeoIP 조회
  const geo = await fetchGeoIp();
  if (!geo) {
    // 감지 실패 → fail-open
    return { allowed: true, clientIp: null, countryCode: null, reason: 'detection-failed' };
  }

  const { ip: clientIp, country_code: countryCode } = geo;

  // 4. 국가 체크 (IP 체크보다 먼저)
  if (countryBlockEnabled && countryCode !== 'KR') {
    return { allowed: false, clientIp, countryCode, reason: 'country-blocked' };
  }

  // 5. IP 목록 체크
  if (ipList.length > 0) {
    const ipAllowed = ipList.some((entry) => ipMatchesEntry(clientIp, entry));
    if (!ipAllowed) {
      return { allowed: false, clientIp, countryCode, reason: 'ip-blocked' };
    }
  }

  return { allowed: true, clientIp, countryCode, reason: 'allowed' };
}
