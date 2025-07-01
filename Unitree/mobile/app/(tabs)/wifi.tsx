import React from 'react';
import { View } from 'react-native';
import WifiStatusScreen from '../../src/screens/main/WifiStatusScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { isTablet } from '../../src/utils/responsive';

export default function Wifi() {
  // For tablet, bypass ScreenLayout to allow full screen usage
  if (isTablet()) {
    return <WifiStatusScreen />;
  }

  return (
    <ScreenLayout>
      <WifiStatusScreen />
    </ScreenLayout>
  );
} 