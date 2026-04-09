import { translate } from '../lib/i18n';

export function useT() {
  return (key: string, vars?: Record<string, string | number>) => translate(key, vars);
}

export function useIsRTL(): boolean {
  return false;
}
