import React from 'react';
import TreesScreen from '../../src/screens/main/TreesScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { isTablet } from '../../src/utils/responsive';

export default function Trees() {
  // For tablet, bypass ScreenLayout to allow full screen usage
  if (isTablet()) {
    return <TreesScreen />;
  }

  return (
    <ScreenLayout>
      <TreesScreen />
    </ScreenLayout>
  );
} 