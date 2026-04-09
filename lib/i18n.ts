import en from '../constants/translations/en';
import ar from '../constants/translations/ar';
import es from '../constants/translations/es';
import zh from '../constants/translations/zh';

export type Language = 'en' | 'ar' | 'es' | 'zh';

export const LANGUAGE_META: Record<Language, { label: string; flag: string; rtl: boolean }> = {
  en: { label: 'English',  flag: '🇬🇧', rtl: false },
  ar: { label: 'العربية', flag: '🇸🇦', rtl: true  },
  es: { label: 'Español',  flag: '🇪🇸', rtl: false },
  zh: { label: '中文',     flag: '🇨🇳', rtl: false },
};

const TRANSLATIONS: Record<Language, Record<string, string>> = { en, ar, es, zh };

export function translate(lang: Language, key: string, vars?: Record<string, string | number>): string {
  let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{{${k}}}`, String(v));
    }
  }
  return str;
}
