import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Header } from '@/components/Header';
import { BottomBar } from '@/components/BottomBar';
import { usePlatformInfo } from '@/hooks/usePlatformInfo';
import {
  getAllUsers,
  createUser,
  deleteUser,
  getUserPermissions,
  updateUserPermissions,
  getAuthStatus,
  unlockUser,
} from '@/services/userApi';
import { User, UserPermissions } from '@/types/user';
import { IpControlTab } from '@/components/IpControlTab';

type Tab = 'users' | 'add' | 'permissions' | 'ip-control';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmAlert(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      resolve(window.confirm(`${title}\n\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
      ]);
    }
  });
}

// ── 사용자 목록 탭 ────────────────────────────────────────────────────────────
function UsersTab({
  users,
  loading,
  currentUserId,
  onDeleteUser,
  onUnlockUser,
  onRefresh,
}: {
  users: User[];
  loading: boolean;
  currentUserId?: number;
  onDeleteUser: (user: User) => void;
  onUnlockUser: (user: User) => void;
  onRefresh: () => void;
}) {
  const { theme } = useTheme();

  const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    refreshBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    refreshBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    list: { paddingHorizontal: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface ?? '#111',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    info: { flex: 1 },
    displayName: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600',
      color: theme.colors.text,
    },
    meta: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 8,
    },
    badgeAdmin: { backgroundColor: '#1A73E830' },
    badgeUser: { backgroundColor: '#33333360' },
    badgeText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '700',
    },
    badgeAdminText: { color: theme.colors.primary },
    badgeUserText: { color: theme.colors.textSecondary },
    deleteBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: '#e5393520',
      borderWidth: 1,
      borderColor: '#e53935',
    },
    deleteBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '700',
      color: '#e53935',
    },
    unlockBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: '#FF980020',
      borderWidth: 1,
      borderColor: '#FF9800',
      marginRight: 6,
    },
    unlockBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '700',
      color: '#FF9800',
    },
    lockedBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: '#FF980030',
      marginTop: 4,
      alignSelf: 'flex-start',
    },
    lockedBadgeText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: '#FF9800',
    },
    meBadge: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 10,
      color: '#4CAF50',
      marginRight: 4,
    },
  });

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>사용자 목록 ({users.length}명)</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Text style={s.refreshBtnText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.list}>
        {users.length === 0 ? (
          <View style={[s.center, { paddingTop: 40 }]}>
            <Text style={s.emptyText}>등록된 사용자가 없습니다.</Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={s.row}>
              <View style={s.info}>
                <Text style={s.displayName}>
                  {user.id === currentUserId && <Text style={s.meBadge}>[나] </Text>}
                  {user.displayName}
                </Text>
                <Text style={s.meta}>@{user.loginId}</Text>
                <Text style={s.meta}>
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </Text>
                {user.isLocked && (
                  <View style={s.lockedBadge}>
                    <Text style={s.lockedBadgeText}>🔒 잠김</Text>
                  </View>
                )}
                {!user.isLocked && user.failedLoginAttempts > 0 && (
                  <Text style={[s.meta, { color: '#FF9800' }]}>
                    실패 {user.failedLoginAttempts}/5회
                  </Text>
                )}
              </View>
              <View
                style={[s.badge, user.role === 'ADMIN' ? s.badgeAdmin : s.badgeUser]}
              >
                <Text
                  style={[
                    s.badgeText,
                    user.role === 'ADMIN' ? s.badgeAdminText : s.badgeUserText,
                  ]}
                >
                  {user.role === 'ADMIN' ? '관리자' : '일반'}
                </Text>
              </View>
              {user.role !== 'ADMIN' && user.id !== currentUserId && (
                <>
                  {user.isLocked && (
                    <TouchableOpacity style={s.unlockBtn} onPress={() => onUnlockUser(user)}>
                      <Text style={s.unlockBtnText}>해제</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.deleteBtn} onPress={() => onDeleteUser(user)}>
                    <Text style={s.deleteBtnText}>삭제</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── 사용자 추가 탭 ────────────────────────────────────────────────────────────
function AddUserTab({
  isFirstUser,
  onUserCreated,
}: {
  isFirstUser: boolean;
  onUserCreated: () => void;
}) {
  const { theme } = useTheme();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!loginId.trim() || !password.trim() || !displayName.trim()) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (loginId.trim().length < 3) {
      setError('로그인 ID는 3자 이상이어야 합니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createUser({
        loginId: loginId.trim(),
        password,
        displayName: displayName.trim(),
      });
      showAlert(
        '✅ 사용자 생성 완료',
        `${created.displayName} (${created.loginId})\n역할: ${created.role === 'ADMIN' ? '관리자' : '일반 사용자'}`
      );
      setLoginId('');
      setPassword('');
      setDisplayName('');
      onUserCreated();
    } catch (e: any) {
      setError(e.message ?? '사용자 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    adminNotice: {
      backgroundColor: '#1A73E820',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    adminNoticeTitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    adminNoticeText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      lineHeight: 20,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      marginTop: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    input: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.inputBorder,
      paddingVertical: 8,
    },
    createBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 32,
    },
    createBtnDisabled: { backgroundColor: '#555' },
    createBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      color: '#fff',
    },
    errorText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: '#e53935',
      textAlign: 'center',
      marginTop: 12,
    },
  });

  return (
    <ScrollView style={s.container}>
      {isFirstUser && (
        <View style={s.adminNotice}>
          <Text style={s.adminNoticeTitle}>👑 관리자 계정 등록</Text>
          <Text style={s.adminNoticeText}>
            {'등록된 사용자가 없습니다.\n최초 등록 사용자는 자동으로 관리자(ADMIN)로 설정됩니다.\n이후 등록되는 사용자는 모두 일반 사용자입니다.'}
          </Text>
        </View>
      )}

      <Text style={s.label}>로그인 ID</Text>
      <TextInput
        style={s.input}
        placeholder="영문, 숫자 3자 이상"
        placeholderTextColor={theme.colors.textSecondary}
        value={loginId}
        onChangeText={setLoginId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={s.label}>비밀번호</Text>
      <TextInput
        style={s.input}
        placeholder="6자 이상"
        placeholderTextColor={theme.colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={s.label}>사용자명</Text>
      <TextInput
        style={s.input}
        placeholder="표시될 이름"
        placeholderTextColor={theme.colors.textSecondary}
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[s.createBtn, loading && s.createBtnDisabled]}
        onPress={handleCreate}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.createBtnText}>
            {isFirstUser ? '관리자 계정 생성' : '사용자 생성'}
          </Text>
        )}
      </TouchableOpacity>

      {error && <Text style={s.errorText}>{error}</Text>}
    </ScrollView>
  );
}

// ── 권한 관리 탭 ──────────────────────────────────────────────────────────────
function PermissionsTab({ users }: { users: User[] }) {
  const { theme } = useTheme();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPerms, setLocalPerms] = useState<{ menuId: number; canAccess: boolean }[]>([]);

  const regularUsers = users.filter((u) => u.role !== 'ADMIN');

  const loadPermissions = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const perms = await getUserPermissions(userId);
      setPermissions(perms);
      setLocalPerms(perms.permissions.map((p) => ({ menuId: p.menuId, canAccess: p.canAccess })));
    } catch (e: any) {
      showAlert('오류', e.message ?? '권한 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    loadPermissions(userId);
  };

  const togglePerm = (menuId: number, value: boolean) => {
    setLocalPerms((prev) =>
      prev.map((p) => (p.menuId === menuId ? { ...p, canAccess: value } : p))
    );
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await updateUserPermissions(selectedUserId, localPerms);
      showAlert('✅ 저장 완료', '권한이 업데이트되었습니다.');
    } catch (e: any) {
      showAlert('오류', e.message ?? '권한 저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    userPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    userChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    userChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: '#1A73E820',
    },
    userChipText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    userChipTextActive: { color: theme.colors.primary, fontWeight: '700' },
    noUserText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 20 },
    permRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface ?? '#111',
      borderRadius: 8,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    permInfo: { flex: 1 },
    permName: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      fontWeight: '600',
    },
    permRoute: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    saveBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 20,
    },
    saveBtnDisabled: { backgroundColor: '#555' },
    saveBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      color: '#fff',
    },
    centerMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    centerText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    selectedUser: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 16,
    },
  });

  return (
    <ScrollView style={s.container}>
      <Text style={s.label}>사용자 선택</Text>

      {regularUsers.length === 0 ? (
        <Text style={s.noUserText}>일반 사용자가 없습니다. 먼저 사용자를 추가하세요.</Text>
      ) : (
        <View style={s.userPickerRow}>
          {regularUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[s.userChip, selectedUserId === user.id && s.userChipActive]}
              onPress={() => handleSelectUser(user.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  s.userChipText,
                  selectedUserId === user.id && s.userChipTextActive,
                ]}
              >
                {user.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.divider} />

      {!selectedUserId ? (
        <Text style={s.centerText}>사용자를 선택하면 메뉴 권한을 설정할 수 있습니다.</Text>
      ) : loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
      ) : permissions ? (
        <>
          <Text style={s.selectedUser}>
            {permissions.displayName} (@{permissions.loginId}) 권한 설정
          </Text>

          {permissions.permissions.length === 0 ? (
            <Text style={s.centerText}>설정 가능한 메뉴가 없습니다.</Text>
          ) : (
            <>
              {permissions.permissions.map((perm) => {
                const local = localPerms.find((p) => p.menuId === perm.menuId);
                return (
                  <View key={perm.menuId} style={s.permRow}>
                    <View style={s.permInfo}>
                      <Text style={s.permName}>{perm.menuName}</Text>
                      <Text style={s.permRoute}>{perm.menuRoute}</Text>
                    </View>
                    <Switch
                      value={local?.canAccess ?? false}
                      onValueChange={(v) => togglePerm(perm.menuId, v)}
                      trackColor={{ false: '#333', true: theme.colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                );
              })}

              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.saveBtnText}>권한 저장</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function UserManagementScreen() {
  const { theme } = useTheme();
  const { currentUser, isAdmin } = useUser();
  const { platformName } = usePlatformInfo();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [isFirstUser, setIsFirstUser] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const [list, status] = await Promise.all([getAllUsers(), getAuthStatus()]);
      setUsers(list);
      setIsFirstUser(!status.hasUsers);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 로그인 없이 접근 + 첫 사용자 → 자동으로 '사용자 추가' 탭으로 이동
  useEffect(() => {
    if (isFirstUser && !currentUser) {
      setActiveTab('add');
    }
  }, [isFirstUser, currentUser]);

  const handleDeleteUser = async (user: User) => {
    const ok = await confirmAlert(
      '사용자 삭제',
      `${user.displayName} (@${user.loginId}) 을(를) 삭제하시겠습니까?`
    );
    if (!ok) return;
    try {
      await deleteUser(user.id);
      showAlert('✅ 삭제 완료', `${user.displayName} 사용자가 삭제되었습니다.`);
      loadUsers();
    } catch (e: any) {
      showAlert('오류', e.message ?? '삭제에 실패했습니다.');
    }
  };

  const handleUnlockUser = async (user: User) => {
    try {
      await unlockUser(user.id);
      showAlert('🔓 잠금 해제', `${user.displayName} 계정의 잠금이 해제되었습니다.`);
      loadUsers();
    } catch (e: any) {
      showAlert('오류', e.message ?? '잠금 해제에 실패했습니다.');
    }
  };

  const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabItemActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    content: { flex: 1 },
    noPermission: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    noPermText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  // 관리자만 사용자 삭제/권한 관리 가능 (단, 첫 사용자 등록 시에는 누구나 '사용자 추가' 탭 접근 가능)
  const tabs: { key: Tab; label: string; adminOnly: boolean }[] = [
    { key: 'users', label: '사용자 목록', adminOnly: false },
    { key: 'add', label: '사용자 추가', adminOnly: true },
    { key: 'permissions', label: '권한 관리', adminOnly: true },
    { key: 'ip-control', label: '접근제어 IP', adminOnly: true },
  ];

  const canAddUser = isAdmin || isFirstUser;
  const visibleTabs = (isAdmin || isFirstUser)
    ? tabs.filter((t) => (t.key !== 'permissions' && t.key !== 'ip-control') || isAdmin)
    : tabs.filter((t) => !t.adminOnly);

  return (
    <SafeAreaView style={s.safeArea}>
      <Header title="사용자관리" showBack onBackPress={() => router.back()} />

      {/* 탭 바 */}
      <View style={s.tabBar}>
        {visibleTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabItem, activeTab === tab.key && s.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.content}>
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            loading={usersLoading}
            currentUserId={currentUser?.id}
            onDeleteUser={handleDeleteUser}
            onUnlockUser={handleUnlockUser}
            onRefresh={loadUsers}
          />
        )}
        {activeTab === 'add' && canAddUser && (
          <AddUserTab
            isFirstUser={isFirstUser}
            onUserCreated={() => {
              if (!currentUser) {
                // 첫 사용자 등록 완료 → 로그인 화면으로 이동
                router.replace('/');
              } else {
                loadUsers();
                setActiveTab('users');
              }
            }}
          />
        )}
        {activeTab === 'permissions' && isAdmin && (
          <PermissionsTab users={users} />
        )}
        {activeTab === 'ip-control' && isAdmin && (
          <IpControlTab />
        )}
        {!canAddUser && activeTab === 'add' && (
          <View style={s.noPermission}>
            <Text style={s.noPermText}>관리자만 접근 가능한 기능입니다.</Text>
          </View>
        )}
        {!isAdmin && activeTab === 'permissions' && (
          <View style={s.noPermission}>
            <Text style={s.noPermText}>관리자만 접근 가능한 기능입니다.</Text>
          </View>
        )}
        {!isAdmin && activeTab === 'ip-control' && (
          <View style={s.noPermission}>
            <Text style={s.noPermText}>관리자만 접근 가능한 기능입니다.</Text>
          </View>
        )}
      </View>

      <BottomBar platformName={platformName} />
    </SafeAreaView>
  );
}
