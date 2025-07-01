import React from 'react';
import PointsScreen from '../../src/screens/main/PointsScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { isTablet } from '../../src/utils/responsive';

export default function Points() {
  // For tablet, bypass ScreenLayout to allow full screen usage
  if (isTablet()) {
    return <PointsScreen />;
  }

  return (
    <ScreenLayout>
      <PointsScreen />
    </ScreenLayout>
  );
} 