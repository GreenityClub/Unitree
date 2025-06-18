import React from 'react';
import TreeDetailScreen from '../src/screens/main/TreeDetailScreen';
import { Stack } from 'expo-router';

export default function TreeDetail() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TreeDetailScreen />
    </>
  );
}