import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMonthlyTotal } from '@/hooks/useExpenses';
import { isConfigured } from '@/lib/supabase';
import { getMonthlyTotals } from '@/lib/database';
import MonthPicker from '@/components/MonthPicker';
import { CATEGORY_COLORS } from '@/constants/categories';
import { useSettings } from '@/lib/settings-context';

const screenWidth = Dimensions.get('window').width;

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

export default function StatsScreen() {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [yearlyTotals, setYearlyTotals] = useState<number[]>(Array(12).fill(0));
  const [loadingYearly, setLoadingYearly] = useState(true);

  const { currencyConfig } = useSettings();
  const { totalSar, byCategory, loading, refresh } = useMonthlyTotal(month, year);

  const fetchYearly = useCallback(async () => {
    if (!isConfigured) { setLoadingYearly(false); return; }
    setLoadingYearly(true);
    try {
      const data = await getMonthlyTotals(year);
      setYearlyTotals(data);
    } catch {
      // silent
    } finally {
      setLoadingYearly(false);
    }
  }, [year]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      fetchYearly();
    }, [month, year])
  );

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const pieData = Object.entries(byCategory)
    .sort((a, b) => b[1].sar - a[1].sar)
    .map(([name, data]) => ({
      name,
      amount: parseFloat(data.sar.toFixed(2)),
      color: CATEGORY_COLORS[name] || '#B0BEC5',
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));

  const currentMonthIdx = month - 1;
  const barLabels: string[] = [];
  const barData: number[] = [];
  for (let i = Math.max(0, currentMonthIdx - 5); i <= currentMonthIdx; i++) {
    barLabels.push(t(`months.${MONTH_KEYS[i]}`).slice(0, 5));
    barData.push(parseFloat((yearlyTotals[i] || 0).toFixed(2)));
  }

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: () => colors.textSecondary,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      stroke: colors.border,
    },
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <MonthPicker month={month} year={year} onPrev={handlePrev} onNext={handleNext} />

      {/* Total */}
      <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
          {t('stats.monthlyTotal')}
        </Text>
        <Text style={[styles.totalValue, { color: colors.expense }]}>
          {totalSar.toFixed(2)} {currencyConfig.primary.symbol}
        </Text>
      </View>

      {/* Pie Chart */}
      {pieData.length > 0 ? (
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t('stats.categoryDistribution')}
          </Text>
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      ) : (
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('stats.noData')}
          </Text>
        </View>
      )}

      {/* Bar Chart */}
      {barData.some(v => v > 0) && (
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t('stats.monthlyComparison')} ({year})
          </Text>
          <BarChart
            data={{
              labels: barLabels,
              datasets: [{ data: barData.map(v => v || 0) }],
            }}
            width={screenWidth - 48}
            height={200}
            chartConfig={chartConfig}
            yAxisLabel=""
            yAxisSuffix={` ${currencyConfig.primary.symbol}`}
            fromZero
            showValuesOnTopOfBars
            style={{ borderRadius: 8 }}
          />
        </View>
      )}

      {/* Category Breakdown */}
      {pieData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t('stats.categoryDetails')}
          </Text>
          {Object.entries(byCategory)
            .sort((a, b) => b[1].sar - a[1].sar)
            .map(([cat, data]) => {
              const pct = totalSar > 0 ? (data.sar / totalSar) * 100 : 0;
              const barColor = CATEGORY_COLORS[cat] || '#B0BEC5';
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <View style={styles.catNameRow}>
                      <View style={[styles.catDot, { backgroundColor: barColor }]} />
                      <Text style={[styles.catName, { color: colors.text }]}>{cat}</Text>
                    </View>
                    <Text style={[styles.catAmount, { color: colors.textSecondary }]}>
                      {data.sar.toFixed(2)} {currencyConfig.primary.symbol} ({data.count})
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]}
                    />
                  </View>
                  <Text style={[styles.pctText, { color: colors.textSecondary }]}>
                    {pct.toFixed(1)}%
                  </Text>
                </View>
              );
            })}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  totalCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  catRow: { width: '100%', marginBottom: 12 },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmount: { fontSize: 13 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 11, marginTop: 2 },
});
