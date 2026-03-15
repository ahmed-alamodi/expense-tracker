import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '@/types/expense';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getExchangeRate, getPaymentMethods, sarToYmr, ymrToSar } from '@/lib/storage';

interface Props {
  initialData?: Partial<Expense>;
  onSubmit: (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  submitLabel?: string;
}

export default function ExpenseForm({ initialData, onSubmit, submitLabel = 'حفظ' }: Props) {
  const colors = useThemeColor();
  const [date, setDate] = useState(new Date(initialData?.date || new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mainCategory, setMainCategory] = useState(initialData?.main_category || '');
  const [subCategory, setSubCategory] = useState(initialData?.sub_category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amountSar, setAmountSar] = useState(initialData?.amount_sar?.toString() || '');
  const [amountYmr, setAmountYmr] = useState(initialData?.amount_ymr?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [exchangeRate, setExchangeRate] = useState(410);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [showMainCatPicker, setShowMainCatPicker] = useState(false);
  const [showSubCatPicker, setShowSubCatPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  useEffect(() => {
    getExchangeRate().then(setExchangeRate);
    getPaymentMethods().then(setPaymentMethods);
  }, []);

  const subCategories = DEFAULT_CATEGORIES.find(c => c.main === mainCategory)?.subs || [];

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
      Alert.alert('تنبيه', 'يرجى اختيار الفئة الرئيسية');
      return;
    }
    if (!amountSar && !amountYmr) {
      Alert.alert('تنبيه', 'يرجى إدخال المبلغ');
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
        payment_method: paymentMethod,
        notes: notes || null,
      });
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={[styles.label, { color: colors.text }]}>التاريخ</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: colors.text }}>
            {date.toLocaleDateString('ar-SA')}
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
        <Text style={[styles.label, { color: colors.text }]}>الفئة الرئيسية</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowMainCatPicker(true)}
        >
          <Text style={{ color: mainCategory ? colors.text : colors.textSecondary }}>
            {mainCategory || 'اختر الفئة الرئيسية'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {renderPickerModal(
          showMainCatPicker,
          () => setShowMainCatPicker(false),
          DEFAULT_CATEGORIES.map(c => c.main),
          (item) => {
            setMainCategory(item);
            setSubCategory('');
          },
          'الفئة الرئيسية'
        )}

        {/* Sub Category */}
        <Text style={[styles.label, { color: colors.text }]}>الفئة الفرعية</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            if (!mainCategory) {
              Alert.alert('تنبيه', 'اختر الفئة الرئيسية أولاً');
              return;
            }
            setShowSubCatPicker(true);
          }}
        >
          <Text style={{ color: subCategory ? colors.text : colors.textSecondary }}>
            {subCategory || 'اختر الفئة الفرعية'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {renderPickerModal(
          showSubCatPicker,
          () => setShowSubCatPicker(false),
          subCategories,
          setSubCategory,
          'الفئة الفرعية'
        )}

        {/* Description */}
        <Text style={[styles.label, { color: colors.text }]}>الوصف</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={description}
          onChangeText={setDescription}
          placeholder="مثال: وجبة عشاء"
          placeholderTextColor={colors.textSecondary}
          textAlign="right"
        />

        {/* Amounts */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.text }]}>المبلغ (ر.س)</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>المبلغ (يمني)</Text>
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
          سعر الصرف: 1 ر.س = {exchangeRate} ي.ر
        </Text>

        {/* Payment Method */}
        <Text style={[styles.label, { color: colors.text }]}>طريقة الدفع</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowPaymentPicker(true)}
        >
          <Text style={{ color: paymentMethod ? colors.text : colors.textSecondary }}>
            {paymentMethod || 'اختر طريقة الدفع'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {renderPickerModal(
          showPaymentPicker,
          () => setShowPaymentPicker(false),
          paymentMethods,
          setPaymentMethod,
          'طريقة الدفع'
        )}

        {/* Notes */}
        <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
        <TextInput
          style={[styles.textInput, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="ملاحظات إضافية (اختياري)"
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
            {submitting ? 'جاري الحفظ...' : submitLabel}
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
    textAlign: 'right',
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
    textAlign: 'right',
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
    textAlign: 'right',
  },
});
