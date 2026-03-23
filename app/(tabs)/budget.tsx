import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMonthlyTotal } from '@/hooks/useExpenses';
import { isConfigured } from '@/lib/supabase';
import { getBudgets, upsertBudget } from '@/lib/database';
import { Budget } from '@/types/expense';
import { CATEGORY_COLORS } from '@/constants/categories';
import { useSettings } from '@/lib/settings-context';
import MonthPicker from '@/components/MonthPicker';

export default function BudgetScreen() {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [saving, setSaving] = useState(false);
  const { categories, currencyConfig } = useSettings();

  const { totalSar, byCategory, refresh: refreshExpenses } = useMonthlyTotal(month, year);

  const fetchBudgets = useCallback(async () => {
    if (!isConfigured) { setLoadingBudgets(false); return; }
    setLoadingBudgets(true);
    try {
      const data = await getBudgets(month, year);
      setBudgets(data);
      const totalBudget = data.find(b => b.category === 'total');
      setTotalBudgetInput(totalBudget ? totalBudget.amount.toString() : '');
      const catMap: Record<string, string> = {};
      for (const b of data) {
        if (b.category !== 'total') {
          catMap[b.category] = b.amount.toString();
        }
      }
      setCategoryBudgets(catMap);
    } catch {
      // silent
    } finally {
      setLoadingBudgets(false);
    }
  }, [month, year]);

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
      refreshExpenses();
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

  const handleSave = async () => {
    setSaving(true);
    try {
      if (totalBudgetInput) {
        await upsertBudget({
          month,
          year,
          category: 'total',
          amount: parseFloat(totalBudgetInput),
        });
      }
      for (const [cat, val] of Object.entries(categoryBudgets)) {
        if (val) {
          await upsertBudget({
            month,
            year,
            category: cat,
            amount: parseFloat(val),
          });
        }
      }
      Alert.alert(t('common.done'), t('budget.budgetSaved'));
      fetchBudgets();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = parseFloat(totalBudgetInput) || 0;
  const totalPct = totalBudget > 0 ? (totalSar / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalSar;

  const getStatusColor = (pct: number) => {
    if (pct >= 100) return colors.danger;
    if (pct >= 80) return colors.warning;
    return colors.success;
  };

  if (loadingBudgets) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <MonthPicker month={month} year={year} onPrev={handlePrev} onNext={handleNext} />

      {/* Total Budget */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('budget.totalBudget')}</Text>

        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('budget.amountSar')}</Text>
          <TextInput
            style={[styles.budgetInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={totalBudgetInput}
            onChangeText={setTotalBudgetInput}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            textAlign="right"
          />
        </View>

        {totalBudget > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                {t('budget.spent')} {totalSar.toFixed(2)} / {totalBudget.toFixed(2)} {currencyConfig.primary.symbol}
              </Text>
              <Text style={[styles.pctBadge, { color: getStatusColor(totalPct) }]}>
                {totalPct.toFixed(0)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(totalPct, 100)}%`,
                    backgroundColor: getStatusColor(totalPct),
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.remaining,
                { color: totalRemaining >= 0 ? colors.success : colors.danger },
              ]}
            >
              {totalRemaining >= 0
                ? `${t('budget.remaining')} ${totalRemaining.toFixed(2)} ${currencyConfig.primary.symbol}`
                : `${t('budget.exceeded')} ${Math.abs(totalRemaining).toFixed(2)} ${currencyConfig.primary.symbol}`}
            </Text>
          </View>
        )}
      </View>

      {/* Category Budgets */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('budget.categoryBudget')}</Text>

        {categories.map(cat => {
          const spent = byCategory[cat.main]?.sar || 0;
          const budgetVal = parseFloat(categoryBudgets[cat.main] || '0');
          const pct = budgetVal > 0 ? (spent / budgetVal) * 100 : 0;
          const catColor = CATEGORY_COLORS[cat.main] || '#B0BEC5';

          return (
            <View key={cat.main} style={styles.catSection}>
              <View style={styles.catHeader}>
                <View style={styles.catNameRow}>
                  <View style={[styles.catDot, { backgroundColor: catColor }]} />
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.main}</Text>
                </View>
                <Text style={[styles.spentText, { color: colors.textSecondary }]}>
                  {spent.toFixed(2)} {currencyConfig.primary.symbol}
                </Text>
              </View>
              <TextInput
                style={[styles.catInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={categoryBudgets[cat.main] || ''}
                onChangeText={val =>
                  setCategoryBudgets(prev => ({ ...prev, [cat.main]: val }))
                }
                placeholder={t('budget.budgetSar')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                textAlign="right"
              />
              {budgetVal > 0 && (
                <View style={[styles.progressBar, { backgroundColor: colors.border, marginTop: 4 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: getStatusColor(pct),
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.tint, opacity: saving ? 0.6 : 1 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Ionicons name="save" size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>
          {saving ? t('common.saving') : t('budget.saveBudget')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: { fontSize: 14 },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: { marginTop: 12 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: { fontSize: 13 },
  pctBadge: { fontSize: 14, fontWeight: '700' },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  remaining: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  catSection: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 14, fontWeight: '600' },
  spentText: { fontSize: 13 },
  catInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
