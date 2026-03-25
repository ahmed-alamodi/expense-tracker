import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface Filters {
  search: string;
  mainCategory: string;
  paymentMethod: string;
}

interface Props {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categoryNames?: string[];
  paymentMethods?: string[];
}

export default function SearchFilter({ filters, onFiltersChange, categoryNames = [], paymentMethods = [] }: Props) {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const hasActiveFilters = !!(filters.mainCategory || filters.paymentMethod);

  const clearFilters = () => {
    onFiltersChange({ search: '', mainCategory: '', paymentMethod: '' });
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    items: string[],
    onSelect: (item: string) => void,
    title: string,
    currentValue: string
  ) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[t('filter.all'), ...items]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isAll = item === t('filter.all');
              const isSelected = isAll ? !currentValue : item === currentValue;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onSelect(isAll ? '' : item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { color: isSelected ? colors.tint : colors.text },
                      isSelected && styles.modalItemSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={filters.search}
          onChangeText={text => onFiltersChange({ ...filters, search: text })}
          placeholder={t('filter.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          textAlign="right"
          returnKeyType="search"
        />
        {filters.search ? (
          <TouchableOpacity
            onPress={() => onFiltersChange({ ...filters, search: '' })}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: filters.mainCategory ? colors.tint : colors.card,
              borderColor: filters.mainCategory ? colors.tint : colors.border,
            },
          ]}
          onPress={() => setShowCatPicker(true)}
        >
          <Text
            style={[
              styles.chipText,
              { color: filters.mainCategory ? '#FFF' : colors.text },
            ]}
          >
            {filters.mainCategory || t('filter.category')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={filters.mainCategory ? '#FFF' : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: filters.paymentMethod ? colors.tint : colors.card,
              borderColor: filters.paymentMethod ? colors.tint : colors.border,
            },
          ]}
          onPress={() => setShowPaymentPicker(true)}
        >
          <Text
            style={[
              styles.chipText,
              { color: filters.paymentMethod ? '#FFF' : colors.text },
            ]}
          >
            {filters.paymentMethod || t('filter.paymentMethod')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={filters.paymentMethod ? '#FFF' : colors.textSecondary}
          />
        </TouchableOpacity>
        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.danger, borderColor: colors.danger }]}
            onPress={clearFilters}
          >
            <Ionicons name="close" size={14} color="#FFF" />
            <Text style={[styles.chipText, { color: '#FFF' }]}>{t('filter.clearFilters')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {renderPickerModal(
        showCatPicker,
        () => setShowCatPicker(false),
        categoryNames,
        cat => onFiltersChange({ ...filters, mainCategory: cat }),
        t('filter.filterByCategory'),
        filters.mainCategory
      )}
      {renderPickerModal(
        showPaymentPicker,
        () => setShowPaymentPicker(false),
        paymentMethods,
        method => onFiltersChange({ ...filters, paymentMethod: method }),
        t('filter.filterByPayment'),
        filters.paymentMethod
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalItemSelected: {
    fontWeight: '700',
  },
});
