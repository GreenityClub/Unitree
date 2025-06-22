# Notification Icon Guide

## Current Issue
The notification icon was showing as a green square because the original icon wasn't optimized for notifications.

## Solution Applied
1. **Copied UniTree logo** to `assets/images/notification-icon.png`
2. **Updated app.json configuration** to use the new notification icon:
   ```json
   [
     "expo-notifications",
     {
       "icon": "./assets/images/notification-icon.png",
       "color": "#2E7D32",
       "defaultChannel": "default",
       "sounds": []
     }
   ]
   ```
3. **Added Android-specific notification configuration**:
   ```json
   "android": {
     "notification": {
       "icon": "./assets/images/notification-icon.png",
       "color": "#2E7D32"
     }
   }
   ```

## Best Practices for Notification Icons

### Android Requirements
- **Size**: 24x24 dp (96x96 pixels at xxxhdpi)
- **Format**: PNG
- **Style**: Monochrome (white silhouette on transparent background)
- **Design**: Simple and recognizable at small sizes

### iOS Requirements
- **Size**: Various sizes (20x20, 29x29, 40x40, 60x60 pts)
- **Format**: PNG
- **Style**: Can be full color
- **Design**: Simple and clear

## If Issues Persist

If the notification icon still shows as a green square:

1. **Create a monochrome version**:
   - Convert the logo to white silhouette
   - Remove all colors except white/transparent
   - Save as PNG with transparency

2. **Use online tools**:
   - [Notification Icon Generator](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)
   - Convert your logo to proper notification icon format

3. **Rebuild the app**:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

## Testing
- Test notifications on both Android and iOS
- Check different notification types (push, local, scheduled)
- Verify icon appears correctly in notification drawer 