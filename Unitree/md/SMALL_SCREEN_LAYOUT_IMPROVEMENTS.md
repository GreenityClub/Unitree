# Small Screen Layout Improvements

## Overview
Enhanced the layout for smaller height devices (like iPhone 7, height ≤ 667px) by reducing header padding and adjusting mascot positioning to provide more space for the green content area in main screens.

## Changes Made

### 1. Added New Responsive Utility
**File**: `Unitree/mobile/src/utils/responsive.ts`
- Added `isSmallHeightDevice()` function to detect devices with height ≤ 667px (iPhone 7 and similar)

### 2. Updated Main Screens (Excluding Profile)

#### HomeScreen
- **Header Padding**: Reduced from `rs(90)` to `rs(60)` for small height devices
- **Mascot Position**: Moved from `rs(105)` to `rs(75)` for small height devices

#### PointsScreen
- **Header Padding**: Reduced from `rs(90)` to `rs(60)` for small height devices
- **Mascot Position**: Moved from `rs(105)` to `rs(75)` for small height devices

#### TreesScreen
- **Header Padding**: Reduced from `rs(90)` to `rs(60)` for small height devices
- **Mascot Position**: Moved from `rs(105)` to `rs(75)` for small height devices

#### WifiStatusScreen
- **Header Padding**: Reduced from `rs(90)` to `rs(60)` for small height devices
- **Mascot Position**: Moved from `rs(105)` to `rs(75)` for small height devices

### 3. Profile Screen Unchanged
As requested, ProfileScreen maintains its original layout without modifications.

## Implementation Details

### Responsive Detection
```typescript
export const isSmallHeightDevice = (): boolean => SCREEN_HEIGHT <= 667;
```

### Header Padding Adjustment
```typescript
headerSection: {
  backgroundColor: '#B7DDE6', // or other header colors
  paddingBottom: isSmallHeightDevice() ? rs(60) : rs(90),
  paddingTop: rs(10),
},
```

### Mascot Position Adjustment
```typescript
mascotContainer: {
  position: 'absolute',
  right: rs(20),
  top: isSmallHeightDevice() ? rs(75) : rs(105),
  zIndex: 9999,
},
```

## Benefits

1. **More Content Space**: Increased green content area by 30px on small screens
2. **Better UX**: Improved usability on smaller devices like iPhone 7
3. **Maintained Design**: Preserves the original design intent on larger screens
4. **Consistent Implementation**: Applied uniformly across all main screens (except profile)

## Affected Devices

- **iPhone 7**: 375 × 667 px
- **iPhone 6s**: 375 × 667 px
- **iPhone SE (1st gen)**: 320 × 568 px
- Other devices with similar small height dimensions

## Testing Recommendations

1. Test on actual iPhone 7 device or simulator
2. Verify content visibility and scrolling behavior
3. Ensure mascot positioning doesn't overlap with content
4. Confirm ProfileScreen remains unchanged 