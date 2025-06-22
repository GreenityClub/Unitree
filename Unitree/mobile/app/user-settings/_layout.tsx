import { Stack } from 'expo-router';

export default function UserSettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
} 