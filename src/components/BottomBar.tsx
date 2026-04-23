import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type BottomBarProps = {
  platformName: string;
};

export function BottomBar({ platformName }: BottomBarProps) {
  const { theme } = useTheme();

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
    text: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{platformName}</Text>
      <Text style={styles.text}>Quiri Home</Text>
    </View>
  );
}
