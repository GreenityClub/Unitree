import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import SplashScreen from '../src/components/SplashScreen';

const Index = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔄 Index: Auth state changed - User:', !!user, 'Loading:', isLoading);
    
    if (!isLoading) {
      console.log('✅ Index: Loading finished, checking user state...');
      if (user) {
        console.log('✅ Index: User authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Index: No user, navigating to login');
        router.replace('/auth/login');
      }
    } else {
      console.log('⏳ Index: Still loading...');
    }
  }, [user, isLoading]);

  // Show SplashScreen while loading, otherwise render nothing (will redirect)
  if (isLoading) {
    return <SplashScreen />;
  }

  // Don't render anything when not loading (will redirect immediately)
  return null;
};

export default Index; 