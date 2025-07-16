# Fix Push Notification cho Production - UniTree

## 🚨 **Vấn đề**

Push notification chỉ hoạt động trên **Expo Go** mà không hoạt động trên **production build** do:

1. ❌ **Project ID không khớp** giữa `app.json` và `notificationService.ts`
2. ❌ **Firebase Legacy API deprecated** - Server sử dụng Legacy API đã bị disable
3. ❌ **Thiếu Firebase Service Account** cho V1 API mới
4. ❌ **Server chưa migration** sang Firebase Admin SDK

## ✅ **Giải pháp đã thực hiện**

### **1. Đã sửa Project ID không khớp**

**Trước:**
```typescript
// notificationService.ts
projectId: 'b53a2dd3-f93c-4eb5-aa1e-3620e8834198' // ID cũ, sai
```

**Sau:**
```typescript
// notificationService.ts  
projectId: '1a55c11b-0205-42e6-961f-496539f0161d' // ID đúng từ app.json
```

### **2. Đã Migration sang Firebase V1 API**

**Thêm Firebase Admin SDK:**
```json
"firebase-admin": "^12.0.0"
```

**Server Environment Variables mới:**
```bash
# V1 API Configuration (mới)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Tạo NotificationServiceV1:**
- ✅ Sử dụng Firebase Admin SDK thay vì expo-server-sdk
- ✅ Service Account authentication
- ✅ Token cleanup cho invalid tokens
- ✅ Proper V1 API error handling

## 🔧 **Các bước cần làm tiếp theo**

### **Bước 1: Lấy Firebase Service Account**

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project UniTree của bạn
3. Vào **Project Settings** (biểu tượng ⚙️)
4. Chọn tab **"Service accounts"**
5. Click **"Generate new private key"**
6. Click **"Generate key"** để confirm
7. Download file JSON về máy

### **Bước 2: Cấu hình Service Account**

**Production (Railway/Render):**
```bash
# Copy toàn bộ nội dung file JSON vào environment variable
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"unitree-xxxxx",...}
```

**Local Development:**
```bash
# Đặt file JSON trong server root
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### **Bước 3: Restart Server**

Sau khi thêm environment variables:

```bash
# Production (Railway/Render)
1. Thêm environment variables vào dashboard
2. Redeploy server

# Local development
1. Thêm vào file .env
2. Restart server: npm start
```

### **Bước 4: Test Push Notifications**

1. **Build production app**:
   ```bash
   cd Unitree/mobile
   eas build --platform android --profile production
   ```

2. **Install và test**:
   - Install file APK trên thiết bị thật
   - Login vào app
   - Vào **Profile** → **User Settings** → **Notification Settings**
   - Bật push notifications và test

3. **Kiểm tra server logs**:
   ```
   ✅ Expo client initialized with access token for production
   🔥 FCM Server Key configured for push notifications
   📱 Push notification sent: {...}
   ```

## 🔍 **Debug và Troubleshooting**

### **Nếu vẫn không nhận được notifications:**

1. **Kiểm tra device logs**:
   ```bash
   adb logcat | grep -i "expo\|firebase\|notification"
   ```

2. **Kiểm tra server logs**:
   - Xem có error về invalid push token không
   - Xem có FCM server key không
   - Xem có Expo access token không

3. **Kiểm tra Firebase configuration**:
   - Đảm bảo `google-services.json` đúng project
   - Kiểm tra SHA-1 certificates đã add vào Firebase
   - Verify package name khớp: `com.unitree.mobile`

### **Common Issues:**

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Invalid push token | Project ID không khớp | ✅ Đã fix trong commit này |
| FirebaseApp not initialized | Missing google-services.json | Đảm bảo file có trong mobile/ |
| Notification không hiện | Thiếu FCM server key | Thêm FCM_SERVER_KEY vào server |
| App không register token | Thiếu permissions | Kiểm tra notification permissions |

## 📱 **Testing Checklist**

- [ ] Server có FCM_SERVER_KEY và EXPO_ACCESS_TOKEN
- [ ] Project ID trong code khớp với app.json
- [ ] Firebase config files tồn tại
- [ ] SHA-1 certificates được add vào Firebase  
- [ ] Test trên production build (không phải Expo Go)
- [ ] Test trên physical device (không phải emulator)
- [ ] Push token được save thành công lên server
- [ ] Server logs hiển thị notifications được gửi

## 🚀 **Production Deployment**

Khi deploy lên production (Railway/Render):

1. **Set environment variables**:
   ```bash
   FCM_SERVER_KEY=AAAA...actual-server-key
   EXPO_ACCESS_TOKEN=expo_...actual-token
   ```

2. **Build production app**:
   ```bash
   eas build --platform all --profile production
   ```

3. **Upload to stores**:
   ```bash
   eas submit --platform all --profile production
   ```

## 📧 **Hỗ trợ**

Nếu vẫn có vấn đề, cung cấp:
- Server logs (có mask sensitive info)
- Mobile app logs  
- Firebase project settings screenshot
- Environment variables list (không bao gồm values) 