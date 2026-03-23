import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTheme, ThemeMode } from '@/lib/theme-context';
import { useLanguage, Language } from '@/lib/language-context';
import { isConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getExpenses } from '@/lib/database';
import { useAppLock } from '@/lib/app-lock-context';
import { useSettings } from '@/lib/settings-context';

export default function SettingsScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const { isLockEnabled, toggleLock } = useAppLock();
  const { exchangeRate, paymentMethods, currencyConfig, updateExchangeRate, updatePaymentMethods, updateCurrencyConfig, ready } = useSettings();
  const [rate, setRate] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (ready) {
      setRate(exchangeRate.toString());
      setMethods(paymentMethods);
    }
  }, [ready, exchangeRate, paymentMethods]);

  const handleSaveRate = async () => {
    const val = parseFloat(rate);
    if (isNaN(val) || val <= 0) {
      Alert.alert(t('common.error'), t('settings.invalidRate'));
      return;
    }
    await updateCurrencyConfig({ ...currencyConfig, exchangeRate: val });
    Alert.alert(t('common.done'), t('settings.rateSaved'));
  };

  const handleAddMethod = async () => {
    if (!newMethod.trim()) return;
    if (methods.includes(newMethod.trim())) {
      Alert.alert(t('common.warning'), t('settings.methodExists'));
      return;
    }
    const updated = [...methods, newMethod.trim()];
    setMethods(updated);
    await updatePaymentMethods(updated);
    setNewMethod('');
  };

  const handleRemoveMethod = async (method: string) => {
    Alert.alert(t('common.delete'), `${t('common.delete')} "${method}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const updated = methods.filter(m => m !== method);
          setMethods(updated);
          await updatePaymentMethods(updated);
        },
      },
    ]);
  };

  const handleExport = async () => {
    if (!isConfigured) {
      Alert.alert(t('common.warning'), t('settings.setupSupabase'));
      return;
    }
    setExporting(true);
    try {
      const expenses = await getExpenses();
      if (expenses.length === 0) {
        Alert.alert(t('common.warning'), t('settings.noExpensesToExport'));
        setExporting(false);
        return;
      }

      const rows = expenses.map(e => ({
        [t('form.date')]: e.date,
        [t('form.mainCategory')]: e.main_category,
        [t('form.subCategory')]: e.sub_category,
        [t('form.description')]: e.description,
        [t('form.amountSar')]: e.amount_sar,
        [t('form.amountYmr')]: e.amount_ymr,
        [t('settings.exchangeRate')]: e.exchange_rate,
        [t('form.paymentMethod')]: e.payment_method,
        [t('form.notes')]: e.notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('home.expenses'));

      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
      const file = new File(Paths.cache, fileName);
      file.write(new Uint8Array(wbout));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: t('settings.exportDialogTitle'),
        });
      } else {
        Alert.alert(t('common.done'), `${t('settings.fileSaved')} ${fileName}`);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('settings.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const themeModes: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: t('settings.themeSystem') },
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
  ];

  const languages: { key: Language; label: string }[] = [
    { key: 'ar', label: 'العربية' },
    { key: 'en', label: 'English' },
  ];

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Theme */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="color-palette-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
        </View>
        <View style={[styles.segmented, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {themeModes.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.segmentedBtn,
                themeMode === item.key && { backgroundColor: colors.tint },
              ]}
              onPress={() => setThemeMode(item.key)}
            >
              <Text
                style={[
                  styles.segmentedText,
                  { color: themeMode === item.key ? '#FFF' : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="language-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.language')}</Text>
        </View>
        <View style={[styles.segmented, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {languages.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.segmentedBtn,
                language === item.key && { backgroundColor: colors.tint },
              ]}
              onPress={() => setLanguage(item.key)}
            >
              <Text
                style={[
                  styles.segmentedText,
                  { color: language === item.key ? '#FFF' : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App Lock */}
      <TouchableOpacity
        style={[styles.card, styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={async () => {
          const success = await toggleLock();
          if (!success && !isLockEnabled) {
            Alert.alert(t('common.warning'), t('settings.appLockNotSupported'));
          }
        }}
      >
        <View style={styles.navCardContent}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.appLock')}</Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('settings.appLockDesc')}
          </Text>
        </View>
        <View style={[
          styles.lockToggle,
          { backgroundColor: isLockEnabled ? colors.tint : (colors.border || '#D1D5DB') },
        ]}>
          <View style={[
            styles.lockToggleKnob,
            isLockEnabled ? styles.lockToggleKnobOn : styles.lockToggleKnobOff,
          ]} />
        </View>
      </TouchableOpacity>

      {/* Export */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="download-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.exportData')}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          {t('settings.exportDesc')}
        </Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.tint, opacity: exporting ? 0.6 : 1 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="document-outline" size={18} color="#FFF" />
          )}
          <Text style={styles.actionBtnText}>
            {exporting ? t('settings.exporting') : t('settings.exportExcel')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Currency Configuration */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.currencies')}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          {t('settings.currenciesDesc')}
        </Text>

        <Text style={[styles.subLabel, { color: colors.text }]}>{t('settings.primaryCurrency')}</Text>
        <View style={styles.currencyRow}>
          <TextInput
            style={[styles.currencyInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={currencyConfig.primary.name}
            onChangeText={(val) => updateCurrencyConfig({ ...currencyConfig, primary: { ...currencyConfig.primary, name: val } })}
            placeholder={t('settings.currencyName')}
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
          />
          <TextInput
            style={[styles.currencySymbolInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={currencyConfig.primary.symbol}
            onChangeText={(val) => updateCurrencyConfig({ ...currencyConfig, primary: { ...currencyConfig.primary, symbol: val } })}
            placeholder={t('settings.currencySymbol')}
            placeholderTextColor={colors.textSecondary}
            textAlign="center"
          />
        </View>

        <Text style={[styles.subLabel, { color: colors.text }]}>{t('settings.secondaryCurrency')}</Text>
        <View style={styles.currencyRow}>
          <TextInput
            style={[styles.currencyInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={currencyConfig.secondary.name}
            onChangeText={(val) => updateCurrencyConfig({ ...currencyConfig, secondary: { ...currencyConfig.secondary, name: val } })}
            placeholder={t('settings.currencyName')}
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
          />
          <TextInput
            style={[styles.currencySymbolInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={currencyConfig.secondary.symbol}
            onChangeText={(val) => updateCurrencyConfig({ ...currencyConfig, secondary: { ...currencyConfig.secondary, symbol: val } })}
            placeholder={t('settings.currencySymbol')}
            placeholderTextColor={colors.textSecondary}
            textAlign="center"
          />
        </View>

        <Text style={[styles.subLabel, { color: colors.text }]}>{t('settings.exchangeRate')}</Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          1 {currencyConfig.primary.symbol} = ? {currencyConfig.secondary.symbol}
        </Text>
        <View style={styles.rateRow}>
          <TextInput
            style={[styles.rateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={rate}
            onChangeText={setRate}
            keyboardType="decimal-pad"
            textAlign="right"
          />
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.tint }]}
            onPress={handleSaveRate}
          >
            <Text style={styles.smallBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.paymentMethods')}</Text>
        </View>

        {methods.map(method => (
          <View key={method} style={[styles.methodRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.methodName, { color: colors.text }]}>{method}</Text>
            <TouchableOpacity onPress={() => handleRemoveMethod(method)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={newMethod}
            onChangeText={setNewMethod}
            placeholder={t('settings.newPaymentMethod')}
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
          />
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.success }]}
            onPress={handleAddMethod}
          >
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Monthly Estimates */}
      <TouchableOpacity
        style={[styles.card, styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/estimates' as any)}
      >
        <View style={styles.navCardContent}>
          <View style={styles.cardHeader}>
            <Ionicons name="calculator-outline" size={22} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.monthlyEstimates')}</Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('settings.monthlyEstimatesDesc')}
          </Text>
        </View>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Categories Management */}
      <TouchableOpacity
        style={[styles.card, styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/categories' as any)}
      >
        <View style={styles.navCardContent}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={22} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.manageCategories')}</Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('settings.manageCategoriesDesc')}
          </Text>
        </View>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Tags Management */}
      <TouchableOpacity
        style={[styles.card, styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/tags' as any)}
      >
        <View style={styles.navCardContent}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetags-outline" size={22} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.manageTags')}</Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('settings.manageTagsDesc')}
          </Text>
        </View>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* App Info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.aboutApp')}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          {t('settings.appDesc')}
        </Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          {t('settings.appPurpose')}
        </Text>
        {user && (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('settings.account')} {user.email}
          </Text>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.danger }]}
        onPress={() => {
          Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('settings.signOut'),
              style: 'destructive',
              onPress: signOut,
            },
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.signOutText, { color: colors.danger }]}>
          {t('settings.signOut')}
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
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    marginBottom: 8,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  methodName: { fontSize: 15 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navCardContent: { flex: 1 },
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  currencySymbolInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  lockToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  lockToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  lockToggleKnobOn: {
    alignSelf: 'flex-end',
  },
  lockToggleKnobOff: {
    alignSelf: 'flex-start',
  },
});
