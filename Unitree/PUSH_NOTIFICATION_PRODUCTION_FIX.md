# 🔔 Push Notification Production Fix Guide

## 🔍 Vấn đề 
Push notification chỉ hoạt động trên **Expo Go** mà không hoạt động trên **production app** (standalone builds).

## 🎯 Nguyên nhân chính

### 1. **ProjectId không khớp** ✅ **ĐÃ SỬA**
- **Trước**: `notificationService.ts` sử dụng projectId cũ (`b53a2dd3-f93c-4eb5-aa1e-3620e8834198`)
- **Sau**: Đã cập nhật để sử dụng `ENV.EAS_PROJECT_ID` từ app.json (`1a55c11b-0205-42e6-961f-496539f0161d`)

### 2. **Firebase Configuration cho Production**
Expo Go sử dụng Firebase project của Expo, nhưng production app cần Firebase riêng.

### 3. **FCM Credentials cho EAS Build**
Production builds cần FCM server key để gửi push notifications.

## 🔧 Các bước khắc phục

### **Bước 1: Kiểm tra Firebase Project**

1. **Truy cập [Firebase Console](https://console.firebase.google.com/)**
2. **Kiểm tra Project ID** trong Firebase phải khớp với `app.json`:
   ```json
   "extra": {
     "eas": {
       "projectId": "1a55c11b-0205-42e6-961f-496539f0161d"
     }
   }
   ```

### **Bước 2: Cập nhật Firebase Configuration**

#### **Android (`google-services.json`)**
```bash
# Tải file mới từ Firebase Console
# Project Settings > General > Your apps > Android app > Download google-services.json
```

**Đảm bảo package name khớp:**
```json
{
  "project_info": {
    "project_id": "your-correct-project-id"
  },
  "client": [
    {
      "client_info": {
        "android_client_info": {
          "package_name": "com.unitree.mobile"
        }
      }
    }
  ]
}
```

#### **iOS (`GoogleService-Info.plist`)**
```bash
# Tải file mới từ Firebase Console  
# Project Settings > General > Your apps > iOS app > Download GoogleService-Info.plist
```

**Đảm bảo bundle ID khớp:**
```xml
<key>BUNDLE_ID</key>
<string>com.unitree.mobile</string>
```

### **Bước 3: Cấu hình FCM cho EAS Build**

#### **Lấy FCM Server Key**
1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Copy **Server key** 
3. Thêm vào EAS secrets:

```bash
# Thêm FCM server key vào EAS
eas secret:create --scope project --name EXPO_PUSH_SERVER_KEY --value "your-fcm-server-key"
```

#### **Cập nhật app.json**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#2E7D32",
          "defaultChannel": "default",
          "mode": "production"
        }
      ]
    ]
  }
}
```

### **Bước 4: Rebuild Production App**

```bash
# Clear cache và rebuild
npx expo prebuild --clean
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 🧪 Testing

### **1. Kiểm tra Token Format**
```typescript
// Development (Expo Go): ExponentPushToken[xxxxxx]
// Production: ExponentPushToken[yyyyyy] (khác format)

console.log('Push Token:', await Notifications.getExpoPushTokenAsync({
  projectId: ENV.EAS_PROJECT_ID
}));
```

### **2. Test Push Notification**
```bash
# Sử dụng Expo push tool
npx expo push:send --to="ExponentPushToken[production-token]" --title="Test" --body="Production test"
```

### **3. Kiểm tra Server Logs**
```javascript
// Server: Unitree/server/src/services/notificationService.js
// Check if token validation passes
if (!Expo.isExpoPushToken(expoPushToken)) {
  logger.warn(`Invalid push token: ${expoPushToken}`);
  return { success: false, error: 'Invalid push token' };
}
```

## 🔍 Debug Steps

### **1. Check Token Registration**
```typescript
// Trong app production
const token = await notificationService.getPushToken();
console.log('🔐 Production token:', token);
console.log('🎯 Project ID:', ENV.EAS_PROJECT_ID);
```

### **2. Verify Server Token Reception**
```javascript
// Server logs sẽ hiển thị:
// "Push token saved for user email: ExponentPushToken[...]"
```

### **3. Test Notification Sending**
```typescript
// Trong app settings
const testResult = await notificationService.sendTestNotification('test');
console.log('📨 Test result:', testResult);
```

## ⚠️ Common Issues

### **Token Format Differences**
- **Expo Go**: Token thường ngắn hơn
- **Production**: Token dài hơn và có format khác
- **Cả hai đều valid** nhưng target environments khác nhau

### **Firebase Project Mismatch** 
- Development sử dụng Expo's Firebase
- Production cần Firebase project riêng
- **Solution**: Đảm bảo `google-services.json` và `GoogleService-Info.plist` đúng

### **Missing FCM Credentials**
- Production builds cần FCM server key
- **Solution**: Thêm vào EAS secrets

## 📋 Checklist

- [ ] ✅ ProjectId đã được cập nhật trong `notificationService.ts`
- [ ] Firebase project ID khớp với app.json
- [ ] `google-services.json` có package name đúng (`com.unitree.mobile`)
- [ ] `GoogleService-Info.plist` có bundle ID đúng (`com.unitree.mobile`)
- [ ] FCM server key đã được thêm vào EAS secrets
- [ ] App đã được rebuild với production profile
- [ ] Push token được generate và lưu thành công
- [ ] Server có thể gửi notification đến production token

## 🎉 Expected Result

Sau khi thực hiện các bước trên:
1. **Production app** sẽ generate push token đúng format
2. **Server** sẽ có thể gửi notification đến production app
3. **User** sẽ nhận được notification cả khi app đóng và mở

## 📞 Debug Commands

```bash
# Check EAS project
eas project:info

# View build logs
eas build:list

# Check secrets
eas secret:list

# Test push notification
npx expo install @expo/push-server-sdk
``` 