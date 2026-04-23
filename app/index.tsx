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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
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
    checkmark: {
      color: theme.colors.buttonText,
      fontSize: 10,
      lineHeight: 14,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity style={styles.row} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={styles.box}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const handleLogin = () => {
    router.replace('/main');
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
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
      marginBottom: theme.spacing.xxl,
      letterSpacing: 2,
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    inputColumn: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
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
      backgroundColor: theme.colors.primary,
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
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.appTitle}>Quiri Home</Text>

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
              />
              <View style={styles.checkboxRow}>
                <Checkbox label="ID저장" value={saveId} onChange={setSaveId} />
                <Checkbox label="자동로그인" value={autoLogin} onChange={setAutoLogin} />
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <Text style={{ color: '#999', fontSize: 12, fontFamily: theme.typography.fontFamily }}>{appConfig.version}</Text>
      </View>
    </SafeAreaView>
  );
}
