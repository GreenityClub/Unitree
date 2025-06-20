import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';
import Animated, { 
  FadeIn,
  FadeOut 
} from 'react-native-reanimated';

const Index = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔄 Auth state changed - User:', !!user, 'Loading:', isLoading);
    
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

  // Show animated loading screen while checking auth
  return (
    <Animated.View 
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.container}
    >
      <Text variant="displayLarge" style={styles.loadingText}>
        UniTree
      </Text>
      <Text variant="titleMedium" style={styles.subtitle}>
        Loading...
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.white,
    marginBottom: 10,
  },
  subtitle: {
    color: theme.colors.textWhite,
  },
});

export default Index; 