import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type HeaderProps = {
  title: string;
  onMenuPress?: () => void;
};

export function Header({ title, onMenuPress }: HeaderProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      height: theme.header.height,
      backgroundColor: theme.colors.headerBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.header.paddingHorizontal,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      flex: 1,
    },
    menuButton: {
      padding: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuBarLine: {
      width: 20,
      height: 2,
      backgroundColor: theme.colors.text,
      borderRadius: 1,
      marginVertical: 2,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.7}>
        <View style={styles.menuBarLine} />
        <View style={styles.menuBarLine} />
        <View style={styles.menuBarLine} />
      </TouchableOpacity>
    </View>
  );
}
