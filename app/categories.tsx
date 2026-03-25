import { useThemeColor } from '@/hooks/useThemeColor';
import { CategoryGroup } from '@/types/expense';
import { useSettings } from '@/lib/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { alert } from '@/lib/alert';

export default function CategoriesScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { categories: settingsCategories, updateCategories } = useSettings();
  const [categories, setLocalCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddMain, setShowAddMain] = useState(false);
  const [newMainName, setNewMainName] = useState('');
  const [editingMainIdx, setEditingMainIdx] = useState<number | null>(null);
  const [editMainName, setEditMainName] = useState('');

  const [showAddSub, setShowAddSub] = useState(false);
  const [selectedMainIdx, setSelectedMainIdx] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);
  const [editSubName, setEditSubName] = useState('');

  useEffect(() => {
    setLocalCategories(settingsCategories);
  }, [settingsCategories]);

  const persist = async (updated: CategoryGroup[]) => {
    setSaving(true);
    try {
      await updateCategories(updated);
      setLocalCategories(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMain = async () => {
    const name = newMainName.trim();
    if (!name) return;
    if (categories.some(c => c.main === name)) {
      alert(t('common.warning'), t('categories.categoryExists'));
      return;
    }
    const updated = [...categories, { main: name, subs: [] }];
    await persist(updated);
    setNewMainName('');
    setShowAddMain(false);
  };

  const handleEditMain = async (idx: number) => {
    const name = editMainName.trim();
    if (!name) return;
    if (categories.some((c, i) => c.main === name && i !== idx)) {
      alert(t('common.warning'), t('categories.categoryExists'));
      return;
    }
    const updated = categories.map((c, i) =>
      i === idx ? { ...c, main: name } : c
    );
    await persist(updated);
    setEditingMainIdx(null);
    setEditMainName('');
  };

  const handleDeleteMain = (idx: number) => {
    const cat = categories[idx];
    alert(
      t('categories.deleteCategory'),
      `${t('common.delete')} "${cat.main}" ${t('categories.deleteCategoryConfirm')} (${cat.subs.length})?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updated = categories.filter((_, i) => i !== idx);
            await persist(updated);
          },
        },
      ]
    );
  };

  const openSubManager = (mainIdx: number) => {
    setSelectedMainIdx(mainIdx);
    setNewSubName('');
    setEditingSubIdx(null);
    setEditSubName('');
    setShowAddSub(true);
  };

  const handleAddSub = async () => {
    if (selectedMainIdx === null) return;
    const name = newSubName.trim();
    if (!name) return;
    const cat = categories[selectedMainIdx];
    if (cat.subs.includes(name)) {
      alert(t('common.warning'), t('categories.subCategoryExists'));
      return;
    }
    const updated = categories.map((c, i) =>
      i === selectedMainIdx ? { ...c, subs: [...c.subs, name] } : c
    );
    await persist(updated);
    setNewSubName('');
  };

  const handleEditSub = async (subIdx: number) => {
    if (selectedMainIdx === null) return;
    const name = editSubName.trim();
    if (!name) return;
    const cat = categories[selectedMainIdx];
    if (cat.subs.some((s, i) => s === name && i !== subIdx)) {
      alert(t('common.warning'), t('categories.subCategoryExists'));
      return;
    }
    const updated = categories.map((c, i) =>
      i === selectedMainIdx
        ? { ...c, subs: c.subs.map((s, si) => (si === subIdx ? name : s)) }
        : c
    );
    await persist(updated);
    setEditingSubIdx(null);
    setEditSubName('');
  };

  const handleDeleteSub = async (subIdx: number) => {
    if (selectedMainIdx === null) return;
    const cat = categories[selectedMainIdx];
    alert(t('common.delete'), `${t('common.delete')} "${cat.subs[subIdx]}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const updated = categories.map((c, i) =>
            i === selectedMainIdx
              ? { ...c, subs: c.subs.filter((_, si) => si !== subIdx) }
              : c
          );
          await persist(updated);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const selectedCat = selectedMainIdx !== null ? categories[selectedMainIdx] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('categories.manageCategories')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Add Main Category */}
        {showAddMain ? (
          <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <Text style={[styles.addCardTitle, { color: colors.text }]}>{t('categories.newMainCategory')}</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={newMainName}
                onChangeText={setNewMainName}
                placeholder={t('categories.categoryName')}
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.success }]}
                onPress={handleAddMain}
                disabled={saving}
              >
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.border }]}
                onPress={() => { setShowAddMain(false); setNewMainName(''); }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addMainBtn, { borderColor: colors.tint }]}
            onPress={() => setShowAddMain(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
            <Text style={[styles.addMainBtnText, { color: colors.tint }]}>{t('categories.addMainCategory')}</Text>
          </TouchableOpacity>
        )}

        {/* Categories List */}
        {categories.map((cat, idx) => (
          <View
            key={`${cat.main}-${idx}`}
            style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {editingMainIdx === idx ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={editMainName}
                  onChangeText={setEditMainName}
                  textAlign="right"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleEditMain(idx)}
                  disabled={saving}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: colors.border }]}
                  onPress={() => { setEditingMainIdx(null); setEditMainName(''); }}
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.mainCatRow, { borderBottomColor: colors.border }]}>
                <View style={styles.mainCatRight}>
                  <Text style={[styles.mainCatName, { color: colors.text }]}>{cat.main}</Text>
                  <Text style={[styles.subCount, { color: colors.textSecondary }]}>
                    {cat.subs.length} {t('categories.subCategory')}
                  </Text>
                </View>
                <View style={styles.mainCatLeft}>
                  <TouchableOpacity onPress={() => handleDeleteMain(idx)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setEditingMainIdx(idx); setEditMainName(cat.main); }}
                    hitSlop={8}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.tint} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {cat.subs.length > 0 && (
              <View style={styles.subsContainer}>
                {cat.subs.map((sub, subIdx) => (
                  <View
                    key={`${sub}-${subIdx}`}
                    style={[styles.subRow, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.subName, { color: colors.textSecondary }]}>
                      › {sub}
                    </Text>
                    <View style={styles.subActions}>
                      <TouchableOpacity
                        onPress={async () => {
                          setSelectedMainIdx(idx);
                          await handleDeleteSub(subIdx);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMainIdx(idx);
                          setEditingSubIdx(subIdx);
                          setEditSubName(sub);
                          setShowAddSub(true);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="pencil-outline" size={15} color={colors.tint} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.addSubBtn, { borderTopColor: colors.border }]}
              onPress={() => openSubManager(idx)}
            >
              <Ionicons name="add" size={15} color={colors.tint} />
              <Text style={[styles.addSubBtnText, { color: colors.tint }]}>{t('categories.addSubCategory')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Sub Category Manager Modal */}
      <Modal visible={showAddSub} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => { setShowAddSub(false); setEditingSubIdx(null); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedCat ? `${t('categories.categoriesOf')} "${selectedCat.main}"` : t('categories.subCategories')}
              </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {selectedCat?.subs.map((sub, subIdx) => (
                <View
                  key={`modal-sub-${subIdx}`}
                  style={[styles.modalSubRow, { borderBottomColor: colors.border }]}
                >
                  {editingSubIdx === subIdx ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={[styles.editInput, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        value={editSubName}
                        onChangeText={setEditSubName}
                        textAlign="right"
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.success }]}
                        onPress={() => handleEditSub(subIdx)}
                        disabled={saving}
                      >
                        <Ionicons name="checkmark" size={18} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.border }]}
                        onPress={() => { setEditingSubIdx(null); setEditSubName(''); }}
                      >
                        <Ionicons name="close" size={18} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.modalSubName, { color: colors.text }]}>{sub}</Text>
                      <View style={styles.subActions}>
                        <TouchableOpacity
                          onPress={() => handleDeleteSub(subIdx)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { setEditingSubIdx(subIdx); setEditSubName(sub); }}
                          hitSlop={8}
                        >
                          <Ionicons name="pencil-outline" size={16} color={colors.tint} />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ))}

              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                {t('categories.addNewSubCategory')}
              </Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.addInput, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={newSubName}
                  onChangeText={setNewSubName}
                  placeholder={t('categories.subCategoryName')}
                  placeholderTextColor={colors.textSecondary}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: colors.success }]}
                  onPress={handleAddSub}
                  disabled={saving || !newSubName.trim()}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  addMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  addMainBtnText: { fontSize: 15, fontWeight: '600' },
  addCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  addCardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  mainCatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainCatLeft: { flexDirection: 'row', gap: 12 },
  mainCatRight: {},
  mainCatName: { fontSize: 16, fontWeight: '700' },
  subCount: { fontSize: 12, marginTop: 2 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  subsContainer: { paddingHorizontal: 14 },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subActions: { flexDirection: 'row', gap: 10 },
  subName: { fontSize: 14 },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addSubBtnText: { fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalSubName: { fontSize: 15, flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
});
