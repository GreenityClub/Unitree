import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolateColor,
  useDerivedValue
} from 'react-native-reanimated';
import { theme } from '../theme';
import { TabBarProvider, useTabBarContext } from '../context/TabBarContext';

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

// Enhanced Tab Item Component
const AnimatedTabItem = ({ 
  route, 
  isFocused, 
  onPress, 
  iconName 
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  iconName: string;
}) => {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(0);
  const iconRotation = useSharedValue(0);

  // Animate when focus changes
  React.useEffect(() => {
    if (isFocused) {
      // Icon animations with bounce effect
      iconScale.value = withSpring(1.3, {
        damping: 12,
        stiffness: 300,
      });
      backgroundOpacity.value = withTiming(1, { duration: 400 });
      // Rotation with overshoot for more dynamic feel
      iconRotation.value = withSpring(15, {
        damping: 8,
        stiffness: 150,
      });
    } else {
      iconScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      iconRotation.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
    }
  }, [isFocused]);

  // Handle press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.85, {
      damping: 20,
      stiffness: 500,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  // Container animation style
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Background pill animation style
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
    transform: [
      { 
        scale: withSpring(backgroundOpacity.value, {
          damping: 20,
          stiffness: 150,
        })
      }
    ],
  }));

  // Icon animation style
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));



  return (
    <Animated.View style={[containerStyle]}>
      <TouchableOpacity
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          position: 'relative',
        }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Background Pill with Glow */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 6,
              bottom: 6,
              left: 6,
              right: 6,
              backgroundColor: theme.colors.primary.main,
              borderRadius: 28,
              shadowColor: theme.colors.primary.main,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 12,
            },
            backgroundStyle,
          ]}
        />
        
        {/* Additional Glow Layer */}
        {isFocused && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: 4,
                right: 4,
                backgroundColor: 'transparent',
                borderRadius: 30,
                borderWidth: 2,
                borderColor: `${theme.colors.primary.main}40`,
              },
              backgroundStyle,
            ]}
          />
        )}
        
        {/* Animated Icon */}
        <Animated.View style={iconStyle}>
          <Icon
            name={iconName}
            size={24}
            color={isFocused ? '#FFFFFF' : theme.colors.text.secondary}
          />
        </Animated.View>


      </TouchableOpacity>
    </Animated.View>
  );
};

// Custom TabBar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { isVisible } = useTabBarContext();
  const [previousIndex, setPreviousIndex] = React.useState(state.index);

  // Track tab changes for staggered animations
  React.useEffect(() => {
    if (previousIndex !== state.index) {
      setPreviousIndex(state.index);
    }
  }, [state.index, previousIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: isVisible.value === 1 ? 0 : 100, // Slide down to hide
        },
      ],
      opacity: isVisible.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        animatedStyle,
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

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

        return (
          <AnimatedTabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            iconName={iconName}
          />
        );
      })}
    </Animated.View>
  );
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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

const MainTabs: React.FC = () => {
  return (
    <TabBarProvider>
      <TabNavigator />
    </TabBarProvider>
  );
};

export default MainTabs; 