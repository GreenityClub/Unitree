#!/bin/bash

# UniTree Deployment Script
# This script helps automate the deployment process for both mobile app and server

set -e  # Exit on any error

echo "🚀 UniTree Deployment Script"
echo "=========================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy mobile app
deploy_mobile() {
    echo "📱 Deploying Mobile App..."
    
    if ! command_exists eas; then
        echo "❌ EAS CLI not found. Installing..."
        npm install -g @expo/cli eas-cli
    fi
    
    cd Unitree/mobile
    
    echo "Select deployment type:"
    echo "1) Preview build (development)"
    echo "2) Production build (Android)"
    echo "3) Production build (iOS)"
    echo "4) Production build (Both platforms)"
    echo "5) Submit to stores"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            echo "🔨 Building preview version..."
            npm run build:preview
            ;;
        2)
            echo "🔨 Building production version for Android..."
            eas build --platform android --profile production
            ;;
        3)
            echo "🔨 Building production version for iOS..."
            eas build --platform ios --profile production
            ;;
        4)
            echo "🔨 Building production version for both platforms..."
            npm run build:production
            ;;
        5)
            echo "📤 Submitting to stores..."
            echo "Submit to which store?"
            echo "1) Google Play Store"
            echo "2) Apple App Store"
            echo "3) Both stores"
            read -p "Enter your choice (1-3): " store_choice
            
            case $store_choice in
                1) npm run submit:android ;;
                2) npm run submit:ios ;;
                3) npm run submit:android && npm run submit:ios ;;
                *) echo "❌ Invalid choice" ;;
            esac
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
    
    cd ../..
    echo "✅ Mobile app deployment completed!"
}

# Function to check server deployment status
check_server() {
    echo "🖥️  Checking Server Status..."
    
    if [ -z "$RENDER_APP_URL" ]; then
        echo "⚠️  RENDER_APP_URL environment variable not set"
        echo "Please set it to your Render app URL, e.g.:"
        echo "export RENDER_APP_URL=https://your-app.onrender.com"
        return 1
    fi
    
    echo "🔍 Checking health endpoint: $RENDER_APP_URL/health"
    
    if command_exists curl; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_APP_URL/health" || echo "000")
        if [ "$response" = "200" ]; then
            echo "✅ Server is healthy!"
            curl -s "$RENDER_APP_URL/health" | head -5
        else
            echo "❌ Server health check failed (HTTP $response)"
            echo "Check your Render deployment logs"
        fi
    else
        echo "ℹ️  curl not available, please check manually: $RENDER_APP_URL/health"
    fi
}

# Function to update mobile app API URL
update_api_url() {
    echo "🔧 Updating Mobile App API URL..."
    
    if [ -z "$RENDER_APP_URL" ]; then
        read -p "Enter your Render app URL (e.g., https://your-app.onrender.com): " RENDER_APP_URL
    fi
    
    # Update app.json with the new API URL
    cd Unitree/mobile
    
    # Create backup
    cp app.json app.json.backup
    
    # Update the API URL using sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|\"apiUrl\": \".*\"|\"apiUrl\": \"$RENDER_APP_URL\"|g" app.json
    else
        # Linux
        sed -i "s|\"apiUrl\": \".*\"|\"apiUrl\": \"$RENDER_APP_URL\"|g" app.json
    fi
    
    echo "✅ Updated API URL to: $RENDER_APP_URL"
    echo "📱 Don't forget to rebuild your mobile app!"
    
    cd ../..
}

# Main menu
echo ""
echo "What would you like to do?"
echo "1) Deploy Mobile App (EAS Build)"
echo "2) Check Server Status"
echo "3) Update Mobile App API URL"
echo "4) Full deployment (Server check + Mobile app)"
echo "5) Exit"

read -p "Enter your choice (1-5): " main_choice

case $main_choice in
    1)
        deploy_mobile
        ;;
    2)
        check_server
        ;;
    3)
        update_api_url
        ;;
    4)
        echo "🔄 Starting full deployment process..."
        check_server
        echo ""
        update_api_url
        echo ""
        deploy_mobile
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions" 