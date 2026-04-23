import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type MenuIconItemProps = {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
};

export function MenuIconItem({ label, onPress, icon }: MenuIconItemProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: theme.spacing.sm,
      flex: 1,
    },
    iconBox: {
      width: 72,
      height: 72,
      backgroundColor: theme.colors.menuItemBg,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.menuItemBorder,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadow.light,
    },
    iconText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xl,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.bold,
    },
    label: {
      marginTop: theme.spacing.xs,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text,
      textAlign: 'center',
      maxWidth: 80,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        {icon ?? (
          <Text style={styles.iconText}>{label.charAt(0)}</Text>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
