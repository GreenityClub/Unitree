import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Define the screen order based on navbar
const SCREEN_ORDER = ['wifi', 'points', 'index', 'trees', 'profile'] as const;
type ScreenName = typeof SCREEN_ORDER[number];

interface SwipeNavigationOptions {
  currentScreen: ScreenName;
  sensitivity?: number; // Minimum distance to trigger navigation
  velocityThreshold?: number; // Minimum velocity to trigger navigation
}

export const useSwipeNavigation = (options: SwipeNavigationOptions) => {
  const navigation = useNavigation();
  const { 
    currentScreen, 
    sensitivity = 50, 
    velocityThreshold = 500 
  } = options;

  const getCurrentIndex = useCallback(() => {
    return SCREEN_ORDER.indexOf(currentScreen);
  }, [currentScreen]);

  const navigateToScreen = useCallback((screenName: ScreenName) => {
    try {
      navigation.navigate(screenName as never);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

  const handleSwipeLeft = useCallback(() => {
    const currentIndex = getCurrentIndex();
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < SCREEN_ORDER.length) {
      const nextScreen = SCREEN_ORDER[nextIndex];
      console.log(`Swipe left: ${currentScreen} → ${nextScreen}`);
      navigateToScreen(nextScreen);
    }
  }, [currentScreen, getCurrentIndex, navigateToScreen]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = getCurrentIndex();
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevScreen = SCREEN_ORDER[prevIndex];
      console.log(`Swipe right: ${currentScreen} → ${prevScreen}`);
      navigateToScreen(prevScreen);
    }
  }, [currentScreen, getCurrentIndex, navigateToScreen]);

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      
      // Check if swipe meets minimum requirements
      const isSignificantSwipe = Math.abs(translationX) > sensitivity || 
                                Math.abs(velocityX) > velocityThreshold;
      
      if (!isSignificantSwipe) return;

      // Determine swipe direction and navigate
      if (translationX > 0) {
        // Swipe right (go to previous screen)
        runOnJS(handleSwipeRight)();
      } else {
        // Swipe left (go to next screen)
        runOnJS(handleSwipeLeft)();
      }
    })
    .activeOffsetX([-20, 20]) // Require at least 20px horizontal movement
    .failOffsetY([-50, 50]); // Fail if vertical movement is too much

  return {
    panGesture,
    canSwipeLeft: getCurrentIndex() < SCREEN_ORDER.length - 1,
    canSwipeRight: getCurrentIndex() > 0,
    currentIndex: getCurrentIndex(),
    totalScreens: SCREEN_ORDER.length,
  };
}; 