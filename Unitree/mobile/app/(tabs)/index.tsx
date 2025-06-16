import React from 'react';
import { View } from 'react-native';
import HomeScreen from '../../src/screens/main/HomeScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';

export default function Home() {
  return (
    <ScreenLayout>
      <HomeScreen />
    </ScreenLayout>
  );
}
