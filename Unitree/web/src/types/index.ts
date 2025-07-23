// User related types
export interface User {
  _id: string;
  email: string;
  fullName: string;
  studentId?: string;
  avatar?: string;
  points: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  studentId?: string;
  verificationCode: string;
}

// Tree related types
export interface Tree {
  _id: string;
  userId: string;
  treeTypeId: string;
  name: string;
  stage: number;
  health: number;
  plantedAt: string;
  lastWateredAt?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TreeType {
  _id: string;
  name: string;
  description: string;
  stages: number;
  imageUrl: string;
  pointsPerStage: number;
  waterNeeds: number;
  createdAt: string;
  updatedAt: string;
}

// Points related types
export interface PointsBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface PointsTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent';
  source: string;
  description: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  _id: string;
  fullName: string;
  points: number;
  rank: number;
  avatar?: string;
}

// WiFi related types
export interface WifiSession {
  _id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pointsEarned?: number;
  status: 'active' | 'completed' | 'cancelled';
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WifiStatus {
  isConnected: boolean;
  currentSession?: WifiSession;
  totalSessionsToday: number;
  totalPointsToday: number;
}

// Notification related types
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  treeReminders: boolean;
  wifiSessionReminders: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea';
  required?: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

// UI Component types
export interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'accent';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Admin related types
export interface AdminUser {
  _id: string;
  id: string; // For compatibility
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
  createdAt: string;
  lastLogin?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
  message?: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminCreateRequest {
  username: string;
  password: string;
  permissions: {
    manageAdmins?: boolean;
    manageStudents?: boolean;
    manageTrees?: boolean;
    managePoints?: boolean;
    manageWifiSessions?: boolean;
    manageTreeTypes?: boolean;
    manageRealTrees?: boolean;
    viewStatistics?: boolean;
  };
}

export interface AdminUpdateRequest {
  username?: string;
  permissions?: {
    manageAdmins?: boolean;
    manageStudents?: boolean;
    manageTrees?: boolean;
    managePoints?: boolean;
    manageWifiSessions?: boolean;
    manageTreeTypes?: boolean;
    manageRealTrees?: boolean;
    viewStatistics?: boolean;
  };
}

export interface AdminPasswordResetRequest {
  newPassword: string;
} 