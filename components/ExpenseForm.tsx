import { useThemeColor } from '@/hooks/useThemeColor';
import { getTags } from '@/lib/database';
import { useSettings } from '@/lib/settings-context';
import { sarToYmr, ymrToSar } from '@/lib/storage';
import { isConfigured } from '@/lib/supabase';
import { Expense, Tag } from '@/types/expense';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { alert } from '@/lib/alert';

interface Props {
  initialData?: Partial<Expense>;
  onSubmit: (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  submitLabel?: string;
}

export default function ExpenseForm({ initialData, onSubmit, submitLabel }: Props) {
  const colors = useThemeColor();
  const { t, i18n } = useTranslation();
  const { exchangeRate: settingsRate, paymentMethods: settingsMethods, categories: settingsCategories, currencyConfig } = useSettings();
  const [date, setDate] = useState(new Date(initialData?.date || new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mainCategory, setMainCategory] = useState(initialData?.main_category || '');
  const [subCategory, setSubCategory] = useState(initialData?.sub_category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amountSar, setAmountSar] = useState(initialData?.amount_sar?.toString() || '');
  const [amountYmr, setAmountYmr] = useState(initialData?.amount_ymr?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate || settingsRate);
  const [submitting, setSubmitting] = useState(false);

  const [tagId, setTagId] = useState<string | null>(initialData?.tag_id || null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const [showMainCatPicker, setShowMainCatPicker] = useState(false);
  const [showSubCatPicker, setShowSubCatPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const label = submitLabel || t('common.save');
  const paymentMethods = settingsMethods;
  const categories = settingsCategories;

  useEffect(() => {
    if (!initialData?.exchange_rate) {
      setExchangeRate(settingsRate);
    }
  }, [settingsRate, initialData?.exchange_rate]);

  useEffect(() => {
    if (isConfigured) {
      getTags().then(setAvailableTags).catch(() => {});
    }
  }, []);

  const subCategories = categories.find(c => c.main === mainCategory)?.subs || [];

  const handleSarChange = (val: string) => {
    setAmountSar(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountYmr(sarToYmr(num, exchangeRate).toString());
    }
  };

  const handleYmrChange = (val: string) => {
    setAmountYmr(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountSar(ymrToSar(num, exchangeRate).toString());
    }
  };

  const handleSubmit = async () => {
    if (!mainCategory) {
      alert(t('common.warning'), t('form.selectMainCategoryAlert'));
      return;
    }
    if (!amountSar && !amountYmr) {
      alert(t('common.warning'), t('form.enterAmount'));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date: date.toISOString().split('T')[0],
        main_category: mainCategory,
        sub_category: subCategory,
        description,
        amount_sar: parseFloat(amountSar) || 0,
        amount_ymr: parseFloat(amountYmr) || 0,
        exchange_rate: exchangeRate,
        payment_method: paymentMethod,
        notes: notes || null,
        tag_id: tagId,
      });

      if (!initialData) {
        setDate(new Date());
        setMainCategory('');
        setSubCategory('');
        setDescription('');
        setAmountSar('');
        setAmountYmr('');
        setPaymentMethod('');
        setNotes('');
      }
    } catch (err: any) {
      alert(t('common.error'), err.message || t('form.errorOccurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

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
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.date')}</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: colors.text }}>
            {date.toLocaleDateString(locale)}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Main Category */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.mainCategory')}</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowMainCatPicker(true)}
        >
          <Text style={{ color: mainCategory ? colors.text : colors.textSecondary }}>
            {mainCategory || t('form.selectMainCategory')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {renderPickerModal(
          showMainCatPicker,
          () => setShowMainCatPicker(false),
          categories.map(c => c.main),
          (item) => {
            setMainCategory(item);
            setSubCategory('');
          },
          t('form.mainCategory')
        )}

        {/* Sub Category */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.subCategory')}</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            if (!mainCategory) {
              alert(t('common.warning'), t('form.selectMainFirst'));
              return;
            }
            setShowSubCatPicker(true);
          }}
        >
          <Text style={{ color: subCategory ? colors.text : colors.textSecondary }}>
            {subCategory || t('form.selectSubCategory')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {renderPickerModal(
          showSubCatPicker,
          () => setShowSubCatPicker(false),
          subCategories,
          setSubCategory,
          t('form.subCategory')
        )}

        {/* Description */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.description')}</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('form.descPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          textAlign="right"
        />

        {/* Amounts */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>{t('form.amount')} ({currencyConfig.primary.symbol})</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={amountSar}
              onChangeText={handleSarChange}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              textAlign="right"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>{t('form.amount')} ({currencyConfig.secondary.symbol})</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={amountYmr}
              onChangeText={handleYmrChange}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              textAlign="right"
            />
          </View>
        </View>
        <Text style={[styles.rateHint, { color: colors.textSecondary }]}>
          {t('form.exchangeRateHint')} {exchangeRate} {currencyConfig.secondary.symbol}
        </Text>

        {/* Payment Method */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.paymentMethod')}</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowPaymentPicker(true)}
        >
          <Text style={{ color: paymentMethod ? colors.text : colors.textSecondary }}>
            {paymentMethod || t('form.selectPaymentMethod')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {renderPickerModal(
          showPaymentPicker,
          () => setShowPaymentPicker(false),
          paymentMethods,
          setPaymentMethod,
          t('form.paymentMethod')
        )}

        {/* Tag */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.tag')}</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }, availableTags.length === 0 && { opacity: 0.5 }]}
          onPress={() => setShowTagPicker(true)}
          disabled={availableTags.length === 0}
        >
          <Text style={{ color: tagId ? colors.text : colors.textSecondary }}>
            {tagId
              ? availableTags.find(tag => tag.id === tagId)?.name || t('form.selectTag')
              : t('form.selectTag')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {tagId && (
              <TouchableOpacity onPress={() => setTagId(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {renderPickerModal(
          showTagPicker,
          () => setShowTagPicker(false),
          availableTags.map(tag => tag.name),
          (tagName) => {
            const found = availableTags.find(tag => tag.name === tagName);
            setTagId(found?.id || null);
          },
          t('form.tag')
        )}

        {/* Notes */}
        <Text style={[styles.label, { color: colors.text }]}>{t('form.notes')}</Text>
        <TextInput
          style={[styles.textInput, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('form.notesPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlign="right"
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.tint, opacity: submitting ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFF" />
          <Text style={styles.submitText}>
            {submitting ? t('common.saving') : label}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 46,
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  rateHint: {
    fontSize: 11,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalItem: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemText: {
    fontSize: 16,
  },
});
