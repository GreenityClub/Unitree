import React from 'react';
import { View } from 'react-native';
import WifiStatusScreen from '../../src/screens/main/WifiStatusScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';

export default function Wifi() {
  return (
    <ScreenLayout>
      <WifiStatusScreen />
    </ScreenLayout>
  );
} 