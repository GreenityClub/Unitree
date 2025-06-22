import React from 'react';
import UserSettingsScreen from '../../src/screens/main/UserSettingsScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Stack } from 'expo-router';

export default function UserSettings() {
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: false,
      }} />
      <ScreenLayout>
        <UserSettingsScreen />
      </ScreenLayout>
    </>
  );
} 