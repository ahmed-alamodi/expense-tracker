import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getAppLockEnabled, setAppLockEnabled } from './storage';
import { useAppTheme } from './theme-context';

interface AppLockContextType {
  isLockEnabled: boolean;
  isLocked: boolean;
  toggleLock: () => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextType>({
  isLockEnabled: false,
  isLocked: false,
  toggleLock: async () => false,
});

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();

  const isDark = colorScheme === 'dark';
  const colors = {
    bg: isDark ? '#111827' : '#F3F4F6',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    tint: isDark ? '#60A5FA' : '#2563EB',
  };

  useEffect(() => {
    (async () => {
      const enabled = await getAppLockEnabled();
      setIsLockEnabled(enabled);
      if (enabled) {
        setIsLocked(true);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appState.current === 'background' &&
        nextState === 'active' &&
        isLockEnabled
      ) {
        hasAutoAuthenticated.current = false;
        setIsLocked(true);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isLockEnabled]);

  const authenticate = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('appLock.authPrompt'),
        fallbackLabel: t('appLock.usePasscode'),
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
      }
    } catch {
      // Keep locked on error
    }
  }, [t]);

  const hasAutoAuthenticated = useRef(false);

  useEffect(() => {
    if (ready && isLocked && !hasAutoAuthenticated.current) {
      hasAutoAuthenticated.current = true;
      authenticate();
    }
  }, [ready, isLocked, authenticate]);

  const toggleLock = useCallback(async (): Promise<boolean> => {
    if (!isLockEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('appLock.confirmEnable'),
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLockEnabled(true);
        await setAppLockEnabled(true);
        return true;
      }
      return false;
    } else {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('appLock.confirmDisable'),
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLockEnabled(false);
        await setAppLockEnabled(false);
        return true;
      }
      return false;
    }
  }, [isLockEnabled, t]);

  if (!ready) return null;

  return (
    <AppLockContext.Provider value={{ isLockEnabled, isLocked, toggleLock }}>
      {children}
      {isLocked && (
        <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.bg }]}>
          <View style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'lock-closed' : 'finger-print'}
                size={48}
                color={colors.tint}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('appLock.locked')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('appLock.lockedDesc')}
            </Text>
            <TouchableOpacity
              style={[styles.unlockBtn, { backgroundColor: colors.tint }]}
              onPress={authenticate}
            >
              <Ionicons name="lock-open-outline" size={20} color="#FFF" />
              <Text style={styles.unlockText}>{t('appLock.unlock')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AppLockContext.Provider>
  );
}

export const useAppLock = () => useContext(AppLockContext);

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  unlockText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
