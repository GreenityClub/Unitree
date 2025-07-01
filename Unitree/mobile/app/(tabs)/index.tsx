import React from 'react';
import { View } from 'react-native';
import HomeScreen from '../../src/screens/main/HomeScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { isTablet } from '../../src/utils/responsive';

export default function Home() {
  // For tablet, bypass ScreenLayout to allow full screen usage
  if (isTablet()) {
    return <HomeScreen />;
  }

  return (
    <ScreenLayout>
      <HomeScreen />
    </ScreenLayout>
  );
}
