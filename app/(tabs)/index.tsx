import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpenses, useMonthlyTotal } from '@/hooks/useExpenses';
import MonthPicker from '@/components/MonthPicker';
import ExpenseCard from '@/components/ExpenseCard';
import SearchFilter, { Filters } from '@/components/SearchFilter';
import { deleteExpense } from '@/lib/database';
import { useSettings } from '@/lib/settings-context';
import { useNetwork } from '@/lib/network-context';
import { Ionicons } from '@expo/vector-icons';
import { invalidateCachePattern } from '@/lib/cache';

export default function HomeScreen() {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filters, setFilters] = useState<Filters>({
    search: '',
    mainCategory: '',
    paymentMethod: '',
  });
  const { categories: settingsCategories, paymentMethods: settingsPaymentMethods, currencyConfig } = useSettings();
  const { isOnline, pendingCount } = useNetwork();
  const categoryNames = settingsCategories.map(c => c.main);
  const paymentMethodsList = settingsPaymentMethods;

  const { expenses, loading, refresh } = useExpenses({
    month,
    year,
    limit: 50,
    search: filters.search || undefined,
    mainCategory: filters.mainCategory || undefined,
    paymentMethod: filters.paymentMethod || undefined,
  });
  const {
    totalSar,
    totalYmr,
    byCategory,
    loading: totalLoading,
    refresh: refreshTotal,
  } = useMonthlyTotal(month, year);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshTotal();
    }, [month, year])
  );

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      await invalidateCachePattern('expenses_');
      await invalidateCachePattern('monthly_total_');
      refresh();
      refreshTotal();
    } catch {
      // handled
    }
  };

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1].sar - a[1].sar)
    .slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onDelete={handleDelete} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refresh();
              refreshTotal();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            {(!isOnline || pendingCount > 0) && (
              <View style={[styles.statusBanner, { backgroundColor: !isOnline ? '#FEF3C7' : '#DBEAFE' }]}>
                <Ionicons
                  name={!isOnline ? 'cloud-offline-outline' : 'sync-outline'}
                  size={16}
                  color={!isOnline ? '#D97706' : '#2563EB'}
                />
                <Text style={[styles.statusText, { color: !isOnline ? '#D97706' : '#2563EB' }]}>
                  {!isOnline ? t('offline.banner') : `${t('offline.pending')}: ${pendingCount}`}
                </Text>
              </View>
            )}
            <MonthPicker
              month={month}
              year={year}
              onPrev={handlePrev}
              onNext={handleNext}
            />

            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
                {t('home.totalExpenses')}
              </Text>
              <View style={styles.summaryAmounts}>
                <View style={styles.amountBlock}>
                  <Text style={[styles.amountValue, { color: colors.expense }]}>
                    {totalYmr.toLocaleString()}
                  </Text>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    {currencyConfig.secondary.name}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.amountBlock}>
                  <Text style={[styles.amountValue, { color: colors.expense }]}>
                    {totalSar.toFixed(2)}
                  </Text>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    {currencyConfig.primary.name}
                  </Text>
                </View>
              </View>

              {topCategories.length > 0 && (
                <View style={styles.topCats}>
                  <Text style={[styles.topCatsTitle, { color: colors.textSecondary }]}>
                    {t('home.topCategories')}
                  </Text>
                  {topCategories.map(([cat, data]) => (
                    <View key={cat} style={styles.topCatRow}>
                      <Text style={[styles.topCatAmount, { color: colors.textSecondary }]}>
                        {data.sar.toFixed(2)} {currencyConfig.primary.symbol} ({data.count})
                      </Text>
                      <Text style={[styles.topCatName, { color: colors.text }]}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <SearchFilter
              filters={filters}
              onFiltersChange={setFilters}
              categoryNames={categoryNames}
              paymentMethods={paymentMethodsList}
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.expenses')} ({expenses.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('home.noExpenses')}
            </Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountBlock: {
    flex: 1,
    alignItems: 'center',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  amountLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  topCats: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  topCatsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  topCatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  topCatName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  topCatAmount: {
    fontSize: 13,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
