import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

interface Props {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthPicker({ month, year, onPrev, onNext }: Props) {
  const colors = useThemeColor();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={onNext} hitSlop={8}>
        <Ionicons name="chevron-forward" size={22} color={colors.tint} />
      </TouchableOpacity>
      <Text style={[styles.text, { color: colors.text }]}>
        {t(`months.${MONTH_KEYS[month - 1]}`)} {year}
      </Text>
      <TouchableOpacity onPress={onPrev} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
