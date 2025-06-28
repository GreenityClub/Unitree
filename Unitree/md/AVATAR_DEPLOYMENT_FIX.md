# Avatar Loading Fix for Render Deployment

This guide explains how to fix avatar loading issues when deploying to Render and provides cloud storage setup instructions.

## Problem

When deploying to Render, user avatars don't load because:
1. **Ephemeral Storage**: Render uses ephemeral file storage - uploaded files are lost on restart
2. **Static File Access**: Local file paths may not be correctly accessible via HTTP
3. **Deployment Resets**: Files are deleted during each deployment

## Solution Options

### Option 1: Quick Fix (Temporary)
Install dependencies and redeploy with the improved static file serving:

```bash
cd Unitree/server
npm install
git add .
git commit -m "Fix avatar serving on Render"
git push
```

This improves the static file serving but **files will still be lost on restart**.

### Option 2: Cloud Storage Setup (Recommended)

#### Step 1: Create Cloudinary Account
1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to your Dashboard
4. Copy your credentials:
   - Cloud Name
   - API Key  
   - API Secret

#### Step 2: Configure Environment Variables

**In Render Dashboard:**
1. Go to your service → Environment tab
2. Add these variables:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Replace with your actual Cloudinary credentials from the dashboard.**

#### Step 3: Install Dependencies & Deploy

```bash
cd Unitree/server
npm install cloudinary
git add .
git commit -m "Add cloud storage for avatars"
git push
```

#### Step 4: Test Avatar Upload
1. Open your app
2. Go to Profile screen
3. Upload a new avatar
4. Check server logs - should show "Avatar uploaded to cloud storage"

## How It Works

### With Cloud Storage (Recommended)
- ✅ Avatars uploaded to Cloudinary
- ✅ Persistent across deployments
- ✅ Fast CDN delivery
- ✅ Automatic image optimization
- ✅ 200x200 avatar resizing

### Without Cloud Storage (Fallback)
- ⚠️ Avatars stored locally
- ❌ Lost on deployment/restart
- ⚠️ Slower loading
- ⚠️ No optimization

## Verification

### Check Upload Response
When uploading an avatar, the API response should include:
```json
{
  "message": "Avatar uploaded successfully",
  "avatar": "https://res.cloudinary.com/...",
  "storage": "cloud"
}
```

### Check Server Logs
Look for these log messages:
```
✅ Avatar uploaded to cloud storage for user 123...
✅ Cloudinary configured successfully
❌ Cloudinary not configured - using local storage
```

## Migration Notes

### Existing Local Avatars
- Existing local avatars will continue to work until server restart
- Users will need to re-upload avatars after deployment
- Consider bulk migration script if needed

### URL Format Changes
- **Local**: `https://your-app.onrender.com/uploads/avatars/avatar-123.jpg`
- **Cloud**: `https://res.cloudinary.com/your-cloud/image/upload/v123/unitree/avatars/avatar-123.jpg`

## Troubleshooting

### Avatar Not Loading
1. **Check Network Tab** in browser dev tools
2. **Look for 404 errors** on avatar URLs
3. **Check server logs** for upload errors
4. **Verify Cloudinary credentials** are set correctly

### Upload Failing
1. **Check file size** (5MB limit)
2. **Check file format** (jpg, jpeg, png, gif only)
3. **Check server logs** for detailed error messages
4. **Verify network connection**

### Cloud Storage Not Working
1. **Verify credentials** in Render dashboard
2. **Check Cloudinary account** limits
3. **Redeploy service** after adding credentials
4. **Check server logs** for Cloudinary errors

## Benefits of Cloud Storage

### For Users
- ✅ Avatars persist across app updates
- ✅ Faster loading (CDN)
- ✅ Better image quality
- ✅ Works offline (cached)

### For Developers  
- ✅ No file management
- ✅ Automatic backups
- ✅ Image transformations
- ✅ Analytics & monitoring

## Cost

### Cloudinary Free Tier
- 25,000 transformations/month
- 25GB storage
- 25GB bandwidth
- Perfect for small to medium apps

### When to Upgrade
- 1000+ active users
- Heavy image usage
- Need advanced features

## Alternative Solutions

### Other Cloud Storage Options
1. **AWS S3** - More complex setup
2. **Google Cloud Storage** - Good for Google ecosystem
3. **Firebase Storage** - Easy if using Firebase
4. **Supabase Storage** - Good open-source option

### Local Storage Fixes (Not Recommended)
1. Use external storage mount (complex)
2. Regular backup/restore scripts
3. Accept data loss (poor UX)

## Support

If you continue having issues:
1. Check the server logs in Render dashboard
2. Test with a fresh Cloudinary account
3. Verify all environment variables are set
4. Contact support with specific error messages 