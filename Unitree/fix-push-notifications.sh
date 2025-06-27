#!/bin/bash

# 🔔 Push Notification Production Fix Script
# Tự động khắc phục vấn đề push notification không hoạt động trên production app

set -e

echo "🔔 Push Notification Production Fix"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the mobile directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ Error: app.json not found. Please run this script from the mobile directory.${NC}"
    exit 1
fi

echo -e "${BLUE}📱 Checking current configuration...${NC}"

# Extract project IDs
EAS_PROJECT_ID=$(grep -o '"projectId": "[^"]*"' app.json | cut -d'"' -f4)
FIREBASE_PROJECT_ID=$(grep -o '"project_id": "[^"]*"' google-services.json | cut -d'"' -f4)

echo -e "${YELLOW}📋 Current Configuration:${NC}"
echo "   EAS Project ID: $EAS_PROJECT_ID"
echo "   Firebase Project ID: $FIREBASE_PROJECT_ID"

# Verify package names
ANDROID_PACKAGE=$(grep -o '"package": "[^"]*"' app.json | cut -d'"' -f4)
ANDROID_FIREBASE_PACKAGE=$(grep -o '"package_name": "[^"]*"' google-services.json | cut -d'"' -f4)

echo "   Android Package (app.json): $ANDROID_PACKAGE"
echo "   Android Package (Firebase): $ANDROID_FIREBASE_PACKAGE"

# Check for iOS bundle ID
if [ -f "GoogleService-Info.plist" ]; then
    IOS_BUNDLE_ID=$(grep -A1 "BUNDLE_ID" GoogleService-Info.plist | grep -o '<string>[^<]*</string>' | sed 's/<string>\|<\/string>//g')
    IOS_APP_JSON_BUNDLE=$(grep -o '"bundleIdentifier": "[^"]*"' app.json | cut -d'"' -f4)
    
    echo "   iOS Bundle ID (app.json): $IOS_APP_JSON_BUNDLE"
    echo "   iOS Bundle ID (Firebase): $IOS_BUNDLE_ID"
fi

echo ""
echo -e "${BLUE}🔧 Applying fixes...${NC}"

# 1. Clean cache and node_modules
echo -e "${YELLOW}🧹 Cleaning cache and dependencies...${NC}"
rm -rf node_modules
rm -rf .expo
npm cache clean --force
npm install

# 2. Clear EAS build cache
echo -e "${YELLOW}☁️ Clearing EAS build cache...${NC}"
npx eas build:clear-cache || echo "⚠️ Could not clear EAS cache (this is OK if not logged in)"

# 3. Prebuild to apply native changes
echo -e "${YELLOW}🔨 Prebuilding with clean slate...${NC}"
npx expo prebuild --clean --platform all

# 4. Check if Firebase files exist and are valid
echo -e "${BLUE}🔥 Verifying Firebase configuration...${NC}"

if [ ! -f "google-services.json" ]; then
    echo -e "${RED}❌ google-services.json not found!${NC}"
    echo -e "${YELLOW}📋 Please download it from Firebase Console:${NC}"
    echo "   1. Go to https://console.firebase.google.com/"
    echo "   2. Select your project"
    echo "   3. Project Settings > General"
    echo "   4. Download google-services.json for Android"
    echo "   5. Place it in the mobile directory"
    exit 1
fi

if [ ! -f "GoogleService-Info.plist" ]; then
    echo -e "${RED}❌ GoogleService-Info.plist not found!${NC}"
    echo -e "${YELLOW}📋 Please download it from Firebase Console:${NC}"
    echo "   1. Go to https://console.firebase.google.com/"
    echo "   2. Select your project"
    echo "   3. Project Settings > General"
    echo "   4. Download GoogleService-Info.plist for iOS"
    echo "   5. Place it in the mobile directory"
    exit 1
fi

# 5. Validate package names match
if [ "$ANDROID_PACKAGE" != "$ANDROID_FIREBASE_PACKAGE" ]; then
    echo -e "${RED}❌ Package name mismatch detected!${NC}"
    echo "   app.json: $ANDROID_PACKAGE"
    echo "   Firebase: $ANDROID_FIREBASE_PACKAGE"
    echo -e "${YELLOW}📋 Please ensure package names match exactly in both files.${NC}"
    exit 1
fi

if [ -f "GoogleService-Info.plist" ] && [ "$IOS_APP_JSON_BUNDLE" != "$IOS_BUNDLE_ID" ]; then
    echo -e "${RED}❌ iOS Bundle ID mismatch detected!${NC}"
    echo "   app.json: $IOS_APP_JSON_BUNDLE"
    echo "   Firebase: $IOS_BUNDLE_ID"
    echo -e "${YELLOW}📋 Please ensure bundle IDs match exactly in both files.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration validation passed!${NC}"

# 6. Build production app
echo -e "${BLUE}🏗️ Building production app...${NC}"
echo -e "${YELLOW}📋 Choose platform to build:${NC}"
echo "1) Android only"
echo "2) iOS only"
echo "3) Both platforms"
echo "4) Skip build (just fix configuration)"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${YELLOW}🤖 Building Android production...${NC}"
        npx eas build --platform android --profile production
        ;;
    2)
        echo -e "${YELLOW}🍎 Building iOS production...${NC}"
        npx eas build --platform ios --profile production
        ;;
    3)
        echo -e "${YELLOW}📱 Building both platforms...${NC}"
        npx eas build --platform all --profile production
        ;;
    4)
        echo -e "${YELLOW}⏭️ Skipping build...${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Skipping build.${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Push Notification Fix Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Install the new production build on your device"
echo "2. Test push notifications using the app's notification settings"
echo "3. Check server logs to verify token registration"
echo ""
echo -e "${YELLOW}🧪 To test the notification system:${NC}"
echo "   • Open the app → Profile → User Settings → Notification Settings"
echo "   • Tap 'Run Full System Test' to verify everything works"
echo "   • Test individual notification types"
echo ""
echo -e "${BLUE}📖 For detailed troubleshooting, see:${NC}"
echo "   PUSH_NOTIFICATION_PRODUCTION_FIX.md"
echo ""
echo -e "${GREEN}✅ Good luck!${NC}" 