import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { IpEntry } from '@/types/ip';
import {
  getIpList,
  addIpEntry,
  updateIpEntry,
  deleteIpEntry,
  getCountryBlockEnabled,
  setCountryBlockEnabled,
} from '@/services/ipApi';

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

function validateIpPattern(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '접근 IP를 입력해주세요.';

  // CIDR
  if (trimmed.includes('/')) {
    const [addr, bits] = trimmed.split('/');
    const n = parseInt(bits, 10);
    if (isNaN(n) || n < 0 || n > 32) return 'CIDR 프리픽스는 0~32 범위여야 합니다.';
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(addr)) return '유효한 IP 주소 형식이 아닙니다.';
    return null;
  }
  // 와일드카드
  if (trimmed.includes('*')) {
    if (!/^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/.test(trimmed)) {
      return '와일드카드 형식: 예) 192.168.1.*';
    }
    return null;
  }
  // 단일 IP
  const parts = trimmed.split('.');
  if (parts.length !== 4) return '유효한 IPv4 주소를 입력해주세요. (예: 192.168.1.1)';
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255) return '각 옥텟은 0~255 범위여야 합니다.';
  }
  return null;
}

// ── 등록/수정 모달 ─────────────────────────────────────────────────────────────
function IpFormModal({
  visible,
  entry,
  onClose,
  onSaved,
}: {
  visible: boolean;
  entry: IpEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { theme } = useTheme();
  const isEdit = entry !== null;

  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(entry?.name ?? '');
      setIp(entry?.ip ?? '');
      setNote(entry?.note ?? '');
      setError(null);
    }
  }, [visible, entry]);

  const handleSave = async () => {
    if (!name.trim()) { setError('접근명을 입력해주세요.'); return; }
    const ipError = validateIpPattern(ip);
    if (ipError) { setError(ipError); return; }

    setLoading(true);
    setError(null);
    try {
      if (isEdit && entry) {
        await updateIpEntry(entry.id, { name, ip, note });
        showAlert('✅ 수정 완료', `${name.trim()} 항목이 수정되었습니다.`);
      } else {
        await addIpEntry({ name, ip, note });
        showAlert('✅ 등록 완료', `${name.trim()} (${ip.trim()}) 이(가) 등록되었습니다.`);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modal: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 24,
    },
    title: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 20,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      marginTop: 14,
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
    hint: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    errorText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: '#e53935',
      marginTop: 12,
      textAlign: 'center',
    },
    btnRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 24,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    saveBtnDisabled: { backgroundColor: '#555' },
    saveBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: '#fff',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.title}>{isEdit ? '접근 IP 수정' : '접근 IP 등록'}</Text>

          <Text style={s.label}>접근명 *</Text>
          <TextInput
            style={s.input}
            placeholder="예) 사무실 IP"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>접근 IP *</Text>
          <TextInput
            style={s.input}
            placeholder="예) 192.168.1.100"
            placeholderTextColor={theme.colors.textSecondary}
            value={ip}
            onChangeText={setIp}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="decimal-pad"
          />
          <Text style={s.hint}>
            {'단일 IP: 192.168.1.1  |  와일드카드: 192.168.1.*  |  CIDR: 192.168.0.0/24'}
          </Text>

          <Text style={s.label}>비고</Text>
          <TextInput
            style={s.input}
            placeholder="선택 사항"
            placeholderTextColor={theme.colors.textSecondary}
            value={note}
            onChangeText={setNote}
            autoCapitalize="none"
          />

          {error && <Text style={s.errorText}>{error}</Text>}

          <View style={s.btnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={s.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, loading && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.saveBtnText}>{isEdit ? '수정' : '등록'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 접근제어 IP 목록 탭 ───────────────────────────────────────────────────────
export function IpControlTab() {
  const { theme } = useTheme();
  const [list, setList] = useState<IpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<IpEntry | null>(null);
  const [countryBlockEnabled, setCountryBlockEnabledState] = useState(true);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const [ipList, enabled] = await Promise.all([
        getIpList(),
        getCountryBlockEnabled(),
      ]);
      setList(ipList);
      setCountryBlockEnabledState(enabled);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const handleCountryBlockToggle = async (value: boolean) => {
    setCountryBlockEnabledState(value);
    await setCountryBlockEnabled(value);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setModalVisible(true);
  };

  const handleEdit = (entry: IpEntry) => {
    setEditTarget(entry);
    setModalVisible(true);
  };

  const handleDelete = async (entry: IpEntry) => {
    const ok = await confirmAlert(
      '삭제 확인',
      `"${entry.name}" (${entry.ip}) 을(를) 삭제하시겠습니까?`
    );
    if (!ok) return;
    try {
      await deleteIpEntry(entry.id);
      loadList();
    } catch (e: any) {
      showAlert('오류', e.message ?? '삭제에 실패했습니다.');
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1 },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    toolbarTitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    addBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
    },
    addBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '700',
      color: '#fff',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    // 테이블 헤더
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    colName: { flex: 3 },
    colIp: { flex: 3 },
    colNote: { flex: 4 },
    colActions: { width: 100, alignItems: 'flex-end' },
    headerText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '700',
    },
    // 테이블 행
    list: { paddingHorizontal: 16, paddingTop: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cellText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
    },
    ipText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    noteText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    actionRow: { flexDirection: 'row', gap: 6, width: 100, justifyContent: 'flex-end' },
    editBtn: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: '#1A73E820',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    editBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    deleteBtn: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: '#e5393520',
      borderWidth: 1,
      borderColor: '#e53935',
    },
    deleteBtnText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: '#e53935',
    },
    infoBox: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: '#1A73E810',
      borderWidth: 1,
      borderColor: '#1A73E840',
    },
    infoText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    // 국가 차단 토글
    countryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    countryRowLeft: { flex: 1, marginRight: 12 },
    countryRowLabel: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: theme.colors.text,
    },
    countryRowDesc: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
  });

  return (
    <View style={s.container}>
      {/* 툴바 */}
      <View style={s.toolbar}>
        <Text style={s.toolbarTitle}>접근제어 IP 목록 ({list.length}개)</Text>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={s.addBtnText}>+ 등록</Text>
        </TouchableOpacity>
      </View>

      {/* 국가 차단 토글 */}
      <View style={s.countryRow}>
        <View style={s.countryRowLeft}>
          <Text style={s.countryRowLabel}>대한민국 외 접근 차단</Text>
          <Text style={s.countryRowDesc}>
            {countryBlockEnabled
              ? '🇰🇷 대한민국(KR) 이외 국가의 접근을 차단합니다.'
              : '국가 제한 없이 모든 국가에서 접근 허용합니다.'}
          </Text>
        </View>
        <Switch
          value={countryBlockEnabled}
          onValueChange={handleCountryBlockToggle}
          trackColor={{ false: '#333', true: theme.colors.primary }}
          thumbColor="#fff"
          disabled={loading}
        />
      </View>

      {/* IP 목록 안내 */}
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          {'• 목록이 비어있으면 모든 IP에서 접근 허용\n• localhost / 127.0.0.1은 항상 허용\n• 단일 IP, 와일드카드(192.168.1.*), CIDR(192.168.0.0/24) 지원'}
        </Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : list.length === 0 ? (
        <View style={[s.center, { paddingTop: 40 }]}>
          <Text style={s.emptyText}>
            {'등록된 접근 IP가 없습니다.\n+ 등록 버튼으로 허용 IP를 추가하세요.'}
          </Text>
        </View>
      ) : (
        <>
          {/* 컬럼 헤더 */}
          <View style={s.tableHeader}>
            <View style={s.colName}>
              <Text style={s.headerText}>접근명</Text>
            </View>
            <View style={s.colIp}>
              <Text style={s.headerText}>접근 IP</Text>
            </View>
            <View style={s.colNote}>
              <Text style={s.headerText}>비고</Text>
            </View>
            <View style={s.colActions} />
          </View>

          {/* 목록 */}
          <ScrollView style={s.list}>
            {list.map((entry) => (
              <View key={entry.id} style={s.row}>
                <View style={s.colName}>
                  <Text style={s.cellText} numberOfLines={1}>{entry.name}</Text>
                  <Text style={[s.noteText, { marginTop: 2 }]}>
                    {new Date(entry.createdAt).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
                <View style={s.colIp}>
                  <Text style={s.ipText} numberOfLines={1}>{entry.ip}</Text>
                </View>
                <View style={s.colNote}>
                  <Text style={s.noteText} numberOfLines={2}>{entry.note || '-'}</Text>
                </View>
                <View style={s.actionRow}>
                  <TouchableOpacity style={s.editBtn} onPress={() => handleEdit(entry)} activeOpacity={0.7}>
                    <Text style={s.editBtnText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(entry)} activeOpacity={0.7}>
                    <Text style={s.deleteBtnText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* 등록/수정 모달 */}
      <IpFormModal
        visible={modalVisible}
        entry={editTarget}
        onClose={() => setModalVisible(false)}
        onSaved={loadList}
      />
    </View>
  );
}
