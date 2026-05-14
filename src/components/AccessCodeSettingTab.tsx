import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  checkAccessCodeExists,
  saveAccessCode,
  clearAccessCode,
  getCountryBlockEnabled,
  setCountryBlockEnabled,
} from '@/services/accessCodeApi';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmAlert(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      resolve(window.confirm(`${title}\n\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '확인', style: 'destructive', onPress: () => resolve(true) },
      ]);
    }
  });
}

export function AccessCodeSettingTab() {
  const { theme } = useTheme();

  const [codeSet, setCodeSet] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countryBlockEnabled, setCountryBlockEnabledState] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exists, enabled] = await Promise.all([
        checkAccessCodeExists(),
        getCountryBlockEnabled(),
      ]);
      setCodeSet(exists === true); // null(연결 불가) → false 처리
      setCountryBlockEnabledState(enabled);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNewCodeChange = (text: string) => {
    setNewCode(text.replace(/\D/g, '').slice(0, 6));
    setError(null);
  };

  const handleSave = async () => {
    if (newCode.length !== 6) {
      setError('6자리 숫자를 모두 입력해주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAccessCode(newCode);
      setNewCode('');
      await load(); // 서버에서 저장 결과 재확인 (exists === true 로 setCodeSet)
      showAlert('✅ 저장 완료', '새 접근 코드가 설정되었습니다.');
    } catch (e: any) {
      setError(e.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const ok = await confirmAlert('접근 코드 초기화', '접근 코드를 삭제하면 누구나 접근 가능합니다.\n계속하시겠습니까?');
    if (!ok) return;
    setClearing(true);
    try {
      await clearAccessCode();
      setCodeSet(false);
      showAlert('✅ 초기화 완료', '접근 코드가 삭제되었습니다. 이제 누구나 접근 가능합니다.');
    } catch (e: any) {
      showAlert('오류', e.message ?? '초기화에 실패했습니다.');
    } finally {
      setClearing(false);
    }
  };

  const handleCountryBlockToggle = async (value: boolean) => {
    setCountryBlockEnabledState(value);
    await setCountryBlockEnabled(value);
  };

  const s = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    // 국가 차단 토글
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '700',
      marginBottom: 12,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: theme.colors.text,
    },
    rowDesc: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 3,
      lineHeight: 16,
    },
    // 현재 코드 상태
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
    },
    codeDisplay: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    codeHint: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    clearBtn: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: '#e53935',
      alignSelf: 'flex-start',
    },
    clearBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '700',
      color: '#e53935',
    },
    // 새 코드 입력
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    input: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 14,
      fontFamily: theme.typography.fontFamily,
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      letterSpacing: 8,
    },
    saveBtn: {
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    saveBtnDisabled: { backgroundColor: '#333' },
    saveBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: '#fff',
    },
    errorText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: '#e53935',
      marginTop: 10,
    },
    inputHint: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* 국가 차단 설정 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>국가 차단</Text>
        <View style={s.rowBetween}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={s.rowLabel}>대한민국 외 접근 차단</Text>
            <Text style={s.rowDesc}>
              {countryBlockEnabled
                ? '🇰🇷 대한민국(KR) 이외 국가의 접근을 차단합니다.'
                : '국가 제한 없이 모든 국가에서 접근 허용합니다.'}
            </Text>
          </View>
          <Switch
            value={countryBlockEnabled}
            onValueChange={handleCountryBlockToggle}
            trackColor={{ false: '#333', true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 현재 접근 코드 상태 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>현재 접근 코드</Text>
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: codeSet ? '#4CAF50' : '#555' }]} />
          <Text style={s.statusText}>
            {codeSet ? '설정됨' : '미설정 (누구나 접근 가능)'}
          </Text>
        </View>
        {codeSet && (
          <>
            <Text style={s.codeDisplay}>{'●'.repeat(6)}</Text>
            <Text style={s.codeHint}>보안을 위해 코드는 표시되지 않습니다.</Text>
            <TouchableOpacity
              style={s.clearBtn}
              onPress={handleClear}
              disabled={clearing}
              activeOpacity={0.7}
            >
              {clearing
                ? <ActivityIndicator color="#e53935" size="small" />
                : <Text style={s.clearBtnText}>코드 초기화</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 새 코드 설정 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{codeSet ? '코드 변경' : '코드 설정'}</Text>
        <Text style={s.label}>새 6자리 접근 코드</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={newCode}
            onChangeText={handleNewCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#333"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            style={[s.saveBtn, (newCode.length !== 6 || saving) && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={newCode.length !== 6 || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveBtnText}>저장</Text>
            }
          </TouchableOpacity>
        </View>
        <Text style={s.inputHint}>{newCode.length} / 6 자리 · 숫자만 입력</Text>
        {error && <Text style={s.errorText}>{error}</Text>}
      </View>
    </View>
  );
}
