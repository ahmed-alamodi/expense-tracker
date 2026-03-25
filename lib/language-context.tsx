import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nManager } from 'react-native';
import { alert } from '@/lib/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export type Language = 'ar' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'ar',
  setLanguage: () => {},
  isRTL: true,
});

const STORAGE_KEY = '@app_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation();
  const [language, setLanguageState] = useState<Language>((i18n.language as Language) || 'ar');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'ar' || val === 'en') {
        setLanguageState(val);
        i18n.changeLanguage(val);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    const needsRTLChange =
      (lang === 'ar' && !I18nManager.isRTL) ||
      (lang === 'en' && I18nManager.isRTL);

    AsyncStorage.setItem(STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
    setLanguageState(lang);

    if (needsRTLChange) {
      const isRTL = lang === 'ar';
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);

      alert(
        t('settings.languageChangeTitle'),
        t('settings.languageChangeMsg'),
        [{ text: t('common.ok') }]
      );
    }
  }, [i18n, t]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isRTL: language === 'ar',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
