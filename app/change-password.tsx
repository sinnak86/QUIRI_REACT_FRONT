import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Header } from '@/components/Header';
import { changePassword } from '@/services/userApi';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!currentPw || !newPw || !confirmPw) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (newPw.length < 4) {
      setError('새 비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPw !== confirmPw) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!currentUser) {
      setError('로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentUser.id, currentPw, newPw);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    keyboardView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    textInput: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.inputBorder,
      paddingVertical: theme.spacing.sm,
    },
    button: {
      backgroundColor: loading ? '#888' : theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    buttonText: {
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
    successBox: {
      backgroundColor: '#e8f5e9',
      borderWidth: 1,
      borderColor: '#4CAF50',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.xl,
      alignItems: 'center',
    },
    successText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: '#2e7d32',
      textAlign: 'center',
      lineHeight: 22,
    },
    backButton: {
      marginTop: theme.spacing.md,
      alignItems: 'center',
      padding: theme.spacing.sm,
    },
    backButtonText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="비밀번호 변경"
        showBack
        onBackPress={() => router.back()}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{'비밀번호가 성공적으로 변경되었습니다.\n다음 로그인부터 새 비밀번호를 사용하세요.'}</Text>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>← 돌아가기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>현재 비밀번호</Text>
              <TextInput
                style={styles.textInput}
                placeholder="현재 비밀번호 입력"
                placeholderTextColor={theme.colors.textSecondary}
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput
                style={styles.textInput}
                placeholder="새 비밀번호 입력 (최소 4자)"
                placeholderTextColor={theme.colors.textSecondary}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>새 비밀번호 확인</Text>
              <TextInput
                style={styles.textInput}
                placeholder="새 비밀번호 재입력"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSubmit}
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>변경하기</Text>
                )}
              </TouchableOpacity>

              {error && <Text style={styles.errorText}>{error}</Text>}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
