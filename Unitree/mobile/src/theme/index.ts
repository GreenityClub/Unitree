import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';

// Combined theme object
export const theme = {
  colors,
  typography,
  spacing,
} as const; 