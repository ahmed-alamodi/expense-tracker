import { useState, useEffect, useCallback } from 'react';
import { Expense } from '@/types/expense';
import { isConfigured } from '@/lib/supabase';
import * as db from '@/lib/database';

export function useExpenses(filters?: {
  month?: number;
  year?: number;
  mainCategory?: string;
  paymentMethod?: string;
  search?: string;
  limit?: number;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      setError('Supabase غير مُعَدّ');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await db.getExpenses(filters);
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [
    filters?.month,
    filters?.year,
    filters?.mainCategory,
    filters?.paymentMethod,
    filters?.search,
    filters?.limit,
  ]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, error, refresh: fetchExpenses };
}

export function useMonthlyTotal(month: number, year: number) {
  const [data, setData] = useState<{
    totalSar: number;
    totalYmr: number;
    byCategory: Record<string, { sar: number; ymr: number; count: number }>;
  }>({ totalSar: 0, totalYmr: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await db.getMonthlyTotal(month, year);
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...data, loading, refresh: fetch };
}
