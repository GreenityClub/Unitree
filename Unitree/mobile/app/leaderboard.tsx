import React from 'react';
import LeaderboardScreen from '../src/screens/main/LeaderboardScreen';
import { ScreenLayout } from '../src/components/layout/ScreenLayout';
import { Stack } from 'expo-router';

export default function Leaderboard() {
  return (
    <ScreenLayout>
      <Stack.Screen options={{ 
        headerShown: false
      }} />
      <LeaderboardScreen />
    </ScreenLayout>
  );
} 