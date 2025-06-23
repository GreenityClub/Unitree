# Environment Configuration for Unitree Server

Copy the content below to create a `.env` file in the server root directory. Fill in your actual values and **DO NOT** commit the .env file to version control.

## Required Environment Variables

```bash
# MongoDB Database Connection
MONGODB_URI=mongodb://localhost:27017/unitree
# For production, use a full MongoDB connection string like:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unitree?retryWrites=true&w=majority

# JWT Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d
```

## Recommended Environment Variables

```bash
# Email Service Configuration (for verification codes)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
# For Gmail, use an app-specific password, not your regular password
# Enable 2FA and generate an app password at: https://myaccount.google.com/apppasswords

# Server Configuration
NODE_ENV=development
PORT=3000

# CORS Origins (for frontend connections)
CLIENT_URL=http://localhost:3000
CLIENT_DEV_URL=http://192.168.1.5:3000
CLIENT_URL_DEV=http://10.0.2.2:3000
CLIENT_URL_DEV_2=http://localhost:19006

# University WiFi & Location Configuration
UNIVERSITY_IP_PREFIX=10.22
UNIVERSITY_LAT=21.023883446210807
UNIVERSITY_LNG=105.79044010261333
UNIVERSITY_RADIUS=100

# Points System Configuration
MIN_SESSION_DURATION=300
POINTS_PER_HOUR=60
TREE_COST=100

# Cloud Storage Configuration (Optional - for avatar uploads)
# Get these from your Cloudinary dashboard at https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Logging Configuration
LOG_LEVEL=info
```

## Security Checklist

- ✅ JWT_SECRET is long and random (minimum 32 characters)
- ✅ MongoDB connection uses authentication
- ✅ Email passwords are app-specific, not account passwords
- ✅ Production NODE_ENV removes debug information
- ✅ CORS origins are restricted to your domains only
- ✅ Environment file is added to .gitignore

## Deployment Notes

### For Railway Deployment:
- Set `NODE_ENV=production`
- Use Railway's provided MongoDB connection string
- Set a strong, random JWT_SECRET
- Configure email service with app-specific passwords
- Update CORS origins to match your deployed frontend URLs

### For Local Development:
- Keep `NODE_ENV=development` for detailed error messages
- Use local MongoDB instance or MongoDB Atlas
- Test email functionality with your email configuration 