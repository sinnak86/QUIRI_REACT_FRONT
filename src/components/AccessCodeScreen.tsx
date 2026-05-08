import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { verifyAccessCode, setSessionPassed } from '@/services/accessCodeApi';

const MONO = Platform.select({ web: "'Consolas', monospace", default: 'monospace' }) as string;

interface Props {
  /** 코드 통과 시 호출 */
  onPassed: () => void;
}

export function AccessCodeScreen({ onPassed }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    // 숫자만, 최대 6자리
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError('6자리 숫자를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await verifyAccessCode(code);
      if (ok) {
        setSessionPassed();
        onPassed();
      } else {
        setError('접근 코드가 올바르지 않습니다.');
        setCode('');
        inputRef.current?.focus();
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0A0A',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    title: {
      fontFamily: MONO,
      fontSize: 20,
      fontWeight: '700',
      color: '#F0F0F0',
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: MONO,
      fontSize: 13,
      color: '#A0A0A0',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 40,
    },
    inputBox: {
      width: 220,
      height: 56,
      borderWidth: 1,
      borderColor: '#2E2E2E',
      borderRadius: 8,
      backgroundColor: '#1C1C1C',
      paddingHorizontal: 16,
      fontFamily: MONO,
      fontSize: 28,
      fontWeight: '700',
      color: '#F0F0F0',
      textAlign: 'center',
      letterSpacing: 10,
      marginBottom: 12,
    },
    inputFocused: {
      borderColor: '#1A73E8',
    },
    hint: {
      fontFamily: MONO,
      fontSize: 11,
      color: '#555',
      marginBottom: 24,
    },
    errorText: {
      fontFamily: MONO,
      fontSize: 12,
      color: '#e53935',
      marginBottom: 20,
      textAlign: 'center',
    },
    submitBtn: {
      width: 220,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: '#1A73E8',
      alignItems: 'center',
    },
    submitBtnDisabled: {
      backgroundColor: '#333',
    },
    submitBtnText: {
      fontFamily: MONO,
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
  });

  const [focused, setFocused] = useState(false);
  const canSubmit = code.length === 6 && !loading;

  return (
    <View style={s.container}>
      <Text style={s.title}>접근 코드 입력</Text>
      <Text style={s.subtitle}>
        {'이 서비스는 접근 코드가 필요합니다.\n관리자에게 6자리 코드를 요청하세요.'}
      </Text>

      <TextInput
        ref={inputRef}
        style={[s.inputBox, focused && s.inputFocused]}
        value={code}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={handleSubmit}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="──────"
        placeholderTextColor="#333"
        autoFocus
        returnKeyType="done"
        secureTextEntry
      />
      <Text style={s.hint}>{code.length} / 6 자리</Text>

      {error && <Text style={s.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.submitBtnText}>확인</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
