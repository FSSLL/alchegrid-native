import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns the base URL for the Alchegrid API server.
 *
 * • Native (iOS / Android): reads `extra.apiUrl` from app.json via expo-constants.
 *   This is the hardcoded production URL and always works on device.
 *
 * • Web (dev preview or production web build): derives the URL from
 *   window.location so the dev preview keeps talking to the local API server
 *   instead of the deployed production URL.
 */
export function getApiBase(): string {
  if (Platform.OS !== 'web') {
    const configured: string | undefined = Constants.expoConfig?.extra?.apiUrl;
    if (configured) return configured.replace(/\/$/, '');
  }

  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const h = window.location.hostname.replace('.expo.', '.');
      return `${window.location.protocol}//${h}`;
    }
  } catch {}
  return '';
}
