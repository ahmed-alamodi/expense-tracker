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
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { useThemeColor } from '@/hooks/useThemeColor';
import { isConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  getExchangeRate,
  setExchangeRate,
  getPaymentMethods,
  setPaymentMethods,
} from '@/lib/storage';
import { getExpenses } from '@/lib/database';

export default function SettingsScreen() {
  const colors = useThemeColor();
  const { user, signOut } = useAuth();
  const [rate, setRate] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState('');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getExchangeRate();
      setRate(r.toString());
      const m = await getPaymentMethods();
      setMethods(m);
      setLoading(false);
    })();
  }, []);

  const handleSaveRate = async () => {
    const val = parseFloat(rate);
    if (isNaN(val) || val <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال سعر صرف صحيح');
      return;
    }
    await setExchangeRate(val);
    Alert.alert('تم', 'تم حفظ سعر الصرف');
  };

  const handleAddMethod = async () => {
    if (!newMethod.trim()) return;
    if (methods.includes(newMethod.trim())) {
      Alert.alert('تنبيه', 'طريقة الدفع موجودة بالفعل');
      return;
    }
    const updated = [...methods, newMethod.trim()];
    setMethods(updated);
    await setPaymentMethods(updated);
    setNewMethod('');
  };

  const handleRemoveMethod = async (method: string) => {
    Alert.alert('حذف', `حذف "${method}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const updated = methods.filter(m => m !== method);
          setMethods(updated);
          await setPaymentMethods(updated);
        },
      },
    ]);
  };

  const handleExport = async () => {
    if (!isConfigured) {
      Alert.alert('تنبيه', 'يرجى إعداد Supabase أولاً');
      return;
    }
    setExporting(true);
    try {
      const expenses = await getExpenses();
      if (expenses.length === 0) {
        Alert.alert('تنبيه', 'لا توجد مصاريف للتصدير');
        setExporting(false);
        return;
      }

      const rows = expenses.map(e => ({
        'التاريخ': e.date,
        'الفئة الرئيسية': e.main_category,
        'الفئة الفرعية': e.sub_category,
        'الوصف': e.description,
        'المبلغ (ر.س)': e.amount_sar,
        'المبلغ (يمني)': e.amount_ymr,
        'طريقة الدفع': e.payment_method,
        'ملاحظات': e.notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المصاريف');

      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
      const file = new File(Paths.cache, fileName);
      file.write(new Uint8Array(wbout));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'تصدير المصاريف',
        });
      } else {
        Alert.alert('تم', `تم حفظ الملف: ${fileName}`);
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل التصدير');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
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
      {/* Export */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="download-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>تصدير البيانات</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          تصدير جميع المصاريف كملف Excel
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
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exchange Rate */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>سعر الصرف</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          1 ريال سعودي = ؟ ريال يمني
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
            <Text style={styles.smallBtnText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>طرق الدفع</Text>
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
            placeholder="طريقة دفع جديدة"
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

      {/* App Info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={22} color={colors.tint} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>عن التطبيق</Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          تطبيق تتبع المصاريف - النسخة 1.0.0
        </Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          لتتبع مصاريفك الشهرية بالريال السعودي والريال اليمني
        </Text>
        {user && (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            الحساب: {user.email}
          </Text>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.danger }]}
        onPress={() => {
          Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'خروج',
              style: 'destructive',
              onPress: signOut,
            },
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.signOutText, { color: colors.danger }]}>
          تسجيل الخروج
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
    textAlign: 'right',
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
});
