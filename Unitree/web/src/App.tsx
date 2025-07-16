import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Add more protected routes here */}
        <Route
          path="/trees"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">🌳 Trees</h1>
                  <p className="text-gray-600">Tree management coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/points"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">⭐ Points</h1>
                  <p className="text-gray-600">Points management coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wifi"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">📶 WiFi</h1>
                  <p className="text-gray-600">WiFi management coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">👤 Profile</h1>
                  <p className="text-gray-600">Profile management coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
