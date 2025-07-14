import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

// Fallback colors in case theme is not loaded
const fallbackColors = {
  primaryDark: '#2E7D32',
  primaryLight: '#8BC34A',
  white: '#FFFFFF',
  gray400: '#9e9e9e',
};

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const loadingTextAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      const animationSequence = Animated.sequence([
        // Fade in and scale logo
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        // Slide up text
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        // Hold for a moment
        Animated.delay(1000),
      ]);

      animationSequence.start(() => {
        onAnimationComplete?.();
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, onAnimationComplete]);

  // Animate loading text
  useEffect(() => {
    const loadingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingTextAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingTextAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loadingAnimation.start();
  }, [loadingTextAnim]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar backgroundColor={theme.colors?.primaryDark || fallbackColors.primaryDark} barStyle="light-content" />
      
      {/* Background gradient effect */}
      <View style={styles.gradientBackground} />
      
      {/* Logo container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name and tagline */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>UniTree</Text>
        <Text style={styles.tagline}>Sprout to Forest</Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View style={{ opacity: loadingTextAnim }}>
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors?.primaryDark || fallbackColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors?.primaryDark || fallbackColors.primaryDark,
    opacity: 0.95,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors?.white || fallbackColors.white,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors?.primaryLight || fallbackColors.primaryLight,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors?.primaryLight || fallbackColors.primaryLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: theme.colors?.gray400 || fallbackColors.gray400,
    opacity: 0.6,
  },
});

export default SplashScreen; 