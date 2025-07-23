// Color palette based on provided template
export const colors = {
  // Base colors from the template
  lightGreen: '#A3DC9A', // rgb(163, 220, 154)
  yellowGreen: '#DEE791', // rgb(222, 231, 145)
  paleYellow: '#FFF9BD', // rgb(255, 249, 189)
  lightPeach: '#FFD6BA', // rgb(255, 214, 186)

  // Darker variants for hover states and text
  darkGreen: '#8ac382',
  darkYellowGreen: '#c5cd7d',
  darkPaleYellow: '#e6e0aa',
  darkPeach: '#e6c1a7',

  // Lighter variants for backgrounds
  lightestGreen: '#dbf1d7',
  lightestYellowGreen: '#f0f3d8',
  lightestPaleYellow: '#fffdf0',
  lightestPeach: '#fff0e8',

  // Neutral colors
  white: '#ffffff',
  black: '#333333',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Functional color assignments
export const themeColors = {
  primary: colors.lightGreen,
  secondary: colors.yellowGreen,
  tertiary: colors.paleYellow,
  accent: colors.lightPeach,
  
  primaryHover: colors.darkGreen,
  secondaryHover: colors.darkYellowGreen,
  tertiaryHover: colors.darkPaleYellow,
  accentHover: colors.darkPeach,
  
  background: colors.white,
  backgroundAlt: colors.lightestPaleYellow,
  backgroundLight: colors.lightestGreen,
  
  text: colors.black,
  textLight: colors.gray[600],
  textInverse: colors.white,
  
  success: colors.lightGreen,
  error: '#FF6B6B',
  warning: colors.paleYellow,
  info: colors.lightPeach,
};

export default themeColors; 