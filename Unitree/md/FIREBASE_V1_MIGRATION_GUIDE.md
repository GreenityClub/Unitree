# Migration từ FCM Legacy API sang V1 API - UniTree

## 🚨 **Tại sao cần Migration?**

Firebase đã **deprecated Legacy Cloud Messaging API** vào 20/6/2024 và chuyển hoàn toàn sang **V1 API**:

- ❌ **Legacy Server Key** không còn hoạt động
- ❌ `expo-server-sdk` sử dụng Legacy API 
- ✅ **V1 API** sử dụng **Service Account** thay vì Server Key
- ✅ Bảo mật tốt hơn với OAuth 2.0

## 📋 **Các thay đổi đã thực hiện**

### **1. Thêm Firebase Admin SDK**
```json
// package.json
"firebase-admin": "^12.0.0"
```

### **2. Tạo NotificationServiceV1**
- ✅ Sử dụng Firebase Admin SDK
- ✅ Hỗ trợ Service Account authentication
- ✅ Token validation tốt hơn
- ✅ Error handling cho V1 API

### **3. Cập nhật Environment Configuration**
```bash
# V1 API (mới)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Legacy API (deprecated)
# FCM_SERVER_KEY=...
# EXPO_ACCESS_TOKEN=...
```

## 🔧 **Cách lấy Service Account Key**

### **Bước 1: Vào Firebase Console**

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project **UniTree** của bạn
3. Click vào **⚙️ Project Settings**

### **Bước 2: Tạo Service Account**

1. Chọn tab **"Service accounts"**
2. Click **"Generate new private key"**
3. Click **"Generate key"** để confirm
4. File JSON sẽ được download tự động

### **Bước 3: Cấu hình Service Account**

**Cách 1: Environment Variable (Recommended cho Production)**
```bash
# Copy toàn bộ nội dung file JSON vào biến này
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"unitree-xxxxx","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@unitree-xxxxx.iam.gserviceaccount.com",...}
```

**Cách 2: File Path (Cho Local Development)**
```bash
# Đặt file JSON trong server root và point đến nó
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### **Bước 4: Cập nhật Routes để sử dụng V1**

```javascript
// routes/notification.js - Thêm dòng này
const notificationServiceV1 = require('../services/notificationServiceV1');

// Thay đổi trong test endpoint
router.post('/test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'No push token found'
      });
    }

    // Sử dụng V1 service
    const result = await notificationServiceV1.sendTestNotification(user.pushToken);
    
    res.status(200).json({
      success: result.success,
      message: result.success ? 'Test notification sent successfully' : 'Failed to send notification',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});
```

## 🧪 **Testing V1 Integration**

### **1. Kiểm tra Server Logs**

Khi start server, bạn sẽ thấy:
```
✅ Environment validation passed
🔑 Using service account from environment variable
🔥 Firebase Admin SDK initialized successfully
🚀 Starting server in production mode
```

### **2. Test Push Notification**

1. **Vào app**, login và enable notifications
2. **Vào server logs**, tìm dòng push token được save
3. **Call test API**:
   ```bash
   POST /api/notification/test
   Authorization: Bearer <your-jwt-token>
   ```

### **3. Kiểm tra Response**

**Success Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "success": true,
    "messageId": "projects/unitree-xxxxx/messages/xxx"
  }
}
```

## 🔍 **Troubleshooting**

### **Common Errors:**

| Error | Nguyên nhân | Giải pháp |
|-------|-------------|-----------|
| `Firebase not initialized` | Thiếu service account | Thêm FIREBASE_SERVICE_ACCOUNT_KEY |
| `Invalid push token format` | Token không đúng format | Kiểm tra Expo push token generation |
| `registration-token-not-registered` | Token expired/invalid | App sẽ tự động remove token |
| `PERMISSION_DENIED` | Service account thiếu quyền | Verify service account permissions |

### **Debug Steps:**

1. **Kiểm tra Service Account**:
   ```bash
   # Parse JSON để kiểm tra
   node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))"
   ```

2. **Kiểm tra Project ID**:
   - Service Account project_id phải khớp với Firebase project
   - Mobile app project ID phải khớp với Expo configuration

3. **Kiểm tra Network**:
   ```bash
   # Test FCM endpoint
   curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send
   ```

## 🚀 **Deployment Instructions**

### **Production (Railway/Render)**

1. **Thêm Environment Variable**:
   ```
   Name: FIREBASE_SERVICE_ACCOUNT_KEY
   Value: {"type":"service_account","project_id":"unitree-xxxxx",...}
   ```

2. **Install Dependencies**:
   ```bash
   npm install firebase-admin
   ```

3. **Update Code**:
   - Thay `notificationService` bằng `notificationServiceV1`
   - Update import statements
   - Test thoroughly

### **Local Development**

1. **Tạo file service account**:
   ```bash
   # Đặt file JSON trong server root
   cp ~/Downloads/unitree-xxxxx-firebase-adminsdk-xxxxx.json ./firebase-service-account.json
   ```

2. **Thêm vào .env**:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

3. **Add to .gitignore**:
   ```bash
   firebase-service-account.json
   ```

## 📊 **Performance Benefits**

V1 API có nhiều lợi ích:

- 🔐 **Bảo mật tốt hơn**: OAuth 2.0 thay vì static key
- 📱 **Token management**: Tự động cleanup invalid tokens  
- 🚀 **Reliability**: Được Firebase maintain actively
- 🔧 **Error handling**: Chi tiết hơn và specific error codes
- 📈 **Analytics**: Tốt hơn trong Firebase Console

## ✅ **Migration Checklist**

- [ ] **Install firebase-admin** dependency
- [ ] **Generate Service Account** key từ Firebase Console
- [ ] **Set environment variable** FIREBASE_SERVICE_ACCOUNT_KEY
- [ ] **Update routes** để sử dụng notificationServiceV1
- [ ] **Test push notifications** trên production build
- [ ] **Monitor server logs** để ensure proper initialization
- [ ] **Update cron jobs** để sử dụng V1 service
- [ ] **Remove legacy code** sau khi confirm V1 hoạt động

## 🔄 **Rollback Plan**

Nếu có vấn đề với V1, có thể temporary rollback:

1. **Revert routes** về notificationService cũ
2. **Comment out** notificationServiceV1 imports  
3. **Use Legacy API** cho đến khi fix xong V1
4. **Monitor Firebase Console** để xem khi nào Legacy API bị disable hoàn toàn

---

**🎯 Sau khi migration xong, push notifications sẽ hoạt động ổn định trên production với Firebase V1 API!** 