/**
 * 플랫폼 범용 스토리지 유틸리티
 * - Web: localStorage 사용
 * - Native: AsyncStorage 사용 (설치 시 활성화)
 *
 * 모든 키는 'quiri_' 접두사로 네임스페이스 분리
 */
import { Platform } from 'react-native';

const PREFIX = 'quiri_';

function prefixed(key: string) {
  return PREFIX + key;
}

export const Storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(prefixed(key));
      }
      // Native: @react-native-async-storage/async-storage 설치 후 활성화
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // return await AsyncStorage.getItem(prefixed(key));
      return null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(prefixed(key), value);
        return;
      }
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.setItem(prefixed(key), value);
    } catch {
      // 저장 실패는 무시 (기능 저하 허용)
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(prefixed(key));
        return;
      }
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.removeItem(prefixed(key));
    } catch {
      // 무시
    }
  },
};

// ─── 스토리지 키 상수 ─────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  SAVED_ID: 'saved_id',
  AUTO_LOGIN_USER: 'auto_login_user',
  ACCESS_CODE: 'access_code',
  COUNTRY_BLOCK_ENABLED: 'country_block_enabled',
} as const;

// ─── 세션 스토리지 (탭 닫으면 초기화, 새로고침은 유지) ──────────────────────────
export const SESSION_KEYS = {
  ACCESS_CODE_PASSED: 'quiri_access_code_passed',
} as const;
