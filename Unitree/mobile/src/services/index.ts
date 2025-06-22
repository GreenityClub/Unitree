export { authService } from './authService';
export { wifiService } from './wifiService';
export { default as WifiMonitor } from './WifiMonitor';
export { default as ApiService } from './ApiService';
export { treeService } from './treeService';
export { eventService } from './eventService';
export { pointsService } from './pointsService';
export { default as userService } from './userService';
export { default as locationService } from './locationService';

// Load location test commands in development
if (__DEV__) {
  import('../utils/locationTestConsole');
}
 
export type { LoginCredentials, RegisterData, AuthResponse } from './authService';
export type { WiFiSession, StartSessionData } from './wifiService';
export type { Tree, RedeemTreeData, RealTree } from './treeService';
export type { Transaction, PointsState, PointsResponse, RedeemTreeResponse } from './pointsService';
export type { ProfileUpdateData, PasswordChangeData } from './userService'; 