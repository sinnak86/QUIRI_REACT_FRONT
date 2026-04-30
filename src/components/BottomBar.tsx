import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { testBackendConnection } from '@/services/api';

type BottomBarProps = {
  platformName: string;
};

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function BottomBar({ platformName }: BottomBarProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleApiTest = async () => {
    setLoading(true);
    try {
      const result = await testBackendConnection();
      showAlert(
        '✅ API 연결 성공',
        `message: ${result.message}\nstatus: ${result.status}\ntimestamp: ${result.timestamp}`,
      );
    } catch (e: any) {
      showAlert('❌ API 연결 실패', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      height: theme.bottomBar.height,
      backgroundColor: theme.colors.bottomBarBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.bottomBar.paddingHorizontal,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sideText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      minWidth: 60,
    },
    centerButton: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    centerButtonDisabled: {
      backgroundColor: '#888',
    },
    centerButtonText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sideText}>{platformName}</Text>

      <TouchableOpacity
        style={[styles.centerButton, loading && styles.centerButtonDisabled]}
        onPress={handleApiTest}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.centerButtonText}>API Test</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.sideText, { textAlign: 'right' }]}>Quiri Home</Text>
    </View>
  );
}
