import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '../src/context/AuthContext';
import { WiFiProvider } from '../src/context/WiFiContext';
import { TabBarProvider } from '../src/context/TabBarContext';
import { BackgroundSyncProvider } from '../src/context/BackgroundSyncContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import ENV, { validateEnvironment } from '../src/config/env';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import BackgroundWifiService from '../src/services/BackgroundWifiService';

import { useColorScheme } from '@/hooks/useColorScheme';

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

  // Show loading screen while fonts are loading
  if (!loaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <WiFiProvider>
              <BackgroundSyncProvider>
                <NotificationProvider>
                  <TabBarProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <Stack>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
});
