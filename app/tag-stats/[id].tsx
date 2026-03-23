import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PieChart } from 'react-native-chart-kit';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getExpensesByTag, getTagStats, getTags } from '@/lib/database';
import { Expense, Tag } from '@/types/expense';
import { CATEGORY_COLORS } from '@/constants/categories';
import { useSettings } from '@/lib/settings-context';
import ExpenseCard from '@/components/ExpenseCard';

const screenWidth = Dimensions.get('window').width;

export default function TagStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { currencyConfig } = useSettings();
  const [tag, setTag] = useState<Tag | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<{
    totalSar: number;
    totalYmr: number;
    byCategory: Record<string, { sar: number; ymr: number; count: number }>;
    count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [allTags, tagExpenses, tagStats] = await Promise.all([
          getTags(),
          getExpensesByTag(id),
          getTagStats(id),
        ]);
        const foundTag = allTags.find(t => t.id === id);
        setTag(foundTag || null);
        setExpenses(tagExpenses);
        setStats(tagStats);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (!tag || !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>{t('tags.notFound')}</Text>
      </View>
    );
  }

  const pieData = Object.entries(stats.byCategory)
    .sort((a, b) => b[1].sar - a[1].sar)
    .map(([name, data]) => ({
      name,
      amount: parseFloat(data.sar.toFixed(2)),
      color: CATEGORY_COLORS[name] || '#B0BEC5',
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: () => colors.textSecondary,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: tag.color, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{tag.name}</Text>
          {tag.description ? (
            <Text style={styles.headerDesc} numberOfLines={1}>{tag.description}</Text>
          ) : null}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ExpenseCard expense={item} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListHeaderComponent={
          <View>
            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryBlock}>
                  <Text style={[styles.summaryValue, { color: colors.expense }]}>
                    {stats.totalSar.toFixed(2)}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    {currencyConfig.primary.name}
                  </Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryBlock}>
                  <Text style={[styles.summaryValue, { color: colors.expense }]}>
                    {stats.totalYmr.toLocaleString()}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    {currencyConfig.secondary.name}
                  </Text>
                </View>
              </View>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {stats.count} {t('tags.totalExpenses')}
              </Text>
            </View>

            {/* Pie Chart */}
            {pieData.length > 0 && (
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
            )}

            {/* Category Breakdown */}
            {Object.keys(stats.byCategory).length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {t('stats.categoryDetails')}
                </Text>
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1].sar - a[1].sar)
                  .map(([cat, data]) => {
                    const pct = stats.totalSar > 0 ? (data.sar / stats.totalSar) * 100 : 0;
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
                      </View>
                    );
                  })}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.expenses')} ({expenses.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('tags.noExpensesForTag')}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  backBtn: { padding: 4 },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBlock: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  summaryDivider: { width: 1, height: 40, marginHorizontal: 16 },
  countText: { fontSize: 13, marginTop: 10 },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  chartTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, alignSelf: 'stretch' },
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
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
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
});
