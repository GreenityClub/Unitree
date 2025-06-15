export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 18,
    normal: 22,
    relaxed: 24,
    loose: 28,
  },
  
  // Text styles
  heading: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
  },
  
  // Body text styles
  body: {
    large: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 26,
    },
    base: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    xs: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
  },
  
  // Button text styles
  button: {
    large: {
      fontSize: 18,
      fontWeight: '600' as const,
    },
    medium: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    small: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
  },
  
  // Caption and helper text
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  
  // Label text
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
} as const; 