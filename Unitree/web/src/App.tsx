import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import LoginPage from './pages/auth/AdminLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminsPage from './pages/admin/AdminsPage';
import StudentsPage from './pages/admin/StudentsPage';
import TreesPage from './pages/admin/TreesPage';
import WifiSessionsPage from './pages/admin/WifiSessionsPage';
import TreeTypesPage from './pages/admin/TreeTypesPage';
import RealTreesPage from './pages/admin/RealTreesPage';
import PointsPage from './pages/admin/PointsPage';
import StatisticsPage from './pages/admin/StatisticsPage';
import SettingsPage from './pages/admin/SettingsPage';
import IconExamples from './components/ui/IconExamples';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Admin Protected Route Component
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Super Admin Protected Route Component
const SuperAdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || admin?.role !== 'superadmin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Admin Public Route Component
const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  // Don't show loading screen on login page - let the login form handle its own loading state
  // Only show loading when checking existing auth status on initial load
  if (isLoading) {
    // Check if we're on the login page by looking at current location
    const isLoginPage = window.location.pathname === '/admin/login';
    
    if (isLoginPage) {
      // On login page, render children immediately to avoid white screen
      return <>{children}</>;
    } else {
      // On other pages, show loading screen
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="app-container">
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

          {/* Font Awesome Example Route - publicly accessible for testing */}
          <Route path="/icon-examples" element={<IconExamples />} />

        {/* Admin Auth Routes */}
        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <AdminLoginPage />
            </AdminPublicRoute>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/admins"
          element={
            <SuperAdminProtectedRoute>
              <AdminsPage />
            </SuperAdminProtectedRoute>
          }
        />

          {/* New Admin Routes */}
          <Route
            path="/admin/students"
            element={
              <AdminProtectedRoute>
                <StudentsPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/trees"
            element={
              <AdminProtectedRoute>
                <TreesPage />
              </AdminProtectedRoute>
            }
          />
          
          <Route
            path="/admin/wifi"
            element={
              <AdminProtectedRoute>
                <WifiSessionsPage />
              </AdminProtectedRoute>
            }
          />

          {/* Add missing admin routes */}
          <Route
            path="/admin/tree-types"
            element={
              <AdminProtectedRoute>
                <TreeTypesPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/real-trees"
            element={
              <AdminProtectedRoute>
                <RealTreesPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/points"
            element={
              <AdminProtectedRoute>
                <PointsPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/statistics"
            element={
              <AdminProtectedRoute>
                <StatisticsPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <SettingsPage />
              </AdminProtectedRoute>
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ToastProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export default App;
