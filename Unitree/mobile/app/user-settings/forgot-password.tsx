import React from 'react';
import ForgotPasswordFromProfileScreen from '../../src/screens/main/ForgotPasswordFromProfileScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Stack } from 'expo-router';

export default function ForgotPasswordFromProfile() {
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: false,
      }} />
      <ScreenLayout>
        <ForgotPasswordFromProfileScreen />
      </ScreenLayout>
    </>
  );
} 