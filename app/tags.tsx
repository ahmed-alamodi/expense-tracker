import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { isConfigured } from '@/lib/supabase';
import { getTags, createTag, updateTag, deleteTag } from '@/lib/database';
import { Tag } from '@/types/expense';

const TAG_COLORS = [
  '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED',
  '#DB2777', '#0891B2', '#4F46E5', '#EA580C', '#16A34A',
];

export default function TagsScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getTags();
      setTags(data);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTags(); }, []));

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedColor(TAG_COLORS[0]);
    setEditingTag(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setDescription(tag.description || '');
    setSelectedColor(tag.color);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.warning'), t('tags.enterName'));
      return;
    }
    setSaving(true);
    try {
      if (editingTag) {
        await updateTag(editingTag.id, {
          name: name.trim(),
          description: description.trim() || null,
          color: selectedColor,
        });
      } else {
        await createTag({
          name: name.trim(),
          description: description.trim() || null,
          color: selectedColor,
          start_date: null,
          end_date: null,
          is_active: true,
        });
      }
      setShowForm(false);
      resetForm();
      fetchTags();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert(t('common.delete'), `${t('common.delete')} "${tag.name}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTag(tag.id);
            fetchTags();
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tags.manageTags')}</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {tags.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('tags.noTags')}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {t('tags.noTagsHint')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.tint }]}
              onPress={openAdd}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyAddBtnText}>{t('tags.addTag')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tags.map(tag => (
            <TouchableOpacity
              key={tag.id}
              style={[styles.tagCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/tag-stats/${tag.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.tagColorBar, { backgroundColor: tag.color }]} />
              <View style={styles.tagContent}>
                <View style={styles.tagTop}>
                  <Text style={[styles.tagName, { color: colors.text }]}>{tag.name}</Text>
                  <View style={styles.tagActions}>
                    <TouchableOpacity onPress={() => openEdit(tag)} hitSlop={8}>
                      <Ionicons name="pencil-outline" size={18} color={colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(tag)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {tag.description ? (
                  <Text style={[styles.tagDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {tag.description}
                  </Text>
                ) : null}
                <Text style={[styles.tagViewStats, { color: colors.tint }]}>
                  {t('tags.viewStats')} →
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.formOverlay}>
          <View style={[styles.formSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingTag ? t('tags.editTag') : t('tags.addTag')}
              </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { color: colors.text }]}>{t('tags.tagName')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder={t('tags.tagNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
                autoFocus
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('tags.tagDescription')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('tags.tagDescPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlign="right"
                textAlignVertical="top"
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('tags.tagColor')}</Text>
              <View style={styles.colorRow}>
                {TAG_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorCircleSelected,
                    ]}
                    onPress={() => setSelectedColor(c)}
                  >
                    {selectedColor === c && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.tint, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>
                  {saving ? t('common.saving') : t('common.save')}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  tagCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tagColorBar: { width: 5 },
  tagContent: { flex: 1, padding: 14 },
  tagTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagName: { fontSize: 16, fontWeight: '700', flex: 1 },
  tagActions: { flexDirection: 'row', gap: 12 },
  tagDesc: { fontSize: 13, marginTop: 4 },
  tagViewStats: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 46,
  },
  textArea: { minHeight: 80 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
