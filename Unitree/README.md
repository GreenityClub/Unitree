# Unitree Mobile App with Authentication

A React Native mobile application built with Expo that includes a complete authentication system with login, registration, and password recovery features.

## 🚀 Features

- **Complete Authentication System**
  - User login with email/password
  - User registration with email verification
  - Forgot password with email verification
  - Password reset functionality
  - Remember me functionality
  - Secure token-based authentication

- **Modern UI/UX**
  - Responsive design for all screen sizes
  - Smooth animations and transitions
  - Beautiful gradient backgrounds
  - Professional mascot integration

- **Backend Integration**
  - RESTful API endpoints
  - JWT token authentication
  - MongoDB database
  - Email verification system
  - Password reset system

## 📁 Project Structure

```
Unitree/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/
│   │   │   └── auth/      # Authentication screens
│   │   ├── components/    # Reusable UI components
│   │   ├── navigation/    # Navigation configuration
│   │   ├── context/       # React Context (Auth, etc.)
│   │   ├── config/        # API configuration
│   │   ├── utils/         # Utility functions
│   │   ├── theme/         # App theme and styling
│   │   └── assets/        # Images, fonts, etc.
│   ├── App.js            # Main app entry point
│   └── package.json      # Dependencies and scripts
└── server/               # Backend server
    ├── src/
    │   ├── routes/       # API routes
    │   ├── models/       # Database models
    │   ├── middleware/   # Express middleware
    │   ├── config/       # Server configuration
    │   └── utils/        # Utility functions
    └── package.json      # Dependencies and scripts
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- MongoDB (local or cloud)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Unitree
```

### 2. Setup Backend Server

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/unitree
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 3. Setup Mobile App

```bash
cd ../mobile
npm install
```

Update the `.env` file in the `mobile` directory to match your server URL:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.6:3000
```

**Note:** Replace `192.168.1.6` with your actual IP address if testing on a physical device.

Start the mobile app:

```bash
npm start
```

## 📱 Authentication Screens

### 1. Login Screen
- Email/password login
- Remember me functionality
- Navigation to registration and forgot password
- Google sign-in support (placeholder)

### 2. Registration Screen
- Multi-step registration process
- Email verification with 6-digit code
- Student data collection
- University selection
- Password validation

### 3. Forgot Password Screen
- Email verification
- 6-digit reset code
- New password setup
- Password strength validation

### 4. Forgot Password From Profile Screen
- Similar to forgot password but accessible from user profile
- Change password functionality

## 🔐 Authentication Flow

1. **Registration:**
   - User enters email
   - Verification code sent to email
   - User enters code and completes registration
   - Account created and user logged in

2. **Login:**
   - User enters email/password
   - Server validates credentials
   - JWT token returned and stored
   - User redirected to main app

3. **Password Reset:**
   - User enters email
   - Reset code sent to email
   - User enters code and new password
   - Password updated in database

## 🎨 UI Components

### Custom Components
- `Button` - Styled button component
- `LoadingOverlay` - Loading indicator overlay
- `Input` - Custom text input
- `CustomModal` - Modal component
- `AvatarPicker` - Avatar selection component

### Styling
- Responsive design using utility functions
- Consistent color scheme and typography
- Smooth animations with `react-native-reanimated`
- Material Design components with `react-native-paper`

## 🌐 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/send-verification-code` | Send email verification code |
| POST | `/api/auth/verify-email-code` | Verify email code |
| POST | `/api/auth/resend-verification-code` | Resend verification code |
| POST | `/api/auth/forgot-password` | Send password reset code |
| POST | `/api/auth/verify-reset-code` | Verify reset code |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/resend-reset-code` | Resend reset code |
| GET | `/api/auth/me` | Get current user |

## 🔧 Configuration

### Environment Variables

#### Mobile App (.env)
```env
EXPO_PUBLIC_API_URL=http://your-server-url:3000
```

#### Server (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/unitree
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the mobile app:**
   ```bash
   cd mobile
   npm start
   ```

3. **Use Expo Go app** on your mobile device to scan the QR code and run the app.

### Production Build

For production deployment, follow Expo's build and deployment guides:

```bash
cd mobile
expo build:android
expo build:ios
```

## 📚 Dependencies

### Mobile App
- React Native & Expo
- React Navigation
- React Native Paper (UI components)
- React Native Vector Icons
- React Native Reanimated (animations)
- AsyncStorage (local storage)

### Backend Server
- Express.js
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- bcryptjs (password hashing)
- CORS (Cross-Origin Resource Sharing)

## 🎯 Next Steps

1. **Implement email service** for sending actual verification codes
2. **Add Google authentication** functionality
3. **Implement main app screens** after authentication
4. **Add profile management** features
5. **Implement push notifications**
6. **Add biometric authentication** support

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler errors:** Clear cache with `npx expo start --clear`
2. **Network errors:** Check your IP address in the `.env` file
3. **Authentication errors:** Verify server is running and accessible
4. **Asset loading issues:** Check asset paths in the code

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please create an issue in the repository. 