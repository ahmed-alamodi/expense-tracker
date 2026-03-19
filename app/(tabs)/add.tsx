import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ExpenseForm from '@/components/ExpenseForm';
import { createExpense } from '@/lib/database';
import { Expense } from '@/types/expense';

export default function AddExpenseScreen() {
  const { t } = useTranslation();

  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    await createExpense(data);
    Alert.alert(t('common.done'), t('add.expenseAdded'), [
      { text: t('common.ok'), onPress: () => router.navigate('/(tabs)') },
    ]);
  };

  return <ExpenseForm onSubmit={handleSubmit} submitLabel={t('add.addExpense')} />;
}
