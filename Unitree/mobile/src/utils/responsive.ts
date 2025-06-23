import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

// Responsive font size
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive spacing
export const rs = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Width percentage
export const wp = (percentage: number): number => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// Height percentage
export const hp = (percentage: number): number => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// Device specific values
export const deviceValue = (small: number, medium: number, large: number): number => {
  if (SCREEN_WIDTH < 350) return small;
  if (SCREEN_WIDTH < 400) return medium;
  return large;
};

// Get image size based on screen
export const getImageSize = (baseWidth: number, baseHeight: number) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  return {
    width: Math.round(baseWidth * scale),
    height: Math.round(baseHeight * scale),
  };
};

// Check if device is small
export const isSmallDevice = (): boolean => SCREEN_WIDTH < 350;

// Check if device is iPhone 7 or similar small height devices
export const isSmallHeightDevice = (): boolean => SCREEN_HEIGHT <= 667;

// Check if device is large
export const isLargeDevice = (): boolean => SCREEN_WIDTH > 400; 