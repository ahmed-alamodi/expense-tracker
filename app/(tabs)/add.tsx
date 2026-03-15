import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import ExpenseForm from '@/components/ExpenseForm';
import { createExpense } from '@/lib/database';
import { Expense } from '@/types/expense';

export default function AddExpenseScreen() {
  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    await createExpense(data);
    Alert.alert('تم', 'تم إضافة المصروف بنجاح', [
      { text: 'حسناً', onPress: () => router.navigate('/(tabs)') },
    ]);
  };

  return <ExpenseForm onSubmit={handleSubmit} submitLabel="إضافة المصروف" />;
}
