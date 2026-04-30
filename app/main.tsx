import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRootNavigationState } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Header } from '@/components/Header';
import { BottomBar } from '@/components/BottomBar';
import { MenuIconItem } from '@/components/MenuIconItem';
import { usePlatformInfo } from '@/hooks/usePlatformInfo';
import { getAccessibleMenuCodes } from '@/services/userApi';

// 전체 메뉴 정의 (추후 메뉴 추가 시 여기에 추가)
const ALL_MENUS = [
  { id: 'user-management', code: 'USER_MANAGEMENT', label: '사용자관리', route: '/user-management' },
];

const NUM_COLUMNS = 3;

export default function MainScreen() {
  const { theme } = useTheme();
  const { currentUser, isAdmin } = useUser();
  const { platformName } = usePlatformInfo();
  const [accessibleCodes, setAccessibleCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    // Root Layout이 마운트되기 전에는 navigate 하지 않음
    if (!rootNavState?.key) return;

    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (isAdmin) {
      setAccessibleCodes(ALL_MENUS.map((m) => m.code));
      setLoading(false);
      return;
    }
    getAccessibleMenuCodes(currentUser.id)
      .then((codes) => setAccessibleCodes(codes))
      .catch(() => setAccessibleCodes([]))
      .finally(() => setLoading(false));
  }, [currentUser, isAdmin, rootNavState?.key]);

  const visibleMenus = accessibleCodes
    ? ALL_MENUS.filter((m) => accessibleCodes.includes(m.code))
    : [];

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, padding: theme.spacing.md },
    listContent: { paddingVertical: theme.spacing.sm },
    columnWrapper: { marginBottom: theme.spacing.sm },
    centerMessage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noMenuText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  const renderEmptySlots = () => {
    const remainder = visibleMenus.length % NUM_COLUMNS;
    if (remainder === 0) return null;
    const emptyCount = NUM_COLUMNS - remainder;
    return Array.from({ length: emptyCount }).map((_, i) => (
      <View key={`empty-${i}`} style={{ flex: 1, padding: theme.spacing.sm }} />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`Quiri Home${currentUser ? ` · ${currentUser.displayName}` : ''}`}
        showUserMenu
      />
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : visibleMenus.length === 0 ? (
          <View style={styles.centerMessage}>
            <Text style={styles.noMenuText}>
              {'접근 가능한 메뉴가 없습니다.\n관리자에게 권한을 요청하세요.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={visibleMenus}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MenuIconItem label={item.label} onPress={() => router.push(item.route as any)} />
            )}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListFooterComponent={renderEmptySlots}
            scrollEnabled={false}
          />
        )}
      </View>
      <BottomBar platformName={platformName} />
    </SafeAreaView>
  );
}
