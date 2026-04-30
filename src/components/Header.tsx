import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Storage, STORAGE_KEYS } from '@/utils/storage';

type HeaderProps = {
  title: string;
  onMenuPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  /** true면 우측 햄버거에 로그아웃/비밀번호변경 드롭다운 표시 */
  showUserMenu?: boolean;
};

export function Header({ title, onMenuPress, showBack, onBackPress, showUserMenu }: HeaderProps) {
  const { theme } = useTheme();
  const { setCurrentUser } = useUser();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    setMenuVisible(false);
    // 자동로그인 데이터 삭제 (로그아웃 시 자동로그인 해제)
    await Storage.remove(STORAGE_KEYS.AUTO_LOGIN_USER);
    setCurrentUser(null);
    router.replace('/');
  };

  const handleChangePassword = () => {
    setMenuVisible(false);
    router.push('/change-password' as any);
  };

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
    sideContainer: {
      width: 64,
      justifyContent: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#f0f0f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
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
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    dropdown: {
      position: 'absolute',
      top: theme.header.height + 4,
      right: theme.header.paddingHorizontal,
      backgroundColor: theme.colors.headerBg,
      borderRadius: theme.borderRadius.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 8,
      minWidth: 160,
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.md,
      gap: 10,
    },
    dropdownItemBorder: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    dropdownItemText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
    },
    logoutText: {
      color: '#e53935',
    },
  });

  const HamburgerIcon = () => (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={showUserMenu ? () => setMenuVisible(true) : onMenuPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuBarLine} />
      <View style={styles.menuBarLine} />
      <View style={styles.menuBarLine} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 왼쪽: 뒤로가기 */}
      <View style={styles.sideContainer}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress} activeOpacity={0.7} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      {/* 오른쪽: 사용자 메뉴 or 커스텀 핸들러 */}
      <View style={[styles.sideContainer, { alignItems: 'flex-end' }]}>
        {(showUserMenu || onMenuPress) && <HamburgerIcon />}
      </View>

      {/* 드롭다운 모달 (showUserMenu일 때만) */}
      {showUserMenu && (
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleChangePassword}
                activeOpacity={0.7}
              >
                <Ionicons name="key-outline" size={18} color={theme.colors.text} />
                <Text style={styles.dropdownItemText}>비밀번호 변경</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemBorder]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color="#e53935" />
                <Text style={[styles.dropdownItemText, styles.logoutText]}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
