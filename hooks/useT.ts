import { usePlayerStore } from '../store/playerStore';
import { translate, type Language } from '../lib/i18n';

export function useT() {
  const language = usePlayerStore((s) => s.language);
  return (key: string, vars?: Record<string, string | number>) =>
    translate(language as Language, key, vars);
}

export function useIsRTL(): boolean {
  const language = usePlayerStore((s) => s.language);
  return language === 'ar';
}
