import React from 'react';
import UserSettingsScreen from '../src/screens/main/UserSettingsScreen';
import { ScreenLayout } from '../src/components/layout/ScreenLayout';
import { Stack } from 'expo-router';

export default function UserSettings() {
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'User Settings',
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#fff',
        headerBackTitle: 'Back',
      }} />
      <ScreenLayout>
        <UserSettingsScreen />
      </ScreenLayout>
    </>
  );
} 