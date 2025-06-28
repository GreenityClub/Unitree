import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const Index = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔄 Auth state changed - User:', !!user, 'Loading:', isLoading);
    
    // Immediately redirect when auth state is ready
    if (!isLoading) {
      if (user) {
        console.log('✅ User authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ No user, navigating to login');
        router.replace('/auth/login');
      }
    }
  }, [user, isLoading]);

  // Return null as splash screen handles all loading display
  return null;
}

export default Index; 