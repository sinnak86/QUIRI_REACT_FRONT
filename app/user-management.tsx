import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { BottomBar } from '@/components/BottomBar';
import { usePlatformInfo } from '@/hooks/usePlatformInfo';

export default function UserManagementScreen() {
  const { theme } = useTheme();
  const { platformName } = usePlatformInfo();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="사용자관리" onMenuPress={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.title}>사용자관리</Text>
        <Text style={styles.subtitle}>기능 구현 예정</Text>
      </View>
      <BottomBar platformName={platformName} />
    </SafeAreaView>
  );
}
