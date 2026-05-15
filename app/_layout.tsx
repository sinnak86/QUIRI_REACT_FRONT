import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import {
  getCountryBlockEnabled,
  fetchCountryCode,
  checkAccessCodeExists,
  getSessionPassed,
} from '@/services/accessCodeApi';
import { AccessCodeScreen } from '@/components/AccessCodeScreen';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type GuardState = 'checking' | 'allowed' | 'country-blocked' | 'code-required';

const MONO = Platform.select({ web: "'Consolas', monospace", default: 'monospace' }) as string;

// ─── 국가 차단 화면 ────────────────────────────────────────────────────────────

function CountryBlockedScreen() {
  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0A0A',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    code: {
      fontFamily: MONO,
      fontSize: 64,
      fontWeight: '700',
      color: '#e53935',
      marginBottom: 16,
    },
    title: {
      fontFamily: MONO,
      fontSize: 18,
      fontWeight: '700',
      color: '#F0F0F0',
      marginBottom: 12,
    },
    desc: {
      fontFamily: MONO,
      fontSize: 13,
      color: '#A0A0A0',
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  return (
    <View style={s.container}>
      <Text style={s.code}>403</Text>
      <Text style={s.title}>접근이 차단되었습니다</Text>
      <Text style={s.desc}>
        {'한국에서만 접근 가능한 서비스입니다.\n(This service is only accessible from South Korea.)'}
      </Text>
    </View>
  );
}

// ─── AccessGuard ──────────────────────────────────────────────────────────────
// 검사 순서:
//   1. 국가 차단 ON + KR 아님 → country-blocked
//   2. 접근 코드 미설정 → 허용
//   3. sessionStorage 통과 기록 있음 → 허용
//   4. → code-required (접근 코드 입력 화면)

function AccessGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>('checking');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setState('allowed');
      return;
    }

    (async () => {
      try {
        // 1. 국가 차단 체크
        const countryBlockEnabled = await getCountryBlockEnabled();
        if (countryBlockEnabled) {
          const countryCode = await fetchCountryCode();
          // 감지 실패는 fail-open (허용)
          if (countryCode !== null && countryCode !== 'KR') {
            setState('country-blocked');
            return;
          }
        }

        // 2. 접근 코드 미설정 → 허용
        const codeExists = await checkAccessCodeExists();
        if (!codeExists) {
          setState('allowed');
          return;
        }

        // 3. 세션 통과 기록 확인
        if (getSessionPassed()) {
          setState('allowed');
          return;
        }

        // 4. 코드 입력 필요
        setState('code-required');
      } catch {
        // 오류 시 fail-open
        setState('allowed');
      }
    })();
  }, []);

  // Stack(children)은 항상 렌더링 → Expo Router 내비게이션 초기화 보장
  return (
    <>
      {children}
      {state !== 'allowed' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0A', zIndex: 9999 }]}>
          {state === 'country-blocked' && <CountryBlockedScreen />}
          {state === 'code-required' && (
            <AccessCodeScreen onPassed={() => setState('allowed')} />
          )}
        </View>
      )}
    </>
  );
}

// ─── 루트 레이아웃 ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <AccessGuard>
            <Stack screenOptions={{ headerShown: false }} />
          </AccessGuard>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
