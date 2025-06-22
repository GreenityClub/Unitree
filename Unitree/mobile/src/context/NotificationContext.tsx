import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import notificationService, { NotificationSettings, StatsData } from '../services/notificationService';
import { useAuth } from './AuthContext';
import pointsService from '../services/pointsService';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface NotificationContextType {
  notificationSettings: NotificationSettings | null;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  sendTestNotification: (type: 'daily' | 'weekly' | 'monthly') => Promise<void>;
  getScheduledNotifications: () => Promise<any[]>;
  areNotificationsEnabled: () => Promise<boolean>;
  isInitialized: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const appState = React.useRef(AppState.currentState);
  const lastActiveTime = React.useRef<Date>(new Date());

  // Initialize notification service when user is authenticated
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isAuthenticated) {
        setIsInitialized(false);
        return;
      }

      try {
        // Initialize notification service
        await notificationService.initialize();

        // Load notification settings
        const settings = await notificationService.getNotificationSettings();
        setNotificationSettings(settings);

        // Schedule notifications based on settings
        await notificationService.scheduleStatsNotifications(settings);

        setIsInitialized(true);
        console.log('✅ Notification context initialized');
      } catch (error) {
        console.error('❌ Failed to initialize notification context:', error);
        
        // Still mark as initialized if it's just a Firebase configuration issue
        // This allows the app to function without push notifications
        if (error.message?.includes('FirebaseApp is not initialized')) {
          console.warn('⚠️ Push notifications disabled - Firebase not configured');
          setIsInitialized(true); // App can still function
        } else {
          setIsInitialized(false);
        }
      }
    };

    initializeNotifications();
  }, [isAuthenticated]);

  // Handle app state changes for push notification reminders
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed for notifications:', appState.current, '->', nextAppState);

      if (appState.current === 'background' && nextAppState === 'active') {
        // App came to foreground - update last active time
        lastActiveTime.current = new Date();
        console.log('🔄 App came to foreground, updating last active time');
      } else if (nextAppState === 'background') {
        // App going to background - record time for potential reminder
        lastActiveTime.current = new Date();
        console.log('🌙 App going to background at:', lastActiveTime.current);
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Update notification settings
  const updateNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    try {
      await notificationService.saveNotificationSettings(settings);
      setNotificationSettings(settings);
      console.log('✅ Notification settings updated');
    } catch (error) {
      console.error('❌ Failed to update notification settings:', error);
      throw error;
    }
  };

  // Send test notification with current stats
  const sendTestNotification = async (type: 'daily' | 'weekly' | 'monthly'): Promise<void> => {
    try {
      // Get current stats from server
      const stats = await getCurrentStats();
      await notificationService.sendStatsNotification(type, stats);
      console.log(`✅ Test ${type} notification sent`);
    } catch (error) {
      console.error(`❌ Failed to send test ${type} notification:`, error);
      throw error;
    }
  };

  // Get current user stats for notifications
  const getCurrentStats = async (): Promise<StatsData> => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const thisWeek = startOfWeek(now);
      const thisMonth = startOfMonth(now);

      // Get stats for different periods
      const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
        pointsService.getPointsHistory('daily', format(today, 'yyyy-MM-dd')),
        pointsService.getPointsHistory('weekly', format(thisWeek, 'yyyy-MM-dd')),
        pointsService.getPointsHistory('monthly', format(thisMonth, 'yyyy-MM-dd')),
      ]);

      return {
        dailyTime: dailyStats?.totalTime || 0,
        weeklyTime: weeklyStats?.totalTime || 0,
        monthlyTime: monthlyStats?.totalTime || 0,
        dailyPoints: dailyStats?.totalPoints || 0,
        weeklyPoints: weeklyStats?.totalPoints || 0,
        monthlyPoints: monthlyStats?.totalPoints || 0,
      };
    } catch (error) {
      console.error('❌ Failed to get current stats:', error);
      // Return empty stats if failed
      return {
        dailyTime: 0,
        weeklyTime: 0,
        monthlyTime: 0,
        dailyPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
      };
    }
  };

  // Get scheduled notifications (for debugging)
  const getScheduledNotifications = async (): Promise<any[]> => {
    try {
      return await notificationService.getScheduledNotifications();
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  };

  // Check if notifications are enabled
  const areNotificationsEnabled = async (): Promise<boolean> => {
    try {
      return await notificationService.areNotificationsEnabled();
    } catch (error) {
      console.error('❌ Failed to check notification status:', error);
      return false;
    }
  };

  const value: NotificationContextType = {
    notificationSettings,
    updateNotificationSettings,
    sendTestNotification,
    getScheduledNotifications,
    areNotificationsEnabled,
    isInitialized,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 