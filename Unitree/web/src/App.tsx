import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginPage from './pages/auth/AdminLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import AdminsPage from './pages/admin/AdminsPage';
import StudentsPage from './pages/admin/StudentsPage';
import TreesPage from './pages/admin/TreesPage';
import WifiSessionsPage from './pages/admin/WifiSessionsPage';
import { AdminLayout } from './components/Layout';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
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
    return <div className="loading">Loading...</div>;
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
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Super Admin Protected Route Component
const SuperAdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !admin || admin.role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Public Route Component
const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div>
    <Router>
      <Routes>
          {/* Admin Public Routes */}
          <Route path="/admin/login" element={<AdminPublicRoute><LoginPage /></AdminPublicRoute>} />
          
          {/* Admin Layout with Nested Routes */}
        <Route
            path="/admin" 
          element={
            <AdminProtectedRoute>
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
            </AdminProtectedRoute>
          }
          >
            <Route path="dashboard" element={<DashboardPageContent />} />
            <Route path="admins" element={<AdminsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="trees" element={<TreesPage />} />
            <Route path="tree-types" element={<div className="text-center py-6"><h2 className="text-xl font-semibold mb-4">Tree Types</h2><p>Tree types management page</p></div>} />
            <Route path="real-trees" element={<div className="text-center py-6"><h2 className="text-xl font-semibold mb-4">Real Trees</h2><p>Real trees management page</p></div>} />
            <Route path="points" element={<div className="text-center py-6"><h2 className="text-xl font-semibold mb-4">Points</h2><p>Points management page</p></div>} />
            <Route path="wifi" element={<WifiSessionsPage />} />
            <Route path="statistics" element={<div className="text-center py-6"><h2 className="text-xl font-semibold mb-4">Statistics</h2><p>Statistics dashboard</p></div>} />
            <Route path="settings" element={<div className="text-center py-6"><h2 className="text-xl font-semibold mb-4">Settings</h2><p>System settings</p></div>} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Redirect /admin to /admin/dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
                <div>Dashboard</div>
            </ProtectedRoute>
          }
        />

        {/* Add more protected routes here */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </div>
  );
};

// Extract just the content from DashboardPage to avoid duplicate AdminLayout
const DashboardPageContent: React.FC = () => {
  const dashboard = <DashboardPage />;
  // Extract the children from the original component, skipping the AdminLayout wrapper
  // For now we'll just implement a simpler version directly
  
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Unitree Admin Dashboard</p>
      </div>
        
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Same cards as in DashboardPage */}
        {/* ... */}
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastProvider>
        <AppContent />
        </ToastProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export default App;
