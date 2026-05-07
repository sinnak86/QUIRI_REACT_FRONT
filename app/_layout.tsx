import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { checkIpAccess, AccessDeniedReason } from '@/services/ipApi';

// ── IP 차단 미들웨어 ───────────────────────────────────────────────────────────
// localhost / 127.0.0.1 은 항상 허용.
// 허용 IP 목록이 등록되어 있고 현재 접속 IP가 목록에 없으면 403 화면 표시.
// IP 감지 실패 시 fail-open (접속 허용).

type IpGuardState = 'checking' | 'allowed' | 'blocked';

const MONO = Platform.select({ web: "'Consolas', monospace", default: 'monospace' }) as string;

const BLOCKED_MESSAGES: Record<AccessDeniedReason, { title: string; desc: string }> = {
  'country-blocked': {
    title: '접근이 차단되었습니다',
    desc: '한국에서만 접근 가능한 서비스입니다.\n(This service is only accessible from South Korea.)',
  },
  'ip-blocked': {
    title: '접근이 차단되었습니다',
    desc: '현재 IP 주소는 허용 목록에 등록되어 있지 않습니다.\n관리자에게 접근 권한을 요청해주세요.',
  },
};

function BlockedScreen({
  clientIp,
  countryCode,
  reason,
}: {
  clientIp: string | null;
  countryCode: string | null;
  reason: AccessDeniedReason;
}) {
  const { title, desc } = BLOCKED_MESSAGES[reason];

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
    meta: {
      fontFamily: MONO,
      fontSize: 12,
      color: '#555',
      marginTop: 6,
    },
  });

  return (
    <View style={s.container}>
      <Text style={s.code}>403</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.desc}>{desc}</Text>
      {clientIp && <Text style={s.meta}>IP: {clientIp}</Text>}
      {countryCode && <Text style={s.meta}>Country: {countryCode}</Text>}
    </View>
  );
}

function IpGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IpGuardState>('checking');
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [deniedReason, setDeniedReason] = useState<AccessDeniedReason>('ip-blocked');

  useEffect(() => {
    // 웹 환경에서만 IP/국가 검사 수행
    if (Platform.OS !== 'web') {
      setState('allowed');
      return;
    }
    checkIpAccess()
      .then(({ allowed, clientIp: ip, countryCode: cc, reason }) => {
        setClientIp(ip);
        setCountryCode(cc);
        if (!allowed) {
          setDeniedReason(reason as AccessDeniedReason);
        }
        setState(allowed ? 'allowed' : 'blocked');
      })
      .catch(() => {
        // 오류 발생 시 fail-open
        setState('allowed');
      });
  }, []);

  // Stack(children)은 항상 렌더링 → Expo Router 내비게이션 초기화 보장
  // checking/blocked 상태에서는 절대위치 오버레이로 화면을 덮음
  return (
    <>
      {children}
      {state !== 'allowed' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0A', zIndex: 9999 }]}>
          {state === 'blocked' && (
            <BlockedScreen
              clientIp={clientIp}
              countryCode={countryCode}
              reason={deniedReason}
            />
          )}
        </View>
      )}
    </>
  );
}

// ── 루트 레이아웃 ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <IpGuard>
            <Stack screenOptions={{ headerShown: false }} />
          </IpGuard>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
