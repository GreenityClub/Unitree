# UniTree Mobile App

A React Native mobile application that incentivizes university students to attend classes by tracking their time spent connected to campus WiFi networks and rewarding them with points redeemable for real tree saplings.

## Project Structure

The project follows a well-organized folder structure with all implementation files inside the `src` directory:

```
mobile/
├── app/                     # Expo Router navigation (simplified imports)
│   ├── (tabs)/             # Tab navigation routes
│   │   ├── index.tsx       # Dashboard tab (imports from src)
│   │   ├── wifi.tsx        # WiFi tracking tab
│   │   ├── trees.tsx       # Trees management tab
│   │   └── profile.tsx     # User profile tab
│   ├── auth/               # Authentication routes
│   │   ├── login.tsx       # Login screen (imports from src)
│   │   ├── register.tsx    # Registration screen
│   │   └── forgot-password.tsx # Password reset
│   └── _layout.tsx         # Root layout
├── src/                    # Main implementation directory
│   ├── assets/             # Static assets (images, icons, etc.)
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Common components
│   │   │   ├── Button.tsx  # Reusable button component
│   │   │   ├── Input.tsx   # Reusable input component
│   │   │   ├── Card.tsx    # Card container component
│   │   │   └── LoadingSpinner.tsx # Loading indicator
│   │   └── index.ts        # Component exports
│   ├── config/             # Configuration files
│   │   └── api.ts          # API configuration and endpoints
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx # Authentication state management
│   │   └── WiFiContext.tsx # WiFi tracking state management
│   ├── hooks/              # Custom React hooks
│   │   ├── useAsync.ts     # Async operation hook
│   │   └── index.ts        # Hook exports
│   ├── navigation/         # Navigation configuration (future use)
│   ├── screens/            # Screen implementations
│   │   ├── auth/           # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── main/           # Main app screens
│   │   │   └── DashboardScreen.tsx
│   │   └── index.ts        # Screen exports
│   ├── services/           # API service layers
│   │   ├── authService.ts  # Authentication API calls
│   │   ├── wifiService.ts  # WiFi tracking API calls
│   │   ├── treeService.ts  # Tree management API calls
│   │   └── index.ts        # Service exports
│   ├── theme/              # Design system and theming
│   │   ├── colors.ts       # Color palette
│   │   ├── typography.ts   # Font styles and sizes
│   │   ├── spacing.ts      # Spacing and layout values
│   │   └── index.ts        # Theme exports
│   └── utils/              # Utility functions
│       ├── validation.ts   # Form validation utilities
│       ├── formatters.ts   # Data formatting utilities
│       └── index.ts        # Utility exports
├── package.json            # Dependencies and scripts
├── app.json               # Expo configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Key Features

### Authentication System
- University email validation
- Secure JWT token management
- Registration with student data collection
- Password recovery system

### WiFi Tracking
- Automatic university WiFi detection
- Real-time session monitoring
- Points calculation (100 points/hour)
- Session history tracking

### Points & Rewards
- Points accumulation system
- Tree redemption (100 points = 1 tree)
- Real-world tree planting partnerships
- User achievement tracking

### Tree Management
- Tree growth stage tracking
- Health monitoring
- Planting location information
- Growth timeline visualization

## Technical Architecture

### State Management
- **AuthContext**: Global authentication state
- **WiFiContext**: WiFi connectivity and session tracking
- **Custom Hooks**: Reusable stateful logic

### API Layer
- **Services**: Abstracted API interaction layers
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript implementation

### UI Components
- **Reusable Components**: Consistent design system
- **Theme System**: Centralized styling configuration
- **Responsive Design**: Cross-platform compatibility

### Navigation
- **Expo Router**: File-based routing system
- **Tab Navigation**: Bottom tab interface
- **Stack Navigation**: Hierarchical screen management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npx expo start
   ```

3. **Run on device/emulator:**
   - iOS: Press `i` in the terminal or scan QR with Expo Go
   - Android: Press `a` in the terminal or scan QR with Expo Go

### Environment Setup

1. **Configure API endpoint in `src/config/api.ts`:**
   ```typescript
   const API_BASE_URL = 'http://your-backend-url:3000';
   ```

2. **Update university WiFi SSIDs in services as needed**

## Development Guidelines

### File Organization
- Keep related files together in logical directories
- Use index.ts files for clean exports
- Maintain consistent naming conventions

### Component Development
- Create reusable components in `src/components/common/`
- Use TypeScript interfaces for props
- Follow the established theming system

### State Management
- Use Context for global state
- Create custom hooks for reusable logic
- Keep local state minimal

### API Integration
- Use service layers for API calls
- Implement proper error handling
- Maintain type safety with interfaces

### Styling
- Use the centralized theme system
- Maintain consistent spacing and colors
- Ensure cross-platform compatibility

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run build` - Build for production

## Backend Integration

The mobile app integrates with a Node.js/Express backend server:

- **Authentication**: JWT-based authentication
- **WiFi Tracking**: Session management and point calculation
- **Tree Management**: Redemption and growth tracking
- **User Management**: Profile and preferences

## Future Enhancements

### Phase 2 Features
- Push notifications for session reminders
- Social features (leaderboards, sharing)
- Advanced tree species selection
- Offline mode support

### Technical Improvements
- Performance optimization
- Advanced error tracking
- A/B testing framework
- Automated testing suite

## Contributing

1. Follow the established folder structure
2. Maintain TypeScript strict mode
3. Add proper error handling
4. Update documentation for new features
5. Test on both iOS and Android platforms

## License

This project is part of the UniTree ecosystem for promoting campus attendance through environmental incentives.

## Support

For technical issues or questions:
1. Check the existing documentation
2. Review the codebase structure
3. Create detailed issue reports
4. Follow the established coding patterns

---

**Note**: This structure provides a scalable foundation for the UniTree mobile application, ensuring maintainability and ease of development as the project grows.
