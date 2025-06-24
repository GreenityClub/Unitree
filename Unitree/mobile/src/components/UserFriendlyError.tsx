import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';
import { rf, rs } from '../utils/responsive';

interface UserFriendlyErrorProps {
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showIcon?: boolean;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  visible?: boolean;
}

export const UserFriendlyError: React.FC<UserFriendlyErrorProps> = ({
  title = 'Notice',
  message,
  type = 'info',
  showIcon = true,
  actionText,
  onAction,
  onDismiss,
  visible = true
}) => {
  if (!visible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', color: colors.success };
      case 'warning':
        return { icon: 'alert-circle', color: colors.warning };
      case 'error':
        return { icon: 'close-circle', color: colors.error };
      default:
        return { icon: 'information', color: colors.primary };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          {showIcon && (
            <Icon name={icon} size={24} color={color} style={styles.icon} />
          )}
          <Text style={[styles.title, { color }]}>{title}</Text>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.message}>{message}</Text>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} style={[styles.actionButton, { backgroundColor: color }]}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const showUserFriendlyAlert = (
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  actions?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
) => {
  const buttons = actions || [{ text: 'OK' }];
  
  Alert.alert(title, message, buttons);
};

// Helper functions for common error scenarios
export const ErrorHandlers = {
  networkError: () => showUserFriendlyAlert(
    'Connection Issue', 
    'Unable to connect to the server. Please check your internet connection and try again.',
    'error'
  ),

  authenticationError: () => showUserFriendlyAlert(
    'Session Expired',
    'Your session has expired. Please log in again to continue.',
    'warning'
  ),

  wifiValidationError: () => showUserFriendlyAlert(
    'WiFi Connection Required',
    'Please connect to your university WiFi network and make sure you are on campus to start earning points.',
    'info'
  ),

  locationPermissionError: () => showUserFriendlyAlert(
    'Location Permission Required',
    'This app needs location access to verify you are on campus. Please enable location permissions in your device settings.',
    'warning'
  ),

  backgroundSyncError: () => showUserFriendlyAlert(
    'Sync Issue',
    'Some data could not be synced. The app will try again automatically.',
    'warning'
  ),

  serverError: () => showUserFriendlyAlert(
    'Service Temporarily Unavailable',
    'Our servers are experiencing issues. Please try again in a few minutes.',
    'error'
  ),

  unknownError: () => showUserFriendlyAlert(
    'Something Went Wrong',
    'An unexpected error occurred. If this continues, please contact support.',
    'error'
  )
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: rs(8),
    borderLeftWidth: rs(4),
    margin: rs(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: rs(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  icon: {
    marginRight: rs(8),
  },
  title: {
    fontSize: rf(16),
    fontWeight: 'bold',
    flex: 1,
  },
  dismissButton: {
    padding: rs(4),
  },
  message: {
    fontSize: rf(14),
    color: colors.textPrimary,
    lineHeight: rf(20),
    marginBottom: rs(12),
  },
  actionButton: {
    paddingVertical: rs(8),
    paddingHorizontal: rs(16),
    borderRadius: rs(4),
    alignSelf: 'flex-start',
  },
  actionText: {
    color: colors.white,
    fontSize: rf(14),
    fontWeight: '500',
  },
}); 