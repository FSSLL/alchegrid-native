import Constants from 'expo-constants';

/**
 * Returns the single production API base URL used by all clients:
 * iOS players, Android players, the Replit dev preview, and anyone
 * publishing community levels. Everyone reads from and writes to the
 * same database through this one endpoint.
 *
 * The URL is read from app.json → extra.apiUrl so it is easy to
 * change without touching code.  The hardcoded fallback exists only
 * as a safety net if app.json is somehow not available at runtime.
 */
export function getApiBase(): string {
  const configured: string | undefined = Constants.expoConfig?.extra?.apiUrl;
  return (configured ?? 'https://workspace.almurekhe.replit.app').replace(/\/$/, '');
}
