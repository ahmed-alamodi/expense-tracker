import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { isConfigured } from '@/lib/supabase';
import {
  getMonthlyEstimates,
  createMonthlyEstimate,
  updateMonthlyEstimate,
  deleteMonthlyEstimate,
} from '@/lib/database';
import { getCategories, getExchangeRate, sarToYmr, ymrToSar } from '@/lib/storage';
import { MonthlyEstimate, CategoryGroup } from '@/types/expense';

export default function EstimatesScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [estimates, setEstimates] = useState<MonthlyEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MonthlyEstimate | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [exchangeRate, setExchangeRate] = useState(410);

  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amountSar, setAmountSar] = useState('');
  const [amountYmr, setAmountYmr] = useState('');
  const [notes, setNotes] = useState('');
  const [showMainCatPicker, setShowMainCatPicker] = useState(false);
  const [showSubCatPicker, setShowSubCatPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const subCategories = categories.find(c => c.main === mainCategory)?.subs || [];

  const fetchData = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const [data, cats, rate] = await Promise.all([
        getMonthlyEstimates(),
        getCategories(),
        getExchangeRate(),
      ]);
      setEstimates(data);
      setCategories(cats);
      setExchangeRate(rate);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const resetForm = () => {
    setMainCategory('');
    setSubCategory('');
    setDescription('');
    setAmountSar('');
    setAmountYmr('');
    setNotes('');
    setEditingItem(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: MonthlyEstimate) => {
    setEditingItem(item);
    setMainCategory(item.main_category);
    setSubCategory(item.sub_category);
    setDescription(item.description);
    setAmountSar(item.amount_sar.toString());
    setAmountYmr(item.amount_ymr.toString());
    setNotes(item.notes || '');
    setShowForm(true);
  };

  const handleSarChange = (val: string) => {
    setAmountSar(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setAmountYmr(sarToYmr(num, exchangeRate).toString());
  };

  const handleYmrChange = (val: string) => {
    setAmountYmr(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setAmountSar(ymrToSar(num, exchangeRate).toString());
  };

  const handleSave = async () => {
    if (!mainCategory) {
      Alert.alert(t('common.warning'), t('estimates.selectMainCategoryAlert'));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t('common.warning'), t('estimates.enterDescription'));
      return;
    }
    if (!amountSar && !amountYmr) {
      Alert.alert(t('common.warning'), t('estimates.enterAmount'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        main_category: mainCategory,
        sub_category: subCategory,
        description: description.trim(),
        amount_sar: parseFloat(amountSar) || 0,
        amount_ymr: parseFloat(amountYmr) || 0,
        notes: notes.trim() || null,
      };
      if (editingItem) {
        await updateMonthlyEstimate(editingItem.id, payload);
      } else {
        await createMonthlyEstimate(payload);
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: MonthlyEstimate) => {
    Alert.alert(t('common.delete'), `${t('common.delete')} "${item.description}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMonthlyEstimate(item.id);
            fetchData();
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
          }
        },
      },
    ]);
  };

  const totalSar = estimates.reduce((s, e) => s + e.amount_sar, 0);
  const totalYmr = estimates.reduce((s, e) => s + e.amount_ymr, 0);

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    items: string[],
    onSelect: (item: string) => void,
    title: string
  ) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          </View>
          <FlatList
            data={items}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[styles.modalItemText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('estimates.monthlyEstimates')}</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Summary */}
        {estimates.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.tint }]}>
            <Text style={styles.summaryLabel}>{t('estimates.totalMonthlyEstimates')}</Text>
            <Text style={styles.summaryAmount}>{totalSar.toFixed(2)} {t('common.sar')}</Text>
            <Text style={styles.summaryAmountSub}>{totalYmr.toLocaleString()} {t('common.ymr')}</Text>
          </View>
        )}

        {estimates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calculator-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('estimates.noEstimates')}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {t('estimates.addEstimatesHint')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.tint }]}
              onPress={openAdd}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyAddBtnText}>{t('estimates.addEstimate')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {estimates.map(item => (
              <View
                key={item.id}
                style={[styles.estimateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.estimateTop}>
                  <View style={styles.estimateInfo}>
                    <Text style={[styles.estimateDesc, { color: colors.text }]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.estimateCat, { color: colors.textSecondary }]}>
                      {item.main_category}{item.sub_category ? ` › ${item.sub_category}` : ''}
                    </Text>
                    {item.notes ? (
                      <Text style={[styles.estimateNotes, { color: colors.textSecondary }]}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.estimateAmounts}>
                    <Text style={[styles.estimateAmountSar, { color: colors.text }]}>
                      {item.amount_sar.toFixed(2)} {t('common.sar')}
                    </Text>
                    <Text style={[styles.estimateAmountYmr, { color: colors.textSecondary }]}>
                      {item.amount_ymr.toLocaleString()} {t('common.ymr')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.estimateActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color={colors.tint} />
                    <Text style={[styles.actionBtnText, { color: colors.tint }]}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.formOverlay}>
          <View style={[styles.formSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingItem ? t('estimates.editEstimate') : t('estimates.addMonthlyEstimate')}
              </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { color: colors.text }]}>{t('estimates.mainCategory')}</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowMainCatPicker(true)}
              >
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                <Text style={{ color: mainCategory ? colors.text : colors.textSecondary, flex: 1, textAlign: 'right' }}>
                  {mainCategory || t('estimates.selectMainCategory')}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.text }]}>{t('estimates.subCategory')}</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  if (!mainCategory) { Alert.alert(t('common.warning'), t('estimates.selectMainFirst')); return; }
                  setShowSubCatPicker(true);
                }}
              >
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                <Text style={{ color: subCategory ? colors.text : colors.textSecondary, flex: 1, textAlign: 'right' }}>
                  {subCategory || t('estimates.selectSubCategory')}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.text }]}>{t('estimates.itemDescription')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('estimates.descPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('estimates.estimateYmr')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    value={amountYmr}
                    onChangeText={handleYmrChange}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    textAlign="right"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('estimates.estimateSar')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    value={amountSar}
                    onChangeText={handleSarChange}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    textAlign="right"
                  />
                </View>
              </View>
              <Text style={[styles.rateHint, { color: colors.textSecondary }]}>
                {t('estimates.exchangeRateHint')} {exchangeRate} {t('common.ymr')}
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>{t('estimates.notesOptional')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('estimates.notesPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlign="right"
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.tint, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>
                  {saving ? t('common.saving') : editingItem ? t('estimates.saveEdit') : t('common.add')}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {renderPickerModal(
        showMainCatPicker,
        () => setShowMainCatPicker(false),
        categories.map(c => c.main),
        (item) => { setMainCategory(item); setSubCategory(''); },
        t('estimates.mainCategory')
      )}
      {renderPickerModal(
        showSubCatPicker,
        () => setShowSubCatPicker(false),
        subCategories,
        setSubCategory,
        t('estimates.subCategory')
      )}
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
  addBtn: { padding: 4 },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 4 },
  summaryAmount: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  summaryAmountSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  estimateCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  estimateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  estimateInfo: { flex: 1, marginRight: 12 },
  estimateDesc: { fontSize: 15, fontWeight: '600' },
  estimateCat: { fontSize: 12, marginTop: 2 },
  estimateNotes: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  estimateAmounts: { alignItems: 'flex-end' },
  estimateAmountSar: { fontSize: 16, fontWeight: '700' },
  estimateAmountYmr: { fontSize: 12, marginTop: 2 },
  estimateActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formSheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formTitle: { fontSize: 17, fontWeight: '700' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 46,
  },
  textArea: { minHeight: 80 },
  row: { flexDirection: 'row', gap: 12 },
  rateHint: { fontSize: 11, marginTop: 4 },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalItem: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalItemText: { fontSize: 16 },
});
