import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { BottomBar } from '@/components/BottomBar';
import { MenuIconItem } from '@/components/MenuIconItem';
import { usePlatformInfo } from '@/hooks/usePlatformInfo';

type MenuItem = {
  id: string;
  label: string;
  route: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'user-management', label: '사용자관리', route: '/user-management' },
];

const NUM_COLUMNS = 3;

export default function MainScreen() {
  const { theme } = useTheme();
  const { platformName } = usePlatformInfo();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
    },
    columnWrapper: {
      marginBottom: theme.spacing.sm,
    },
  });

  const renderItem = ({ item }: { item: MenuItem }) => (
    <MenuIconItem
      label={item.label}
      onPress={() => router.push(item.route as any)}
    />
  );

  const renderEmptySlots = () => {
    const remainder = MENU_ITEMS.length % NUM_COLUMNS;
    if (remainder === 0) return null;
    const emptyCount = NUM_COLUMNS - remainder;
    return Array.from({ length: emptyCount }).map((_, i) => (
      <View key={`empty-${i}`} style={{ flex: 1, padding: theme.spacing.sm }} />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Quiri Home" onMenuPress={() => {}} />
      <View style={styles.content}>
        <FlatList
          data={MENU_ITEMS}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListFooterComponent={renderEmptySlots}
          scrollEnabled={false}
        />
      </View>
      <BottomBar platformName={platformName} />
    </SafeAreaView>
  );
}
