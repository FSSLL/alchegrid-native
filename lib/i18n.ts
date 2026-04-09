import en from '../constants/translations/en';

export function translate(key: string, vars?: Record<string, string | number>): string {
  let str = (en as Record<string, string>)[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{{${k}}}`, String(v));
    }
  }
  return str;
}
