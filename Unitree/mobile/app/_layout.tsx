import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { AuthProvider } from '../src/context/AuthContext';
import { WiFiProvider } from '../src/context/WiFiContext';
import { TabBarProvider } from '../src/context/TabBarContext';
import { BackgroundSyncProvider } from '../src/context/BackgroundSyncContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import ENV, { validateEnvironment } from '../src/config/env';
import { useEffect } from 'react';

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

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AuthProvider>
          <WiFiProvider>
            <BackgroundSyncProvider>
              <NotificationProvider>
                <TabBarProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack>
                      <Stack.Screen name="auth" options={{ headerShown: false }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="user-settings" options={{ headerShown: false }} />
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
    </GestureHandlerRootView>
  );
}
