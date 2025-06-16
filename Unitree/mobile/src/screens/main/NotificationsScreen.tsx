import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';
import { Card, IconSymbol } from '../../components';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'achievement' | 'points' | 'tree' | 'wifi';
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Achievement Unlocked!',
    message: 'You\'ve earned the "Early Bird" badge',
    timestamp: '2 hours ago',
    type: 'achievement',
    read: false,
  },
  {
    id: '2',
    title: 'Points Update',
    message: 'You\'ve earned 50 points for your recent activity',
    timestamp: '5 hours ago',
    type: 'points',
    read: false,
  },
  {
    id: '3',
    title: 'Tree Planted Successfully',
    message: 'Your virtual tree has been planted in the forest',
    timestamp: '1 day ago',
    type: 'tree',
    read: true,
  },
  {
    id: '4',
    title: 'WiFi Status Update',
    message: 'Your device is now connected to the network',
    timestamp: '2 days ago',
    type: 'wifi',
    read: true,
  },
];

export default function NotificationsScreen() {
  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return 'trophy';
      case 'points':
        return 'star';
      case 'tree':
        return 'tree';
      case 'wifi':
        return 'wifi';
      default:
        return 'bell';
    }
  };

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <Link href="/notification-settings" asChild>
            <TouchableOpacity style={styles.settingsButton}>
              <IconSymbol name="settings" size={24} color={colors.primary} />
            </TouchableOpacity>
          </Link>
        </View>

        {mockNotifications.map(notification => (
          <Card key={notification.id} style={[styles.notificationCard, notification.read && styles.readCard]}>
            <View style={styles.notificationContent}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  name={getIconForType(notification.type)} 
                  size={24} 
                  color={notification.read ? colors.textSecondary : colors.primary} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.notificationTitle, notification.read && styles.readText]}>
                  {notification.title}
                </Text>
                <Text style={[styles.notificationMessage, notification.read && styles.readText]}>
                  {notification.message}
                </Text>
                <Text style={styles.timestamp}>{notification.timestamp}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.component.screenPadding,
    paddingTop: spacing.component.screenPaddingVertical,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  settingsButton: {
    padding: 8,
  },
  notificationCard: {
    marginHorizontal: spacing.component.screenPadding,
    marginBottom: spacing.component.md,
    padding: spacing.component.md,
  },
  readCard: {
    opacity: 0.8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: spacing.component.md,
    padding: spacing.component.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  readText: {
    color: colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
}); 