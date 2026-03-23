-- Run this SQL in your Supabase SQL Editor to create the tables

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount_sar DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_ymr DECIMAL(10, 2) NOT NULL DEFAULT 0,
  exchange_rate DECIMAL(10, 4) NOT NULL DEFAULT 410,
  payment_method TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Migration: add exchange_rate column if upgrading from older schema
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 4) NOT NULL DEFAULT 410;

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  UNIQUE(month, year, category, user_id)
);

-- Monthly estimates table (recurring/expected monthly costs per item)
CREATE TABLE IF NOT EXISTS monthly_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount_sar DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_ymr DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE monthly_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estimates"
  ON monthly_estimates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own estimates"
  ON monthly_estimates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates"
  ON monthly_estimates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimates"
  ON monthly_estimates FOR DELETE
  USING (auth.uid() = user_id);

-- Categories table (synced from local storage)
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

-- Tags table (trips, events, projects)
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

-- Add tag_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES tags(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(main_category);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);

-- Row Level Security (RLS) - Enable
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);
