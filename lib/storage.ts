import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_EXCHANGE_RATE, DEFAULT_PAYMENT_METHODS } from '@/constants/categories';

const KEYS = {
  EXCHANGE_RATE: '@exchange_rate',
  PAYMENT_METHODS: '@payment_methods',
};

export async function getExchangeRate(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEYS.EXCHANGE_RATE);
    return val ? parseFloat(val) : DEFAULT_EXCHANGE_RATE;
  } catch {
    return DEFAULT_EXCHANGE_RATE;
  }
}

export async function setExchangeRate(rate: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXCHANGE_RATE, rate.toString());
}

export async function getPaymentMethods(): Promise<string[]> {
  try {
    const val = await AsyncStorage.getItem(KEYS.PAYMENT_METHODS);
    return val ? JSON.parse(val) : DEFAULT_PAYMENT_METHODS;
  } catch {
    return DEFAULT_PAYMENT_METHODS;
  }
}

export async function setPaymentMethods(methods: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PAYMENT_METHODS, JSON.stringify(methods));
}

export function sarToYmr(sar: number, rate: number): number {
  return Math.round(sar * rate);
}

export function ymrToSar(ymr: number, rate: number): number {
  return parseFloat((ymr / rate).toFixed(2));
}
