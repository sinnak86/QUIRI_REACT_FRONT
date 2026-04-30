import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRootNavigationState } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { login, getAuthStatus, LoginError } from '@/services/userApi';
import { Storage, STORAGE_KEYS } from '@/utils/storage';
import appConfig from '../constants/appConfig';

function Checkbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    box: {
      width: 16,
      height: 16,
      borderWidth: 1,
      borderColor: value ? theme.colors.checkboxActive : theme.colors.checkboxBorder,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: value ? theme.colors.checkboxActive : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    checkmark: { color: theme.colors.buttonText, fontSize: 10, lineHeight: 14 },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
  });
  return (
    <TouchableOpacity style={styles.row} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={styles.box}>{value && <Text style={styles.checkmark}>✓</Text>}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const { currentUser, setCurrentUser } = useUser();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true); // 스토리지 복원 완료 전 로딩
  const rootNavState = useRootNavigationState();

  // ─── 1. 앱 시작 시: 저장된 ID·자동로그인 복원 ───────────────────────────────
  useEffect(() => {
    const restoreFromStorage = async () => {
      const [savedId, autoLoginRaw] = await Promise.all([
        Storage.get(STORAGE_KEYS.SAVED_ID),
        Storage.get(STORAGE_KEYS.AUTO_LOGIN_USER),
      ]);

      // ID 저장 복원
      if (savedId) {
        setId(savedId);
        setSaveId(true);
      }

      // 자동 로그인 복원
      if (autoLoginRaw) {
        try {
          const user = JSON.parse(autoLoginRaw);
          setCurrentUser(user); // → useEffect[currentUser] 가 /main 으로 redirect
          setAutoLogin(true);
        } catch {
          // 손상된 데이터 제거
          await Storage.remove(STORAGE_KEYS.AUTO_LOGIN_USER);
        }
      }

      setInitializing(false);
    };

    restoreFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 2. currentUser 변경 시 → /main 이동 (Root Layout 마운트 후) ────────────
  useEffect(() => {
    if (!rootNavState?.key) return;
    if (currentUser) {
      router.replace('/main');
    }
  }, [currentUser, rootNavState?.key]);

  // ─── 3. 최초 사용자 여부 확인 ───────────────────────────────────────────────
  useEffect(() => {
    getAuthStatus()
      .then((s) => setIsFirstUser(!s.hasUsers))
      .catch(() => setIsFirstUser(null));
  }, []);

  // ─── 4. 로그인 처리 ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!id.trim() || !pw.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setFailedAttempts(null);
    setMaxAttempts(null);
    try {
      const user = await login(id.trim(), pw.trim());

      // 로그인 성공 → 실패 카운터 초기화
      setFailedAttempts(null);
      setMaxAttempts(null);

      // ID 저장 처리
      if (saveId) {
        await Storage.set(STORAGE_KEYS.SAVED_ID, id.trim());
      } else {
        await Storage.remove(STORAGE_KEYS.SAVED_ID);
      }

      // 자동 로그인 처리
      if (autoLogin) {
        await Storage.set(STORAGE_KEYS.AUTO_LOGIN_USER, JSON.stringify(user));
      } else {
        await Storage.remove(STORAGE_KEYS.AUTO_LOGIN_USER);
      }

      setCurrentUser(user);
    } catch (e: any) {
      setError(e.message ?? '로그인에 실패했습니다.');
      if (e instanceof LoginError && e.failedAttempts !== null) {
        setFailedAttempts(e.failedAttempts);
        setMaxAttempts(e.maxAttempts);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── 5. ID저장 체크 해제 시 즉시 삭제 ───────────────────────────────────────
  const handleSaveIdChange = async (checked: boolean) => {
    setSaveId(checked);
    if (!checked) {
      await Storage.remove(STORAGE_KEYS.SAVED_ID);
    }
  };

  // ─── 6. 자동로그인 체크 해제 시 즉시 삭제 ───────────────────────────────────
  const handleAutoLoginChange = async (checked: boolean) => {
    setAutoLogin(checked);
    if (!checked) {
      await Storage.remove(STORAGE_KEYS.AUTO_LOGIN_USER);
    }
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    keyboardView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    appTitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      letterSpacing: 2,
    },
    adminNotice: {
      backgroundColor: '#1A73E820',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    adminNoticeText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      textAlign: 'center',
      lineHeight: 20,
    },
    formRow: { flexDirection: 'row', alignItems: 'stretch' },
    inputColumn: { flex: 1, marginRight: theme.spacing.md },
    textInput: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.inputBorder,
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    checkboxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
    },
    loginButton: {
      backgroundColor: loading ? '#888' : theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'stretch',
      minWidth: 64,
    },
    loginButtonText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.buttonText,
    },
    errorText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: '#e53935',
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    attemptRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      gap: 6,
    },
    attemptBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#e5393520',
      borderWidth: 1,
      borderColor: '#e53935',
    },
    attemptBadgeText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#e53935',
    },
    attemptLabel: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    initLoader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });

  // 스토리지 복원 중에는 빈 화면 (자동로그인 시 로그인 화면 flicker 방지)
  if (initializing) {
    return (
      <SafeAreaView style={styles.initLoader}>
        <ActivityIndicator color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.appTitle}>Quiri Home</Text>

          {isFirstUser === true && (
            <TouchableOpacity
              style={styles.adminNotice}
              onPress={() => router.push('/user-management' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.adminNoticeText}>
                {'등록된 사용자가 없습니다.\n최초 등록 사용자는 관리자 계정으로 생성됩니다.\n먼저 관리자 계정을 등록해주세요 → 사용자관리 ▶'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.formRow}>
            <View style={styles.inputColumn}>
              <TextInput
                style={styles.textInput}
                placeholder="ID"
                placeholderTextColor={theme.colors.textSecondary}
                value={id}
                onChangeText={setId}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={pw}
                onChangeText={setPw}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
              />
              <View style={styles.checkboxRow}>
                <Checkbox label="ID저장" value={saveId} onChange={handleSaveIdChange} />
                <Checkbox label="자동로그인" value={autoLogin} onChange={handleAutoLoginChange} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <>
              <Text style={styles.errorText}>{error}</Text>
              {failedAttempts !== null && maxAttempts !== null && (
                <View style={styles.attemptRow}>
                  <View style={styles.attemptBadge}>
                    <Text style={styles.attemptBadgeText}>
                      {failedAttempts}/{maxAttempts}
                    </Text>
                  </View>
                  <Text style={styles.attemptLabel}>
                    {failedAttempts >= maxAttempts ? '계정 잠금' : `회 실패 (${maxAttempts - failedAttempts}회 남음)`}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <Text style={{ color: '#999', fontSize: 12, fontFamily: theme.typography.fontFamily }}>
          {appConfig.version}
        </Text>
      </View>
    </SafeAreaView>
  );
}
