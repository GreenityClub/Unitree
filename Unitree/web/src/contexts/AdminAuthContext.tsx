import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient, { API_ENDPOINTS } from '../config/api';

interface AdminUser {
  id: string;
  _id: string; // Add _id field to match server response
  username: string;
  role: 'admin' | 'superadmin';
  permissions: {
    manageAdmins: boolean;
    manageStudents: boolean;
    manageTrees: boolean;
    managePoints: boolean;
    manageWifiSessions: boolean;
    manageTreeTypes: boolean;
    manageRealTrees: boolean;
    viewStatistics: boolean;
  };
  createdAt?: string;
  lastLogin?: string;
}

interface AdminAuthResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
}

interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!admin;

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('adminAuthToken');
      if (token) {
        try {
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ADMIN_ME);
          if (response.data && response.data.success) {
            // Ensure both id and _id are set
            const adminData = response.data.admin;
            if (adminData.id && !adminData._id) {
              adminData._id = adminData.id;
            } else if (adminData._id && !adminData.id) {
              adminData.id = adminData._id;
            }
            setAdmin(adminData);
          } else {
            // Clear invalid token
            localStorage.removeItem('adminAuthToken');
          }
        } catch (error) {
          console.error('Admin auth check failed:', error);
          localStorage.removeItem('adminAuthToken');
          localStorage.removeItem('admin');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: AdminLoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<AdminAuthResponse>(API_ENDPOINTS.AUTH.ADMIN_LOGIN, credentials);
      
      if (response.data && response.data.success) {
        const { token, admin } = response.data;
        
        // Ensure both id and _id are set
        if (admin.id && !admin._id) {
          admin._id = admin.id;
        } else if (admin._id && !admin.id) {
          admin.id = admin._id;
        }
        
        localStorage.setItem('adminAuthToken', token);
        localStorage.setItem('admin', JSON.stringify(admin));
        setAdmin(admin);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  const hasPermission = (permission: string) => {
    if (!admin) return false;
    if (admin.role === 'superadmin') return true;
    return admin.permissions && admin.permissions[permission as keyof typeof admin.permissions];
  };

  const value: AdminAuthContextType = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 