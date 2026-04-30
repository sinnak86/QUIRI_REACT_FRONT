import { CurrentUser, MenuItem, User, UserPermissions } from '@/types/user';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

// ─── 로그인 실패 전용 에러 타입 ────────────────────────────────────────────────
export class LoginError extends Error {
  /** 현재까지 실패 횟수 (null이면 횟수 정보 없음) */
  failedAttempts: number | null;
  /** 최대 허용 횟수 */
  maxAttempts: number | null;
  /** 계정 잠금 여부 */
  isLocked: boolean;

  constructor(message: string, failedAttempts: number | null, maxAttempts: number | null, isLocked: boolean) {
    super(message);
    this.failedAttempts = failedAttempts;
    this.maxAttempts = maxAttempts;
    this.isLocked = isLocked;
  }
}

// ─── 인증 ─────────────────────────────────────────────────────────────────────

export async function login(loginId: string, password: string): Promise<CurrentUser> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const isLocked = err.code === 'ACCOUNT_LOCKED';
    throw new LoginError(
      err.message ?? '로그인에 실패했습니다.',
      err.failedAttempts ?? null,
      err.maxAttempts ?? null,
      isLocked
    );
  }
  return res.json();
}

export async function getAuthStatus(): Promise<{ hasUsers: boolean; userCount: number }> {
  const res = await fetch(`${BASE_URL}/auth/status`);
  if (!res.ok) throw new Error('서버 연결 실패');
  return res.json();
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? '비밀번호 변경에 실패했습니다.');
  }
}

// ─── 사용자 관리 ──────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error('사용자 목록 조회 실패');
  return res.json();
}

export async function createUser(data: {
  loginId: string;
  password: string;
  displayName: string;
}): Promise<User> {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? '사용자 생성 실패');
  }
  return res.json();
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? '사용자 삭제 실패');
  }
}

// ─── 권한 관리 ────────────────────────────────────────────────────────────────

export async function getUserPermissions(userId: number): Promise<UserPermissions> {
  const res = await fetch(`${BASE_URL}/users/${userId}/permissions`);
  if (!res.ok) throw new Error('권한 조회 실패');
  return res.json();
}

export async function updateUserPermissions(
  userId: number,
  permissions: { menuId: number; canAccess: boolean }[]
): Promise<UserPermissions> {
  const res = await fetch(`${BASE_URL}/users/${userId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? '권한 수정 실패');
  }
  return res.json();
}

export async function getAllMenus(): Promise<MenuItem[]> {
  const res = await fetch(`${BASE_URL}/users/menus`);
  if (!res.ok) throw new Error('메뉴 목록 조회 실패');
  return res.json();
}

export async function getAccessibleMenuCodes(userId: number): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/users/${userId}/accessible-menus`);
  if (!res.ok) throw new Error('접근 가능 메뉴 조회 실패');
  return res.json();
}

export async function unlockUser(userId: number): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${userId}/unlock`, { method: 'PUT' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? '잠금 해제에 실패했습니다.');
  }
  return res.json();
}
