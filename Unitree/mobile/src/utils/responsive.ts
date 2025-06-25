import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Device breakpoints
export const BREAKPOINTS = {
  mobile: 480,        // Mobile phones
  tablet: 768,        // iPad Mini/Air
  tabletLarge: 1024,  // iPad Pro
  desktop: 1200,      // Very large screens
} as const;

export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

// Device type detection
export const isSmallDevice = (): boolean => SCREEN_WIDTH < 350;
export const isSmallHeightDevice = (): boolean => SCREEN_HEIGHT <= 667;
export const isLargeDevice = (): boolean => SCREEN_WIDTH > 400;
export const isTablet = (): boolean => SCREEN_WIDTH >= BREAKPOINTS.tablet;
export const isTabletLarge = (): boolean => SCREEN_WIDTH >= BREAKPOINTS.tabletLarge;
export const isIpadMini = (): boolean => SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 820;
export const isIpadAir = (): boolean => SCREEN_WIDTH >= 820 && SCREEN_WIDTH < 1024;
export const isIpadPro = (): boolean => SCREEN_WIDTH >= 1024;

// Device type string
export const getDeviceType = (): 'phone' | 'tablet' | 'tabletLarge' => {
  if (isTabletLarge()) return 'tabletLarge';
  if (isTablet()) return 'tablet';
  return 'phone';
};

// Responsive font size with better tablet support
export const rf = (size: number, tabletSize?: number, tabletLargeSize?: number): number => {
  let finalSize = size;
  
  if (isTabletLarge() && tabletLargeSize !== undefined) {
    finalSize = tabletLargeSize;
  } else if (isTablet() && tabletSize !== undefined) {
    finalSize = tabletSize;
  } else if (isTablet()) {
    // Default tablet scaling: increase by 20-30%
    finalSize = size * 1.25;
  } else {
    // Mobile scaling
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    finalSize = size * scale;
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(finalSize));
};

// Responsive spacing with tablet support
export const rs = (size: number, tabletSize?: number, tabletLargeSize?: number): number => {
  let finalSize = size;
  
  if (isTabletLarge() && tabletLargeSize !== undefined) {
    finalSize = tabletLargeSize;
  } else if (isTablet() && tabletSize !== undefined) {
    finalSize = tabletSize;
  } else if (isTablet()) {
    // Default tablet scaling: increase by 50%
    finalSize = size * 1.5;
  } else {
    // Mobile scaling
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    finalSize = size * scale;
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(finalSize));
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

// Device specific values with tablet support
export const deviceValue = <T>(
  phoneSmall: T, 
  phoneMedium: T, 
  phoneLarge: T, 
  tablet?: T, 
  tabletLarge?: T
): T => {
  if (isTabletLarge() && tabletLarge !== undefined) return tabletLarge;
  if (isTablet() && tablet !== undefined) return tablet;
  if (SCREEN_WIDTH < 350) return phoneSmall;
  if (SCREEN_WIDTH < 400) return phoneMedium;
  return phoneLarge;
};

// Get image size based on screen with tablet support
export const getImageSize = (
  baseWidth: number, 
  baseHeight: number,
  tabletScale?: number,
  tabletLargeScale?: number
) => {
  let scale: number;
  
  if (isTabletLarge() && tabletLargeScale !== undefined) {
    scale = tabletLargeScale;
  } else if (isTablet() && tabletScale !== undefined) {
    scale = tabletScale;
  } else if (isTablet()) {
    scale = 1.8; // Default tablet scale
  } else {
    scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  }
  
  return {
    width: Math.round(baseWidth * scale),
    height: Math.round(baseHeight * scale),
  };
};

// Get responsive size based on device type
export const getResponsiveSize = (
  phoneSize: number, 
  tabletSize?: number, 
  tabletLargeSize?: number
): number => {
  if (isTabletLarge() && tabletLargeSize !== undefined) {
    return tabletLargeSize;
  }
  if (isTablet() && tabletSize !== undefined) {
    return tabletSize;
  }
  return phoneSize;
};

// Get maximum width for content on tablets (prevents overly wide layouts)
export const getMaxContentWidth = (): number => {
  if (isTabletLarge()) {
    return Math.min(SCREEN_WIDTH * 0.75, 800); // 75% of screen width or max 800px
  }
  if (isTablet()) {
    return Math.min(SCREEN_WIDTH * 0.8, 600); // 80% of screen width or max 600px
  }
  return SCREEN_WIDTH;
};

// Get responsive grid columns
export const getGridColumns = (baseColumns: number = 1): number => {
  if (isTabletLarge()) return Math.min(baseColumns * 3, 4);
  if (isTablet()) return Math.min(baseColumns * 2, 3);
  return baseColumns;
};

// Get responsive container padding
export const getContainerPadding = (): number => {
  if (isTabletLarge()) return rs(40);
  if (isTablet()) return rs(32);
  return rs(20);
};

// Get responsive modal width
export const getModalWidth = (): number => {
  if (isTabletLarge()) return Math.min(wp(60), 600);
  if (isTablet()) return Math.min(wp(70), 500);
  return wp(90);
};

// Get responsive card width for grid layouts
export const getCardWidth = (columns: number = 1): number => {
  const padding = getContainerPadding();
  const gap = rs(15);
  const availableWidth = SCREEN_WIDTH - (padding * 2);
  return Math.floor((availableWidth - (gap * (columns - 1))) / columns);
};

// Layout helpers for tablets
export const getLayoutConfig = () => {
  return {
    isTablet: isTablet(),
    isTabletLarge: isTabletLarge(),
    deviceType: getDeviceType(),
    maxContentWidth: getMaxContentWidth(),
    containerPadding: getContainerPadding(),
    columns: getGridColumns(),
  };
}; 