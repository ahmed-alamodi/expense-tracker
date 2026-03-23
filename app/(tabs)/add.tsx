import React from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ExpenseForm from '@/components/ExpenseForm';
import { createExpense } from '@/lib/database';
import { Expense } from '@/types/expense';
import { useNetwork } from '@/lib/network-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { addToQueue, generateTempId } from '@/lib/sync-queue';
import { Ionicons } from '@expo/vector-icons';
import { invalidateCachePattern } from '@/lib/cache';

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const { isOnline, refreshPendingCount } = useNetwork();
  const colors = useThemeColor();

  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    if (isOnline) {
      await createExpense(data);
      await invalidateCachePattern('expenses_');
      await invalidateCachePattern('monthly_total_');
    } else {
      const tempId = await generateTempId();
      await addToQueue({
        type: 'create',
        table: 'expenses',
        data: { ...data, id: tempId, _pendingSync: true },
      });
      await refreshPendingCount();
    }
    Alert.alert(t('common.done'), t('add.expenseAdded'), [
      { text: t('common.ok'), onPress: () => router.navigate('/(tabs)') },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={[styles.offlineText, { color: colors.warning }]}>
            {t('offline.banner')}
          </Text>
        </View>
      )}
      <ExpenseForm onSubmit={handleSubmit} submitLabel={t('add.addExpense')} />
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
