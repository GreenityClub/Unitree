import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';

// Import Screens
import HomeScreen from '../screens/main/HomeScreen';
import PointsScreen from '../screens/main/PointsScreen';
import TreesScreen from '../screens/main/TreesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import WifiStatusScreen from '../screens/main/WifiStatusScreen';

export type MainTabParamList = {
  WifiStatus: undefined;
  Points: undefined;
  Home: undefined;
  Trees: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'WifiStatus':
              iconName = 'wifi';
              break;
            case 'Points':
              iconName = 'star';
              break;
            case 'Home':
              iconName = 'home';
              break;
            case 'Trees':
              iconName = 'tree';
              break;
            case 'Profile':
              iconName = 'account';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen 
        name="WifiStatus" 
        component={WifiStatusScreen}
        options={{ title: 'WiFi' }}
      />
      <Tab.Screen 
        name="Points" 
        component={PointsScreen}
        options={{ title: 'Points' }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Trees" 
        component={TreesScreen}
        options={{ title: 'Trees' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs; 