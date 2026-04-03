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
import { StyleSheet, ImageBackground, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BG = require('../assets/images/bg.png');

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="worlds" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="world-levels" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="tutorial" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="catalog" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
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
        <GestureHandlerRootView style={styles.root}>
          <ImageBackground
            source={BG}
            style={styles.bg}
            resizeMode="cover"
          >
            {/* Dark overlay so UI text remains readable over the artwork */}
            <View style={styles.overlay}>
              <RootLayoutNav />
            </View>
          </ImageBackground>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,11,18,0.74)',
  },
});
