import { Stack } from 'expo-router';

const OPTS = { headerShown: false, contentStyle: { backgroundColor: 'transparent' } } as const;

export default function CommunityLayout() {
  return (
    <Stack screenOptions={OPTS}>
      <Stack.Screen name="index" options={OPTS} />
      <Stack.Screen name="test" options={{ ...OPTS, animation: 'slide_from_right' }} />
      <Stack.Screen name="play/[id]" options={{ ...OPTS, animation: 'slide_from_right' }} />
    </Stack>
  );
}
