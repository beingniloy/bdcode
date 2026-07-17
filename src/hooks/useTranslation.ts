import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import translations from '../translations';

/**
 * Returns a translation object `t` for the given namespace.
 * Use `t('someKey')` to get the translated string for the current language.
 *
 * For parameterised strings (e.g. `t('copyright', { year: 2026 })`),
 * the hook replaces `{key}` tokens in the translated template.
 */
export function useTranslation(namespace: keyof typeof translations) {
  const { language } = useSettings();

  return useMemo(() => {
    const dict = translations[namespace]?.[language === 'bn' ? 'bn' : 'en'] as Record<string, string> | undefined;

    if (!dict) {
      return (key: string, _params?: Record<string, string | number>) => key;
    }

    return (key: string, params?: Record<string, string | number>): string => {
      let value = dict[key];
      if (value === undefined) return key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    };
  }, [language, namespace]);
}
