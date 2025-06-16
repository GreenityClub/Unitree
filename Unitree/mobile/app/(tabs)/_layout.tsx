import { Tabs, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../src/theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue 
} from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type {
  BottomTabNavigationEventMap,
  BottomTabDescriptorMap,
} from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import type {
  NavigationHelpers,
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/native';

type RouteNames = 'wifi' | 'points' | 'index' | 'trees' | 'profile';

interface TabConfig {
  icon: string;
  label: string;
}

type TabConfigMap = Record<RouteNames, TabConfig>;

interface Route {
  key: string;
  name: string;
}

interface CustomTabBarProps {
  state: TabNavigationState<ParamListBase>;
  descriptors: BottomTabDescriptorMap;
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
  insets: EdgeInsets;
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fef4ca',
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 52,
    width: '85%',
    maxWidth: 360,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 20,
    minWidth: 40,
    minHeight: 36,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelContainer: {
    marginLeft: 6,
  },
  tabLabel: {
    color: '#fef4ca',
    fontSize: 12,
    fontWeight: '600',
  }
});

interface AnimatedTabItemProps {
  route: Route;
  isFocused: boolean;
  config: TabConfig;
  onPress: () => void;
}

const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({ 
  route, 
  isFocused, 
  config, 
  onPress 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const pressScale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.05 : 1, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 200 });
    iconScale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 12,
      stiffness: 200,
    });
  }, [isFocused]);

  const handlePress = () => {
    pressScale.value = withSpring(0.9, { damping: 10, stiffness: 400 });
    setTimeout(() => {
      pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, 100);
    onPress();
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value }
    ],
    opacity: opacity.value,
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    backgroundColor: isFocused 
      ? withTiming('#8BC24A', { duration: 250 })
      : withTiming('transparent', { duration: 250 }),
    paddingHorizontal: isFocused 
      ? withSpring(12, { damping: 12, stiffness: 100 })
      : withSpring(8, { damping: 12, stiffness: 100 }),
    paddingVertical: isFocused 
      ? withSpring(8, { damping: 12, stiffness: 100 })
      : withSpring(6, { damping: 12, stiffness: 100 }),
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Default icon and label if config is undefined
  const iconName = config?.icon || 'help';
  const label = config?.label || route.name;

  return (
    <Animated.View style={animatedContainerStyle}>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.tabItem, animatedPillStyle]}>
          <Animated.View style={[styles.tabIconContainer, animatedIconStyle]}>
            <Icon
              name={iconName}
              size={20}
              color={isFocused ? '#fef4ca' : '#8BC24A'}
            />
          </Animated.View>
          {isFocused && (
            <Animated.View style={styles.tabLabelContainer}>
              <Text style={styles.tabLabel}>
                {label}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation, insets }) => {
  const tabConfig: TabConfigMap = {
    wifi: { icon: 'wifi', label: 'WiFi' },
    points: { icon: 'star', label: 'Points' },
    index: { icon: 'home', label: 'Home' },
    trees: { icon: 'tree', label: 'Trees' },
    profile: { icon: 'account', label: 'Profile' }
  };

  const tabBarOpacity = useSharedValue(0);
  const tabBarTranslateY = useSharedValue(100);

  useEffect(() => {
    tabBarOpacity.value = withTiming(1, { duration: 500 });
    tabBarTranslateY.value = withSpring(0, { 
      damping: 15, 
      stiffness: 100 
    });
  }, []);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    opacity: tabBarOpacity.value,
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  return (
    <Animated.View 
      style={[
        styles.tabBarContainer, 
        animatedTabBarStyle,
        {
          paddingBottom: insets.bottom + 10,
        }
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          const routeName = route.name as keyof TabConfigMap;
          const config = tabConfig[routeName];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedTabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              config={config}
              onPress={onPress}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="wifi"
        options={{
          title: 'WiFi',
        }}
      />
      <Tabs.Screen
        name="points"
        options={{
          title: 'Points',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="trees"
        options={{
          title: 'Trees',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
