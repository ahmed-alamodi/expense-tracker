import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xwjxvkdyiaggteeyxszy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3anh2a2R5aWFnZ3RlZXl4c3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzA0NzksImV4cCI6MjA4OTAwNjQ3OX0._HdEnmtgUs3w17wixY5rVssH5RWpd_5gMSm98tNXjRM';

const isConfigured = supabaseUrl.startsWith('http');

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    if (!isConfigured) {
      throw new Error(
        'Supabase غير مُعَدّ. يرجى تعديل ملف lib/supabase.ts وإضافة الـ URL والـ Key الخاص بمشروعك على supabase.com'
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export { isConfigured };
