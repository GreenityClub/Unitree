export const spacing = {
  // Base spacing unit
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  
  // Component specific spacing
  component: {
    // Padding
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 12,
    paddingBase: 16,
    paddingLG: 20,
    paddingXL: 24,
    
    // Margin
    marginXS: 4,
    marginSM: 8,
    marginMD: 12,
    marginBase: 16,
    marginLG: 20,
    marginXL: 24,
    
    // Screen padding
    screenPadding: 20,
    screenPaddingVertical: 60,
    
    // Card spacing
    cardPadding: 20,
    cardMargin: 15,
    
    // Input spacing
    inputPadding: 15,
    inputMargin: 15,
    
    // Button spacing
    buttonPadding: 15,
    buttonMargin: 10,
  },
  
  // Layout spacing
  layout: {
    headerHeight: 100,
    tabBarHeight: 80,
    statusBarHeight: 44,
    bottomSafeArea: 34,
  },
} as const; 