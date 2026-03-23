-- ============================================
-- Migration: Run this in Supabase SQL Editor
-- This adds the new tables and columns needed
-- for categories sync, tags, and offline support
-- ============================================

-- 1. جدول الفئات (لحفظ الفئات في قاعدة البيانات)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  main_category TEXT NOT NULL,
  sub_categories TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- 2. جدول التصنيفات/الأحداث (رحلات، مشاريع، إلخ)
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#2563EB',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- 3. إضافة عمود tag_id لجدول المصاريف (لربط المصاريف بالتصنيفات)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES tags(id);
