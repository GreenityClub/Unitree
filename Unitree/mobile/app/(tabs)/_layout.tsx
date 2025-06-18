import { Tabs, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../src/theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolate,
  Easing
} from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { useTabBarContext } from '../../src/context/TabBarContext';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { 
  NavigationHelpers,
  ParamListBase,
  TabNavigationState
} from '@react-navigation/native';
import type { EventArg, EventMapBase } from '@react-navigation/native';

type BottomTabNavigationEventMap = EventMapBase & {
  tabPress: {
    data: undefined;
    canPreventDefault: true;
  };
};

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
  descriptors: Record<string, any>;
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
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    minHeight: 56,
    width: '88%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    scale.value = withSpring(isFocused ? 1.08 : 1, {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    });
    opacity.value = withTiming(1, { 
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    iconScale.value = withSpring(isFocused ? 1.15 : 1, {
      damping: 10,
      stiffness: 220,
      mass: 0.7,
    });
  }, [isFocused]);

  const handlePress = () => {
    // Quick press animation with bounce-back
    pressScale.value = withSpring(0.85, { 
      damping: 8, 
      stiffness: 500,
      mass: 0.5
    });
    setTimeout(() => {
      pressScale.value = withSpring(1.02, { 
        damping: 10, 
        stiffness: 400,
        mass: 0.6
      });
      setTimeout(() => {
        pressScale.value = withSpring(1, { 
          damping: 12, 
          stiffness: 300,
          mass: 0.8
        });
      }, 80);
    }, 50);
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
      ? withTiming('#8BC24A', { 
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        })
      : withTiming('transparent', { 
          duration: 200,
          easing: Easing.bezier(0.4, 0, 0.6, 1)
        }),
    paddingHorizontal: isFocused 
      ? withSpring(14, { damping: 10, stiffness: 120, mass: 0.8 })
      : withSpring(8, { damping: 12, stiffness: 100, mass: 0.9 }),
    paddingVertical: isFocused 
      ? withSpring(9, { damping: 10, stiffness: 120, mass: 0.8 })
      : withSpring(6, { damping: 12, stiffness: 100, mass: 0.9 }),
    shadowOpacity: isFocused 
      ? withTiming(0.3, { duration: 300 })
      : withTiming(0, { duration: 200 }),
    shadowRadius: isFocused 
      ? withSpring(4, { damping: 12, stiffness: 100 })
      : withSpring(0, { damping: 12, stiffness: 100 }),
    elevation: isFocused 
      ? withSpring(3, { damping: 12, stiffness: 100 })
      : withSpring(0, { damping: 12, stiffness: 100 }),
  }));

  // Create static shadow styles for focused/unfocused states
  const shadowStyle = isFocused ? {
    shadowColor: '#8BC24A',
    shadowOffset: { width: 0, height: 2 },
  } : {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
  };

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
        <Animated.View style={[styles.tabItem, animatedPillStyle, shadowStyle]}>
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
  const { isVisible } = useTabBarContext();
  const tabConfig: TabConfigMap = {
    wifi: { icon: 'wifi', label: 'WiFi' },
    points: { icon: 'star', label: 'Points' },
    index: { icon: 'home', label: 'Home' },
    trees: { icon: 'tree', label: 'Trees' },
    profile: { icon: 'account', label: 'Profile' }
  };

  const animatedTabBarStyle = useAnimatedStyle(() => {
    // Smooth interpolation for transform and opacity
    const translateY = interpolate(
      isVisible.value,
      [0, 1],
      [120, 0], // More pronounced slide effect
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      isVisible.value,
      [0, 0.3, 1],
      [0, 0.5, 1], // Smoother opacity transition
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      isVisible.value,
      [0, 0.5, 1],
      [0.85, 0.95, 1], // Subtle scale effect
      Extrapolate.CLAMP
    );

    // Enhanced shadow opacity for depth effect
    const shadowOpacity = interpolate(
      isVisible.value,
      [0, 1],
      [0, 0.25], // Dynamic shadow opacity
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateY },
        { scale }
      ],
      shadowOpacity,
    };
  });

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

            if (!isFocused) {
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

function TabsContent() {
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

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return <TabsContent />;
}
