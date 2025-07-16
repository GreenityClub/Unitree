# 🚀 UniTree Deployment Quick Start

This guide provides step-by-step instructions to deploy your UniTree application.

## Prerequisites Checklist

- [ ] Node.js installed (v18 or higher)
- [ ] Expo account created
- [ ] Render account created
- [ ] MongoDB Atlas cluster ready
- [ ] Apple Developer account (for iOS)
- [ ] Google Play Console account (for Android)

## Step 1: Server Deployment (Render)

### 1.1 Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Root Directory**: `Unitree/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 1.2 Set Environment Variables
In Render Dashboard, add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unitree?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
JWT_EXPIRE=7d
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
UNIVERSITY_IP_PREFIX=192.168
MIN_SESSION_DURATION=300
POINTS_PER_HOUR=60
TREE_COST=100
LOG_LEVEL=info
# For mobile apps, use * or leave empty
CLIENT_URL=*
CLIENT_DEV_URL=*
CLIENT_URL_DEV=*
CLIENT_URL_DEV_2=*
```

### 1.3 Deploy Server
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your server URL: `https://your-app-name.onrender.com`
4. Test health endpoint: `https://your-app-name.onrender.com/health`

## Step 2: Update Mobile App Configuration

### 2.1 Update API URL
Edit `Unitree/mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-actual-render-url.onrender.com"
    }
  }
}
```

### 2.2 Update EAS Configuration (Optional)
Edit `Unitree/mobile/eas.json` submit section with your details:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

## Step 3: Mobile App Deployment (EAS Build)

### 3.1 Install EAS CLI
```bash
npm install -g @expo/cli eas-cli
```

### 3.2 Login to Expo
```bash
eas login
```

### 3.3 Navigate to Mobile Directory
```bash
cd Unitree/mobile
```

### 3.4 Build Mobile App
For development/testing:
```bash
eas build --profile preview
```

For production:
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Both platforms
eas build --platform all --profile production
```

### 3.5 Submit to App Stores (Production)
```bash
# Google Play Store
eas submit --platform android

# Apple App Store
eas submit --platform ios
```

## Quick Commands Reference

### Server
```bash
# Check server health
curl https://your-app.onrender.com/health

# View logs (Render Dashboard)
# Go to your service → Logs
```

### Mobile App
```bash
# Build preview
npm run build:preview

# Build production
npm run build:production

# Submit to stores
npm run submit:android
npm run submit:ios
```

## Automated Deployment Scripts

### Windows (PowerShell)
```powershell
# Set your Render URL
$env:RENDER_APP_URL = "https://your-app.onrender.com"

# Run deployment script
.\deploy.ps1
```

### Mac/Linux (Bash)
```bash
# Set your Render URL
export RENDER_APP_URL="https://your-app.onrender.com"

# Run deployment script
./deploy.sh
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check environment variables in Render
   - Verify MongoDB connection string
   - Check logs in Render Dashboard

2. **Mobile build fails**
   - Ensure API URL is correct in app.json
   - Check EAS project ID
   - Verify Expo account permissions

3. **CORS errors**
   - Add your deployed URL to server CORS configuration
   - Update CLIENT_URL environment variables

### Getting Help

1. Check server logs: Render Dashboard → Your Service → Logs
2. Check mobile build logs: `eas build:list`
3. Test API endpoint: `https://your-app.onrender.com/health`

## Next Steps

1. [ ] Deploy server to Render
2. [ ] Update mobile app API URL
3. [ ] Build mobile app for testing
4. [ ] Test complete flow
5. [ ] Build production versions
6. [ ] Submit to app stores

## Security Reminders

- Use strong JWT secrets (32+ characters)
- Secure MongoDB Atlas with IP whitelisting
- Use app-specific passwords for email
- Don't commit sensitive data to Git

---

📖 **For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

🎯 **Ready to deploy? Start with Step 1 above!** 