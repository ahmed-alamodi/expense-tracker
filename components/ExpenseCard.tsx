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
import { useTranslation } from 'react-i18next';
import { Expense } from '@/types/expense';
import { CATEGORY_COLORS } from '@/constants/categories';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete }: Props) {
  const colors = useThemeColor();
  const { t, i18n } = useTranslation();
  const { currencyConfig } = useSettings();

  const categoryColor = CATEGORY_COLORS[expense.main_category] || '#B0BEC5';
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const formattedDate = new Date(expense.date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });

  const handlePress = () => {
    router.push(`/expense/${expense.id}`);
  };

  const handleDelete = () => {
    Alert.alert(t('expenses.deleteExpense'), t('expenses.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.amount, { color: colors.expense }]}>
            {expense.amount_sar.toFixed(2)} {currencyConfig.primary.symbol}
          </Text>
          <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
            {expense.description || expense.sub_category}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.amountYmr, { color: colors.textSecondary }]}>
            {expense.amount_ymr.toLocaleString()} {currencyConfig.secondary.symbol}
          </Text>
          <View style={styles.tags}>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
            <Text style={[styles.tag, { backgroundColor: categoryColor + '20', color: categoryColor }]}>
              {expense.main_category}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {expense.exchange_rate ? (
            <Text style={[styles.rateTag, { color: colors.textSecondary }]}>
              {t('expenses.exchangeRateLabel')} {expense.exchange_rate}
            </Text>
          ) : null}
          {expense.payment_method ? (
            <Text style={[styles.paymentMethod, { color: colors.textSecondary }]}>
              {expense.payment_method}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryBar: {
    width: 4,
    height: 44,
    borderRadius: 4,
    marginRight: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
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
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  paymentMethod: {
    fontSize: 11,
  },
  rateTag: {
    fontSize: 10,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
