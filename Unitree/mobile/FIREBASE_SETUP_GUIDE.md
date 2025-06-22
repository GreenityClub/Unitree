# Firebase Setup Guide for UniTree

## 📍 **Where to Place `google-services.json`**

Place the `google-services.json` file in the **root directory** of your mobile project:

```
Unitree/mobile/
├── google-services.json  ← HERE (same level as app.json)
├── app.json
├── package.json
└── ...
```

**Exact Path:** `D:\Study\G2\Unitree\mobile\google-services.json`

## 🔥 **How to Get `google-services.json`**

### **Step 1: Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `UniTree` or `unitree-mobile`
4. Enable Google Analytics (recommended)
5. Click **"Create project"**

### **Step 2: Add Android App to Firebase**
1. In your Firebase project, click **"Add app"** 
2. Select **Android** icon
3. Fill in the registration form:
   - **Android package name:** `com.unitree.mobile`
   - **App nickname:** `UniTree`
   - **Debug SHA-1:** `50:44:E3:AB:DB:E9:11:C8:1A:72:5B:54:4C:7F:B3:C9:8C:84:E5:2D`
   - **Production SHA-1:** `A4:26:CE:02:66:7A:6A:6F:15:A0:CD:76:42:97:9A:7C:38:03:43:DA`

### **Step 3: Download Configuration File**
1. Click **"Register app"**
2. Download the `google-services.json` file
3. Place it in `D:\Study\G2\Unitree\mobile\google-services.json`

### **Step 4: Enable Required Services**
In your Firebase project console, enable:

#### **Authentication:**
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** (if using email auth)
3. Add authorized domains if needed

#### **Cloud Messaging (FCM):**
1. Go to **Cloud Messaging**
2. No additional setup needed - FCM is enabled by default

#### **Firestore Database (Optional):**
1. Go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** for development

## ⚙️ **Configuration Already Done**

✅ **app.json is already configured** with:
```json
{
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

✅ **expo-notifications is already installed** and configured

## 🧪 **Testing Firebase Integration**

After placing the `google-services.json` file, test the integration:

### **1. Clean and Rebuild:**
```bash
npx expo run:android --clear
```

### **2. Check Logs:**
Look for Firebase initialization messages:
```
✅ Firebase initialized successfully
📱 Expo push token: ExponentPushToken[...]
```

### **3. Test Push Notifications:**
In the app, go to:
- **Profile** → **User Settings** → **Notification Settings**
- Toggle notifications and test

## 🔒 **Security Setup**

### **Firebase Security Rules (Firestore):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow read access to public data
    match /public/{document=**} {
      allow read: if true;
    }
  }
}
```

### **FCM Server Key (for server-side notifications):**
1. Go to **Project Settings** → **Cloud Messaging**
2. Copy the **Server key**
3. Add to your server environment variables

## 🚨 **Important Notes**

1. **Never commit `google-services.json` to public repositories**
   - It's already added to `.gitignore`
   - Contains sensitive project identifiers

2. **Use different Firebase projects for development/production**
   - Development: Use debug SHA-1 certificate
   - Production: Use production SHA-1 certificate

3. **Package name must match exactly**
   - Firebase: `com.unitree.mobile`
   - app.json: `com.unitree.mobile`
   - Must be identical

## 🔄 **Certificate Mapping**

| Environment | Certificate | SHA-1 Fingerprint |
|-------------|-------------|-------------------|
| **Development** | Debug keystore | `50:44:E3:AB:DB:E9:11:C8:1A:72:5B:54:4C:7F:B3:C9:8C:84:E5:2D` |
| **Production** | Production keystore | `A4:26:CE:02:66:7A:6A:6F:15:A0:CD:76:42:97:9A:7C:38:03:43:DA` |

## 📱 **Next Steps After Setup**

1. **Place `google-services.json`** in the correct location
2. **Clean and rebuild** the app
3. **Test push notifications** in the app
4. **Configure Firebase services** as needed
5. **Update server with FCM server key** for push notifications

## 🆘 **Troubleshooting**

### **"FirebaseApp is not initialized" Error:**
- ✅ Check `google-services.json` is in the root directory
- ✅ Verify package name matches in Firebase and app.json
- ✅ Clean and rebuild the app

### **Push notifications not working:**
- ✅ Test on physical device (not simulator)
- ✅ Check SHA-1 certificates are added to Firebase
- ✅ Verify FCM is enabled in Firebase console

### **Build errors:**
- ✅ Make sure `google-services.json` is valid JSON
- ✅ Check file permissions
- ✅ Try cleaning node_modules and rebuilding 