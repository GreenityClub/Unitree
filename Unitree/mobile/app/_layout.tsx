import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { WiFiProvider } from '../src/context/WiFiContext';
import { TabBarProvider } from '../src/context/TabBarContext';
import { BackgroundSyncProvider } from '../src/context/BackgroundSyncContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import ENV, { validateEnvironment } from '../src/config/env';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import BackgroundWifiService from '../src/services/BackgroundWifiService';
import CustomSplashScreen from '../src/components/SplashScreen';

import { useColorScheme } from '@/hooks/useColorScheme';

function SplashScreenManager() {
  const { isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    // Only hide splash when both font loading and auth checking are complete
    if (!isLoading) {
      setShowSplash(false);
    }
  };

  // Hide splash when auth loading is complete
  useEffect(() => {
    if (!isLoading && !showSplash) {
      // Auth is ready, we can proceed
    }
  }, [isLoading]);

  if (showSplash || isLoading) {
    return (
      <CustomSplashScreen 
        onAnimationComplete={handleSplashComplete}
        isAuthLoading={isLoading}
      />
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Validate environment variables on app startup
    try {
      validateEnvironment();
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      // In production, you might want to show a proper error screen
      if (ENV.isDevelopment) {
        throw error; // Throw in development to catch issues early
      }
    }
  }, []);

  // Handle app termination events
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      // When app becomes inactive, it might be closing
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        // Note: Complete termination can't be reliably detected
        // but this helps with backgrounding scenarios
        console.log('App state changing to:', nextAppState);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function that may run when component unmounts (app closing)
    return () => {
      subscription?.remove();
      // This may execute during app termination
      console.log('RootLayout cleanup - app may be terminating');
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <SplashScreenManager />
            <WiFiProvider>
              <BackgroundSyncProvider>
                <NotificationProvider>
                  <TabBarProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <Stack>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                        <Stack.Screen name="user-settings" options={{ headerShown: false }} />
                        <Stack.Screen name="system-settings" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <StatusBar style="auto" />
                    </ThemeProvider>
                  </TabBarProvider>
                </NotificationProvider>
              </BackgroundSyncProvider>
            </WiFiProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
