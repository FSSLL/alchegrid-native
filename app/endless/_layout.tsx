import { Stack } from 'expo-router';

const SCREEN_OPTS = { headerShown: false, contentStyle: { backgroundColor: 'transparent' } } as const;

export default function EndlessLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTS}>
      <Stack.Screen name="index" options={SCREEN_OPTS} />
      <Stack.Screen name="play" options={{ ...SCREEN_OPTS, animation: 'fade' }} />
    </Stack>
  );
}
