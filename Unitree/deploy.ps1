# UniTree Deployment Script for Windows
# This script helps automate the deployment process for both mobile app and server

$ErrorActionPreference = "Stop"

Write-Host "🚀 UniTree Deployment Script (Windows)" -ForegroundColor Green
Write-Host "======================================"

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to deploy mobile app
function Deploy-Mobile {
    Write-Host "📱 Deploying Mobile App..." -ForegroundColor Blue
    
    if (-not (Test-Command "eas")) {
        Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
        npm install -g @expo/cli eas-cli
    }
    
    Set-Location "Unitree/mobile"
    
    Write-Host "Select deployment type:" -ForegroundColor Yellow
    Write-Host "1) Preview build (development)"
    Write-Host "2) Production build (Android)"
    Write-Host "3) Production build (iOS)"
    Write-Host "4) Production build (Both platforms)"
    Write-Host "5) Submit to stores"
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host "🔨 Building preview version..." -ForegroundColor Cyan
            npm run build:preview
        }
        "2" {
            Write-Host "🔨 Building production version for Android..." -ForegroundColor Cyan
            eas build --platform android --profile production
        }
        "3" {
            Write-Host "🔨 Building production version for iOS..." -ForegroundColor Cyan
            eas build --platform ios --profile production
        }
        "4" {
            Write-Host "🔨 Building production version for both platforms..." -ForegroundColor Cyan
            npm run build:production
        }
        "5" {
            Write-Host "📤 Submitting to stores..." -ForegroundColor Cyan
            Write-Host "Submit to which store?" -ForegroundColor Yellow
            Write-Host "1) Google Play Store"
            Write-Host "2) Apple App Store"
            Write-Host "3) Both stores"
            $storeChoice = Read-Host "Enter your choice (1-3)"
            
            switch ($storeChoice) {
                "1" { npm run submit:android }
                "2" { npm run submit:ios }
                "3" { 
                    npm run submit:android
                    npm run submit:ios
                }
                default { 
                    Write-Host "❌ Invalid choice" -ForegroundColor Red
                    return
                }
            }
        }
        default {
            Write-Host "❌ Invalid choice" -ForegroundColor Red
            Set-Location "../.."
            return
        }
    }
    
    Set-Location "../.."
    Write-Host "✅ Mobile app deployment completed!" -ForegroundColor Green
}

# Function to check server deployment status
function Test-Server {
    Write-Host "🖥️  Checking Server Status..." -ForegroundColor Blue
    
    $renderUrl = $env:RENDER_APP_URL
    if (-not $renderUrl) {
        Write-Host "⚠️  RENDER_APP_URL environment variable not set" -ForegroundColor Yellow
        Write-Host "Please set it to your Render app URL, e.g.:"
        Write-Host '$env:RENDER_APP_URL = "https://your-app.onrender.com"'
        return
    }
    
    $healthUrl = "$renderUrl/health"
    Write-Host "🔍 Checking health endpoint: $healthUrl" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
        Write-Host "✅ Server is healthy!" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 2)
    }
    catch {
        Write-Host "❌ Server health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Check your Render deployment logs"
    }
}

# Function to update mobile app API URL
function Update-ApiUrl {
    Write-Host "🔧 Updating Mobile App API URL..." -ForegroundColor Blue
    
    $renderUrl = $env:RENDER_APP_URL
    if (-not $renderUrl) {
        $renderUrl = Read-Host "Enter your Render app URL (e.g., https://your-app.onrender.com)"
    }
    
    # Update app.json with the new API URL
    Set-Location "Unitree/mobile"
    
    # Create backup
    Copy-Item "app.json" "app.json.backup"
    
    # Read and update the app.json file
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    $appJson.expo.extra.apiUrl = $renderUrl
    $appJson | ConvertTo-Json -Depth 10 | Set-Content "app.json"
    
    Write-Host "✅ Updated API URL to: $renderUrl" -ForegroundColor Green
    Write-Host "📱 Don't forget to rebuild your mobile app!" -ForegroundColor Yellow
    
    Set-Location "../.."
}

# Main menu
Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1) Deploy Mobile App (EAS Build)"
Write-Host "2) Check Server Status"
Write-Host "3) Update Mobile App API URL"
Write-Host "4) Full deployment (Server check + Mobile app)"
Write-Host "5) Exit"

$mainChoice = Read-Host "Enter your choice (1-5)"

switch ($mainChoice) {
    "1" {
        Deploy-Mobile
    }
    "2" {
        Test-Server
    }
    "3" {
        Update-ApiUrl
    }
    "4" {
        Write-Host "🔄 Starting full deployment process..." -ForegroundColor Cyan
        Test-Server
        Write-Host ""
        Update-ApiUrl
        Write-Host ""
        Deploy-Mobile
    }
    "5" {
        Write-Host "👋 Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan 