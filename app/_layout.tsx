import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts as useDMSansFonts,
} from '@expo-google-fonts/dm-sans';
import {
  SpaceMono_400Regular,
  useFonts as useSpaceMonoFonts,
} from '@expo-google-fonts/space-mono';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ALL_IMAGES } from '@/lib/preloadAssets';
import { StyleSheet, View, Image, Platform, useWindowDimensions, AppState } from 'react-native';
import { audioManager } from '@/lib/audioManager';
import { useAudioStore } from '@/store/audioStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BG = require('../assets/images/bg.jpg');

// React Navigation theme with fully transparent backgrounds so our own
// background (body CSS on web, Image on native) shows through every screen.
const TRANSPARENT_NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: 'transparent',
  },
};

// Web: inject CSS at module-load time (before React renders) so there is no
// white flash. bg.jpg lives in public/ and is served at /bg.jpg by Metro.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  if (!document.getElementById('alchegrid-bg')) {
    const tag = document.createElement('style');
    tag.id = 'alchegrid-bg';
    tag.textContent = `
      html, body, #root { height: 100%; margin: 0; padding: 0; }
      body {
        overflow: hidden;
        background:
          linear-gradient(rgba(8,11,18,0.72), rgba(8,11,18,0.72)),
          url('/bg.jpg') center center / cover no-repeat;
      }
    `;
    document.head.appendChild(tag);
  }
}

SplashScreen.preventAutoHideAsync();

const SCREEN_OPTS = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
} as const;

function RootLayoutNav() {
  return (
    <ThemeProvider value={TRANSPARENT_NAV_THEME}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index"  options={{ ...SCREEN_OPTS, animation: 'none' }} />
        <Stack.Screen name="intro"  options={{ ...SCREEN_OPTS, animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={SCREEN_OPTS} />
        <Stack.Screen name="game" options={{ ...SCREEN_OPTS, animation: 'slide_from_right' }} />
        <Stack.Screen name="worlds" options={{ ...SCREEN_OPTS, animation: 'slide_from_right' }} />
        <Stack.Screen name="world-levels" options={{ ...SCREEN_OPTS, animation: 'slide_from_right' }} />
        <Stack.Screen name="tutorial" options={{ ...SCREEN_OPTS, animation: 'slide_from_right' }} />
        <Stack.Screen name="catalog" options={{ ...SCREEN_OPTS, animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ ...SCREEN_OPTS, animation: 'slide_from_right' }} />
        <Stack.Screen name="endless" options={{ ...SCREEN_OPTS, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="hardcore" options={{ ...SCREEN_OPTS, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="community" options={{ ...SCREEN_OPTS, animation: 'slide_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}

function AppRoot() {
  const { width: sw, height: sh } = useWindowDimensions();

  if (Platform.OS === 'web') {
    // Body CSS provides the background; every React layer must be transparent.
    return (
      <GestureHandlerRootView style={styles.rootWeb}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Image
        source={BG}
        style={{ position: 'absolute', width: sw, height: sh, left: 0, top: 0 }}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={styles.nav}>
        <RootLayoutNav />
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [dmLoaded, dmError] = useDMSansFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const [monoLoaded, monoError] = useSpaceMonoFonts({ SpaceMono_400Regular });

  const ready = (dmLoaded || !!dmError) && (monoLoaded || !!monoError);

  // Kick off image preloading in the background immediately — does NOT block
  // the app from rendering. All 134 images get downloaded and cached while the
  // user sees the first screen, so they appear instantly on subsequent visits.
  useEffect(() => {
    Asset.loadAsync(ALL_IMAGES).catch(() => {});
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Audio manager — init once on mount, sync volume on store changes
  useEffect(() => {
    const { musicVolume, sfxVolume } = useAudioStore.getState();
    audioManager.init(musicVolume, sfxVolume).catch(() => {});

    const unsub = useAudioStore.subscribe((state) => {
      audioManager.setMusicVolume(state.musicVolume).catch(() => {});
      audioManager.setSfxVolume(state.sfxVolume).catch(() => {});
    });

    // Pause music when app goes to background
    const appSub = AppState.addEventListener('change', (nextState) => {
      if (Platform.OS === 'web') return;
      if (nextState === 'background' || nextState === 'inactive') {
        audioManager.setMusicVolume(0).catch(() => {});
      } else if (nextState === 'active') {
        audioManager.setMusicVolume(useAudioStore.getState().musicVolume).catch(() => {});
      }
    });

    return () => {
      unsub();
      appSub.remove();
      audioManager.unload().catch(() => {});
    };
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppRoot />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080b12',
  },
  rootWeb: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tint: {
    backgroundColor: 'rgba(8,11,18,0.72)',
  },
  nav: {
    flex: 1,
  },
});
