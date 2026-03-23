import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { isConfigured } from '@/lib/supabase';
import { AppThemeProvider, useAppTheme } from '@/lib/theme-context';
import { LanguageProvider } from '@/lib/language-context';
import { AppLockProvider } from '@/lib/app-lock-context';
import { SettingsProvider } from '@/lib/settings-context';
import { NetworkProvider } from '@/lib/network-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563EB',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#60A5FA',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    border: '#374151',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <NetworkProvider>
            <SettingsProvider>
              <AppLockProvider>
                <RootLayoutNav />
              </AppLockProvider>
            </SettingsProvider>
          </NetworkProvider>
        </LanguageProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useAppTheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (loading) return;
    const currentSegment = segments[0] as string;

    if (!isConfigured) {
      if (currentSegment !== 'auth') {
        router.replace('/auth' as any);
      }
      return;
    }

    const inAuthPage = currentSegment === 'auth';

    if (!user && !inAuthPage) {
      router.replace('/auth' as any);
    } else if (user && inAuthPage) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="expense/[id]"
          options={{
            title: t('expenses.editExpense'),
            presentation: 'modal',
            headerShown: true,
          }}
        />
        <Stack.Screen name="tags" options={{ headerShown: false }} />
        <Stack.Screen
          name="tag-stats/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
