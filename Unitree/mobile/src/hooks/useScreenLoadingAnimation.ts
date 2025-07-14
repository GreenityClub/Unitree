import { useEffect } from 'react';
import { useSharedValue, withSpring, withTiming, withDelay, withSequence, Easing } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const useScreenLoadingAnimation = () => {
  // Header animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  
  // Content animation values
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const contentScale = useSharedValue(0.95);

  // Loading state (using 1 for true, 0 for false)
  const isLoading = useSharedValue(1);

  const startLoadingAnimation = useCallback(() => {
    // Reset values
    headerOpacity.value = 0;
    headerTranslateY.value = -50;
    contentOpacity.value = 0;
    contentTranslateY.value = 30;
    contentScale.value = 0.95;
    isLoading.value = 1;

    // Start header animation
    headerOpacity.value = withDelay(100, withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    }));
    
    headerTranslateY.value = withDelay(100, withSpring(0, {
      damping: 15,
      stiffness: 120,
      mass: 1.0
    }));

    // Start content animation with delay
    contentOpacity.value = withDelay(300, withTiming(1, {
      duration: 700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    }));
    
    contentTranslateY.value = withDelay(300, withSpring(0, {
      damping: 12,
      stiffness: 100,
      mass: 0.8
    }));

    contentScale.value = withDelay(300, withSpring(1, {
      damping: 10,
      stiffness: 120,
      mass: 0.7
    }));

    // End loading state
    isLoading.value = withDelay(800, withTiming(0, { duration: 1 }));
  }, []);

  // Trigger animation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      startLoadingAnimation();
    }, [startLoadingAnimation])
  );

  return {
    headerAnimatedStyle: {
      opacity: headerOpacity,
      transform: [{ translateY: headerTranslateY }]
    },
    contentAnimatedStyle: {
      opacity: contentOpacity,
      transform: [
        { translateY: contentTranslateY },
        { scale: contentScale }
      ]
    },
    isLoading,
    startLoadingAnimation
  };
}; 