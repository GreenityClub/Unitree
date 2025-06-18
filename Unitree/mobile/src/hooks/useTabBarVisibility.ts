import { useRef, useEffect } from 'react';
import { useSharedValue, withTiming, withSpring, runOnJS, Easing } from 'react-native-reanimated';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface UseTabBarVisibilityOptions {
  inactivityTimeout?: number;
  scrollThreshold?: number;
}

export const useTabBarVisibility = (options: UseTabBarVisibilityOptions = {}) => {
  const {
    inactivityTimeout = 5000, // 5 seconds
    scrollThreshold = 10, // pixels
  } = options;

  const isVisible = useSharedValue(1);
  const lastScrollY = useRef(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);

  const hideTabBar = () => {
    'worklet';
    isVisible.value = withSpring(0, { 
      damping: 15,
      stiffness: 120,
      mass: 1.2,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001
    });
  };

  const showTabBar = () => {
    'worklet';
    isVisible.value = withSpring(1, { 
      damping: 12,
      stiffness: 150,
      mass: 0.8,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001
    });
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    inactivityTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        runOnJS(hideTabBar)();
      }
    }, inactivityTimeout);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;

    // Show tab bar when scrolling up or at the top
    if (scrollDelta < -scrollThreshold || currentScrollY <= 0) {
      runOnJS(showTabBar)();
    }
    // Hide tab bar when scrolling down (and not at the top)
    else if (scrollDelta > scrollThreshold && currentScrollY > scrollThreshold) {
      runOnJS(hideTabBar)();
    }

    lastScrollY.current = currentScrollY;
    
    // Reset inactivity timer on scroll
    runOnJS(resetInactivityTimer)();
  };

  const handleScrollBeginDrag = () => {
    isScrolling.current = true;
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
  };

  const handleScrollEndDrag = () => {
    isScrolling.current = false;
    resetInactivityTimer();
  };

  const handleTouchStart = () => {
    runOnJS(showTabBar)();
    runOnJS(resetInactivityTimer)();
  };

  // Initialize inactivity timer
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  return {
    isVisible,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleTouchStart,
    showTabBar,
    hideTabBar,
  };
}; 