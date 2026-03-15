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
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpenses, useMonthlyTotal } from '@/hooks/useExpenses';
import MonthPicker from '@/components/MonthPicker';
import ExpenseCard from '@/components/ExpenseCard';
import SearchFilter, { Filters } from '@/components/SearchFilter';
import { deleteExpense } from '@/lib/database';

export default function HomeScreen() {
  const colors = useThemeColor();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filters, setFilters] = useState<Filters>({
    search: '',
    mainCategory: '',
    paymentMethod: '',
  });

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
            <MonthPicker
              month={month}
              year={year}
              onPrev={handlePrev}
              onNext={handleNext}
            />

            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
                إجمالي المصاريف
              </Text>
              <View style={styles.summaryAmounts}>
                <View style={styles.amountBlock}>
                  <Text style={[styles.amountValue, { color: colors.expense }]}>
                    {totalSar.toFixed(2)}
                  </Text>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    ريال سعودي
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.amountBlock}>
                  <Text style={[styles.amountValue, { color: colors.expense }]}>
                    {totalYmr.toLocaleString()}
                  </Text>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    ريال يمني
                  </Text>
                </View>
              </View>

              {topCategories.length > 0 && (
                <View style={styles.topCats}>
                  <Text style={[styles.topCatsTitle, { color: colors.textSecondary }]}>
                    أعلى الفئات
                  </Text>
                  {topCategories.map(([cat, data]) => (
                    <View key={cat} style={styles.topCatRow}>
                      <Text style={[styles.topCatName, { color: colors.text }]}>{cat}</Text>
                      <Text style={[styles.topCatAmount, { color: colors.textSecondary }]}>
                        {data.sar.toFixed(2)} ر.س ({data.count})
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <SearchFilter filters={filters} onFiltersChange={setFilters} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              المصاريف ({expenses.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد مصاريف لهذا الشهر
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
    textAlign: 'right',
  },
  topCatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  topCatName: {
    fontSize: 13,
    fontWeight: '500',
  },
  topCatAmount: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
