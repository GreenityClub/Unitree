export const colors = {
  // Primary colors
  primary: '#4CAF50',
  primaryDark: '#2E7D32',
  primaryLight: '#8BC34A',
  
  // Secondary colors
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFB74D',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#f5f5f5',
  gray200: '#e0e0e0',
  gray300: '#bdbdbd',
  gray400: '#9e9e9e',
  gray500: '#757575',
  gray600: '#616161',
  gray700: '#424242',
  gray800: '#303030',
  gray900: '#212121',
  
  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textWhite: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#f9f9f9',
  backgroundGreen: '#2E7D32',
  
  // Border colors
  border: '#e0e0e0',
  borderFocused: '#4CAF50',
  borderError: '#f44336',
  
  // Tree colors
  treeSapling: '#8BC34A',
  treeYoung: '#4CAF50',
  treeMature: '#2E7D32',
  treeHealthy: '#4CAF50',
  treeWarning: '#FF9800',
  treeDanger: '#f44336',
} as const;

export type ColorKeys = keyof typeof colors; 