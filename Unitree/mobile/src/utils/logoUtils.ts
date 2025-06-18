import { Dimensions, PixelRatio } from 'react-native';
import { rs, rf, deviceValue } from './responsive';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device categories based on screen width
const isSmallDevice = screenWidth < 375;
const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
const isLargeDevice = screenWidth >= 414;

// Tablet detection
const isTablet = screenWidth >= 768;

export const getResponsiveLogoSizes = () => {
  if (isTablet) {
    return {
      // Tablet sizes - Both logos 50% bigger
      greenwichLogo: {
        width: rs(180),
        height: rs(75),
      },
      unitreeLogo: {
        width: rs(180),
        height: rs(75),
      },
      mascot: {
        width: rs(200),
        height: rs(200),
      },
    };
  } else if (isLargeDevice) {
    return {
      // Large phone sizes - Both logos 50% bigger
      greenwichLogo: {
        width: rs(165),
        height: rs(68),
      },
      unitreeLogo: {
        width: rs(165),
        height: rs(68),
      },
      mascot: {
        width: rs(170),
        height: rs(170),
      },
    };
  } else if (isMediumDevice) {
    return {
      // Medium phone sizes - Both logos 50% bigger
      greenwichLogo: {
        width: rs(150),
        height: rs(63),
      },
      unitreeLogo: {
        width: rs(150),
        height: rs(63),
      },
      mascot: {
        width: rs(160),
        height: rs(160),
      },
    };
  } else {
    return {
      // Small phone sizes - Both logos 50% bigger
      greenwichLogo: {
        width: rs(135),
        height: rs(57),
      },
      unitreeLogo: {
        width: rs(135),
        height: rs(57),
      },
      mascot: {
        width: rs(140),
        height: rs(140),
      },
    };
  }
};

export const getResponsiveLogoPositions = () => {
  if (isTablet) {
    return {
      // Both logos in horizontal container with better spacing
      logosContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: rs(20),
      },
      greenwichLogoContainer: {
        flex: 0,
      },
      unitreeLogoContainer: {
        flex: 0,
      },
      mascotContainer: {
        position: 'absolute' as const,
        right: rs(30),
        top: rs(-110),
        zIndex: 1,
      },
      // Special positioning for RegisterScreen mascot
      registerMascotContainer: {
        position: 'absolute' as const,
        right: rs(30),
        top: rs(120),
        zIndex: 9999,
      },
    };
  } else if (isLargeDevice) {
    return {
      // Both logos in horizontal container with better spacing
      logosContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: rs(10),

      },
      greenwichLogoContainer: {
        flex: 0,
      },
      unitreeLogoContainer: {
        flex: 0,
      },
      mascotContainer: {
        position: 'absolute' as const,
        right: rs(25),
        top: rs(-100),
        zIndex: 1,
      },
      // Special positioning for RegisterScreen mascot
      registerMascotContainer: {
        position: 'absolute' as const,
        right: rs(25),
        top: rs(110),
        zIndex: 9999,
      },
    };
  } else if (isMediumDevice) {
    return {
      // Both logos in horizontal container with better spacing
      logosContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: rs(10),

      },
      greenwichLogoContainer: {
        flex: 0,
      },
      unitreeLogoContainer: {
        flex: 0,
      },
      mascotContainer: {
        position: 'absolute' as const,
        right: rs(20),
        top: rs(-90),
        zIndex: 1,
      },
      // Special positioning for RegisterScreen mascot
      registerMascotContainer: {
        position: 'absolute' as const,
        right: rs(20),
        top: rs(105),
        zIndex: 9999,
      },
    };
  } else {
    return {
      // Both logos in horizontal container with better spacing
      logosContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: rs(10),
      },
      greenwichLogoContainer: {
        flex: 0,
      },
      unitreeLogoContainer: {
        flex: 0,
      },
      mascotContainer: {
        position: 'absolute' as const,
        right: rs(15),
        top: rs(-80),
        zIndex: 1,
      },
      // Special positioning for RegisterScreen mascot
      registerMascotContainer: {
        position: 'absolute' as const,
        right: rs(15),
        top: rs(95),
        zIndex: 9999,
      },
    };
  }
};

// Additional responsive spacing (removed git-related spacing)
export const getResponsiveSpacing = () => {
  if (isTablet) {
    return {
      greenwichLogoMarginBottom: rs(-15),
    };
  } else if (isLargeDevice) {
    return {
      greenwichLogoMarginBottom: rs(-12),
    };
  } else if (isMediumDevice) {
    return {
      greenwichLogoMarginBottom: rs(-10),
    };
  } else {
    return {
      greenwichLogoMarginBottom: rs(-8),
    };
  }
};

// Device info for debugging
export const getDeviceInfo = () => ({
  screenWidth,
  screenHeight,
  pixelRatio: PixelRatio.get(),
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
}); 