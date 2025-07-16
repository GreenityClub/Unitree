import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import apiClient, { API_ENDPOINTS } from '../config/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE);
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
      localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 