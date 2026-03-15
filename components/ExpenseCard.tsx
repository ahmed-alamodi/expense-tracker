import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Expense } from '@/types/expense';
import { CATEGORY_COLORS } from '@/constants/categories';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete }: Props) {
  const colors = useThemeColor();

  const categoryColor = CATEGORY_COLORS[expense.main_category] || '#B0BEC5';
  const formattedDate = new Date(expense.date).toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'short',
  });

  const handlePress = () => {
    router.push(`/expense/${expense.id}`);
  };

  const handleDelete = () => {
    Alert.alert('حذف المصروف', 'هل أنت متأكد من حذف هذا المصروف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => onDelete?.(expense.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
            {expense.description || expense.sub_category}
          </Text>
          <Text style={[styles.amount, { color: colors.expense }]}>
            {expense.amount_sar.toFixed(2)} ر.س
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.tags}>
            <Text style={[styles.tag, { backgroundColor: categoryColor + '20', color: categoryColor }]}>
              {expense.main_category}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </View>
          <Text style={[styles.amountYmr, { color: colors.textSecondary }]}>
            {expense.amount_ymr.toLocaleString()} ي.ر
          </Text>
        </View>

        {expense.payment_method ? (
          <Text style={[styles.paymentMethod, { color: colors.textSecondary }]}>
            {expense.payment_method}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryDot: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
  },
  amountYmr: {
    fontSize: 12,
    marginRight: 8,
  },
  paymentMethod: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  deleteBtn: {
    padding: 4,
  },
});
