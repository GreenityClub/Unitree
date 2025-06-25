import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import LoadingSplashScreen from '../components/LoadingSplashScreen';

// Import Navigators
import MainTabs from './MainTabs';
import AuthNavigator from './AuthNavigator';

// Additional Screens (not in tabs)
import TreeDetailScreen from '../screens/main/TreeDetailScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import UserSettingsScreen from '../screens/main/UserSettingsScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ForgotPasswordFromProfileScreen from '../screens/auth/ForgotPasswordFromProfileScreen';

// Types
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TreeDetail: { treeId: string };
  Leaderboard: undefined;
  UserSettingsScreen: undefined;
  NotificationSettingsScreen: undefined;
  Notifications: undefined;
  ForgotPasswordFromProfile: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && navigationRef.isReady()) {
      if (user) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      } else {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          })
        );
      }
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingSplashScreen />;
  }

  return (
    <Stack.Navigator 
      key={user ? 'authenticated' : 'unauthenticated'}
      initialRouteName={user ? "Main" : "Auth"}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary.dark,
        },
        headerTintColor: theme.colors.neutral.white,
        headerMode: 'screen',
        presentation: 'card',
      }}
    >
      {!user ? (
        // Auth Stack
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        // Main App Stack
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TreeDetail"
            component={TreeDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserSettingsScreen"
            component={UserSettingsScreen}
            options={{
              title: 'User Settings',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="NotificationSettingsScreen"
            component={NotificationSettingsScreen}
            options={{
              title: 'Notification Settings',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              title: 'Notifications',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="ForgotPasswordFromProfile"
            component={ForgotPasswordFromProfileScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 