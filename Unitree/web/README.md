# Unitree Web Application

A React-based web application for the Unitree tree planting and WiFi tracking platform.

## Features

- 🌱 **Tree Management**: Plant and manage virtual trees
- 📶 **WiFi Tracking**: Track WiFi sessions and earn points
- ⭐ **Points System**: Earn and spend points for various activities
- 👤 **User Profiles**: Manage user profiles and settings
- 🔐 **Authentication**: Secure login and registration system

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React Context API

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see server directory)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_ENVIRONMENT=development
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # Basic UI components (Button, Input, Card)
│   └── Layout.tsx     # Main layout component
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication context
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   └── DashboardPage.tsx
├── config/            # Configuration files
│   └── api.ts         # API configuration
├── types/             # TypeScript type definitions
│   └── index.ts
└── App.tsx            # Main application component
```

## API Integration

The application integrates with the Unitree backend API. Key endpoints include:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Trees**: `/api/trees/*`
- **Points**: `/api/points/*`
- **WiFi**: `/api/wifi/*`
- **Notifications**: `/api/notification/*`

## Authentication Flow

1. **Registration**: Users enter their email, receive a verification code, and complete registration
2. **Login**: Standard email/password authentication
3. **Token Management**: JWT tokens are stored in localStorage
4. **Protected Routes**: Automatic redirection for unauthenticated users

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Update navigation in `src/components/Layout.tsx`

### Styling

The project uses Tailwind CSS for styling. Custom styles can be added in:
- `src/index.css` for global styles
- `src/App.css` for app-specific styles
- `tailwind.config.js` for theme customization

### API Calls

Use the configured `apiClient` from `src/config/api.ts` for all API calls. The client includes:
- Automatic token management
- Error handling
- Request/response interceptors

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new components
3. Add proper error handling
4. Test your changes thoroughly

## License

This project is part of the Unitree application suite.
