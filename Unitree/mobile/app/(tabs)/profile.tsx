import React from 'react';
import ProfileScreen from '../../src/screens/main/ProfileScreen';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { isTablet } from '../../src/utils/responsive';

export default function Profile() {
  // For tablet, bypass ScreenLayout to allow full screen usage
  if (isTablet()) {
    return <ProfileScreen />;
  }

  return (
    <ScreenLayout>
      <ProfileScreen />
    </ScreenLayout>
  );
} 