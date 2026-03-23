import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = '@cache_';
const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export async function getCached<T>(key: string): Promise<{ data: T; stale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const stale = Date.now() - entry.timestamp > DEFAULT_MAX_AGE;
    return { data: entry.data, stale };
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Cache write failure is not critical
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // Ignore
  }
}

export async function invalidateCachePattern(prefix: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matching = keys.filter(k => k.startsWith(CACHE_PREFIX + prefix));
    if (matching.length > 0) {
      await AsyncStorage.multiRemove(matching);
    }
  } catch {
    // Ignore
  }
}

export function expensesCacheKey(month: number, year: number): string {
  return `expenses_${year}_${month}`;
}

export function monthlyTotalCacheKey(month: number, year: number): string {
  return `monthly_total_${year}_${month}`;
}

export function yearlyTotalsCacheKey(year: number): string {
  return `yearly_totals_${year}`;
}
