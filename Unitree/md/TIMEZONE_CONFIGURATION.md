# Timezone Configuration - UniTree Server

## Overview
UniTree server và push notification system đã được cấu hình để sử dụng timezone của Hà Nội, Việt Nam (GMT+7).

## Timezone Setting
- **Timezone**: `Asia/Ho_Chi_Minh`
- **GMT Offset**: +7 hours
- **Location**: Hà Nội, Việt Nam

## Files Updated

### 1. Cron Service (`src/services/cronService.js`)
- **Updated**: Tất cả cron jobs sử dụng timezone `Asia/Ho_Chi_Minh`
- **Impact**: 
  - Reminder notifications gửi vào 7AM, 9AM, 11AM, 1PM, 3PM, 5PM theo giờ Hà Nội
  - Daily cleanup jobs chạy vào lúc nửa đêm theo giờ Hà Nội
  - Test jobs chạy theo timezone Hà Nội

### 2. Notification Service (`src/services/notificationService.js`)
- **Updated**: Kiểm tra giờ hiện tại sử dụng timezone Hà Nội
- **New Methods**:
  - `getCurrentHanoiTime()`: Lấy thời gian hiện tại theo timezone Hà Nội
  - `getCurrentHanoiHour()`: Lấy giờ hiện tại theo timezone Hà Nội
- **Impact**: 
  - Push notifications chỉ gửi trong khoảng 7AM-6PM theo giờ Hà Nội
  - Logging hiển thị thời gian theo timezone Hà Nội

### 3. Email Service (`src/utils/emailService.js`)
- **Updated**: Email timestamps sử dụng timezone Hà Nội
- **Format**: `vi-VN` locale với timezone `Asia/Ho_Chi_Minh`

### 4. Application Logs (`src/app.js`)
- **Updated**: Tất cả health check timestamps sử dụng timezone Hà Nội
- **Format**: Vietnamese locale format

### 5. Keep-Alive Scripts
- **Updated**: 
  - `keep-alive.js`: Log timestamps theo timezone Hà Nội
  - `keep-alive-enhanced.js`: Error logs và status logs theo timezone Hà Nội

## Notification Schedule
Với timezone mới, reminder notifications sẽ được gửi:
- **Thời gian**: 7:00, 9:00, 11:00, 13:00, 15:00, 17:00 (giờ Hà Nội)
- **Tần suất**: Mỗi 2 giờ
- **Điều kiện**: Chỉ gửi cho users inactive hơn 2 giờ
- **Thiết lập**: Users phải bật push notifications và app reminder notifications

## Log Format
Tất cả logs bây giờ sử dụng format:
```javascript
new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})
```

**Example Output**: `12/28/2024, 2:30:00 PM`

## Deployment Notes
- **Server Location**: Timezone setting không phụ thuộc vào server location
- **Database**: MongoDB documents vẫn lưu UTC timestamps
- **Client Display**: Mobile app hiển thị thời gian theo device timezone
- **API Responses**: Date objects trả về vẫn là UTC, client tự convert

## Testing
Để test timezone configuration:

1. **Manual Trigger Reminder**:
```bash
POST /api/notification/test-reminder
```

2. **Check Current Time**:
```bash
GET /health
# Timestamp trong response sẽ hiển thị theo giờ Hà Nội
```

3. **Verify Cron Jobs**:
```javascript
// In server console
cronService.getJobsStatus()
```

## Migration Impact
- **Existing Users**: Không ảnh hưởng đến user data
- **Notification History**: Timestamps cũ vẫn giữ nguyên
- **Server Restart**: Cần restart server để áp dụng cron job timezone mới

## Future Considerations
- Consider implementing per-user timezone settings nếu app mở rộng ra các quốc gia khác
- Monitor notification delivery rates sau khi thay đổi timezone
- Có thể cần adjust notification times dựa trên user behavior analytics

---
**Last Updated**: December 28, 2024  
**Version**: 1.0  
**Environment**: Production & Development 