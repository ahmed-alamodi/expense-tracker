import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ExpenseForm from '@/components/ExpenseForm';
import { getExpenseById, updateExpense } from '@/lib/database';
import { Expense } from '@/types/expense';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColor();
  const { t } = useTranslation();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getExpenseById(id);
        setExpense(data);
      } catch {
        Alert.alert(t('common.error'), t('expenses.notFound'));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    if (!id) return;
    await updateExpense(id, data);
    Alert.alert(t('common.done'), t('expenses.expenseUpdated'), [
      { text: t('common.ok'), onPress: () => router.back() },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (!expense) return null;

  return (
    <ExpenseForm
      initialData={expense}
      onSubmit={handleSubmit}
      submitLabel={t('expenses.updateExpense')}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
