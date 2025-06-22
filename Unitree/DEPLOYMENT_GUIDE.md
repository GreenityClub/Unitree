# UniTree Deployment Guide

This guide covers the complete deployment process for the UniTree application, including mobile app builds and server deployment.

## Prerequisites

### For Mobile App (EAS Build)
- Expo CLI and EAS CLI installed globally
- Expo account with EAS subscription
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

### For Server (Render)
- Render account
- MongoDB Atlas cluster configured
- GitHub repository connected to Render

---

## 1. Mobile App Deployment (EAS Build)

### Setup EAS CLI
```bash
npm install -g @expo/cli eas-cli
eas login
```

### Initial Setup (First Time Only)
```bash
cd Unitree/mobile
eas build:configure
```

### Building for Development/Testing
```bash
# Build development version
npm run build:preview

# Build for specific platform
npm run build:android
npm run build:ios
```

### Building for Production
```bash
# Build for both platforms
npm run build:production

# Or build specific platform
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Store Submission
```bash
# Submit to stores (after production build)
npm run submit:android
npm run submit:ios
```

### Important Configuration Notes
- **API URL**: Update `apiUrl` in `app.json` to your deployed server URL
- **Credentials**: EAS will handle signing certificates automatically
- **App Store Connect**: Update the submit configuration in `eas.json` with your Apple ID and app details
- **Google Play**: Add your service account JSON file for Android submissions

---

## 2. Server Deployment (Render)

### Method 1: Using Render Dashboard (Recommended)

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `Unitree/server` directory as the root

2. **Configure Service**
   - **Name**: `unitree-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Choose based on your needs

3. **Environment Variables**
   Set these in Render Dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-atlas-connection-string
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRE=7d
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
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

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Deploy with render.yaml**
   - The `render.yaml` file is already configured in the server directory
   - Push to your repository
   - In Render Dashboard, create a new "Blueprint" and connect your repo

2. **Update URLs**
   - After deployment, update the `CLIENT_URL` variables with your actual Render URL
   - Update the mobile app's `apiUrl` in `app.json`

---

## 3. Post-Deployment Configuration

### Update Mobile App API URL
After server deployment:
1. Update `Unitree/mobile/app.json`:
   ```json
   "extra": {
     "apiUrl": "https://your-actual-render-url.onrender.com"
   }
   ```
2. Rebuild and redeploy mobile app

### Server Environment Variables (Critical)
Ensure these are properly set in Render:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure, random string (32+ characters)
- `EMAIL_USER` & `EMAIL_PASSWORD`: For email verification features

### CORS Configuration
The server is configured to accept requests from multiple origins. Update the CORS configuration in production if needed.

---

## 4. Deployment Commands Reference

### Mobile App Commands
```bash
# Install EAS CLI
npm install -g @expo/cli eas-cli

# Login to Expo
eas login

# Configure EAS (first time)
eas build:configure

# Build commands
npm run build:preview      # Preview build
npm run build:production   # Production build
npm run build:android      # Android only
npm run build:ios         # iOS only
npm run build:all         # Both platforms

# Submit to stores
npm run submit:android     # Google Play Store
npm run submit:ios        # Apple App Store
```

### Server Commands
```bash
# Local development
npm run dev

# Production start
npm start

# Database operations
npm run seed-tree-types
npm run migrate
```

---

## 5. Monitoring and Maintenance

### Health Checks
- Server health endpoint: `https://your-app.onrender.com/health`
- Monitor server logs in Render Dashboard
- Check MongoDB Atlas metrics

### Updates and Deployments
- **Server**: Push to main branch triggers auto-deployment on Render
- **Mobile App**: Use EAS build commands for new versions
- **Database**: Run migration scripts when needed

---

## 6. Troubleshooting

### Common Issues

1. **Build Failures**
   - Check all required environment variables are set
   - Verify MongoDB connection string
   - Ensure all dependencies are listed in package.json

2. **Mobile App Issues**
   - Verify API URL is correct in app.json
   - Check EAS project ID matches your Expo account
   - Ensure proper certificates for iOS builds

3. **CORS Errors**
   - Update CORS origins in server configuration
   - Add your deployed URLs to the allowed origins

### Support
- Check server logs in Render Dashboard
- Use `eas build:list` to check build status
- Monitor MongoDB Atlas for database issues

---

## Security Checklist

- [ ] Strong JWT secret (32+ characters, random)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Environment variables secured in Render
- [ ] CORS origins restricted to your domains
- [ ] HTTPS enabled (automatic with Render)
- [ ] App signing certificates secured
- [ ] Email credentials use app-specific passwords

---

*Last updated: [Current Date]*
*For issues or questions, refer to the project documentation or contact the development team.* 