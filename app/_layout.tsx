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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BG = require('../assets/images/bg.png');

// Inject background CSS at module load time so there is no white flash on web.
// bg.png is placed in public/ and served statically at /bg.png by Expo's Metro server.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const _tag = document.createElement('style');
  _tag.id = 'alchegrid-bg';
  _tag.textContent = `
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body {
      overflow: hidden;
      background:
        linear-gradient(rgba(8,11,18,0.75), rgba(8,11,18,0.75)),
        url('/bg.png') center center / cover no-repeat;
    }
  `;
  document.head.appendChild(_tag);
}

SplashScreen.preventAutoHideAsync();

const TRANSPARENT_SCREEN = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
} as const;

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(tabs)" options={TRANSPARENT_SCREEN} />
      <Stack.Screen name="game" options={{ ...TRANSPARENT_SCREEN, animation: 'slide_from_right' }} />
      <Stack.Screen name="worlds" options={{ ...TRANSPARENT_SCREEN, animation: 'slide_from_right' }} />
      <Stack.Screen name="world-levels" options={{ ...TRANSPARENT_SCREEN, animation: 'slide_from_right' }} />
      <Stack.Screen name="tutorial" options={{ ...TRANSPARENT_SCREEN, animation: 'slide_from_right' }} />
      <Stack.Screen name="catalog" options={{ ...TRANSPARENT_SCREEN, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ ...TRANSPARENT_SCREEN, animation: 'slide_from_right' }} />
    </Stack>
  );
}

function AppRoot() {
  if (Platform.OS === 'web') {
    // On web, body CSS handles the background.
    // GestureHandlerRootView must be transparent so body CSS shows through.
    return (
      <GestureHandlerRootView style={styles.rootWeb}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    );
  }

  // Native: render the background image + tint overlay in React Native
  return (
    <GestureHandlerRootView style={styles.root}>
      <Image
        source={BG}
        style={StyleSheet.absoluteFill}
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

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

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
    backgroundColor: 'rgba(8,11,18,0.75)',
  },
  nav: {
    flex: 1,
  },
});
