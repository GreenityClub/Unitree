import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Platform, Switch } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../context/NotificationContext';
import { NotificationSettings as NotificationSettingsType } from '../services/notificationService';
import Button from './common/Button';
import Card from './common/Card';
import { colors } from '../theme';

export default function NotificationSettings() {
  const { 
    notificationSettings, 
    updateNotificationSettings, 
    sendTestNotification,
    areNotificationsEnabled,
    isInitialized 
  } = useNotifications();

  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [isSystemEnabled, setIsSystemEnabled] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (notificationSettings) {
      setSettings(notificationSettings);
    }
  }, [notificationSettings]);

  useEffect(() => {
    const checkSystemPermissions = async () => {
      if (isInitialized) {
        const enabled = await areNotificationsEnabled();
        setIsSystemEnabled(enabled);
      }
    };

    checkSystemPermissions();
  }, [isInitialized]);

  const handleSettingChange = async (key: keyof NotificationSettingsType, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setIsSaving(true);
      await updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert changes
      setSettings(notificationSettings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime && settings) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      handleSettingChange('dailyStatsTime', timeString);
    }
  };

  const handleTestNotification = async (type: 'daily' | 'weekly' | 'monthly') => {
    try {
      await sendTestNotification(type);
      Alert.alert('Test Sent', `${type.charAt(0).toUpperCase() + type.slice(1)} notification sent successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const getTimeFromString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const getDayName = (dayNumber: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (!isInitialized || !settings) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  if (!isSystemEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>📱 Notifications</Text>
        <Text style={styles.warningText}>
          Notifications are disabled in system settings. Please enable them in your device settings to use this feature.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📱 Notifications</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive reminders from server when app is closed (7 AM - 6 PM)
            </Text>
          </View>
          <Switch
            value={settings.pushNotificationsEnabled}
            onValueChange={(value) => handleSettingChange('pushNotificationsEnabled', value)}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={settings.pushNotificationsEnabled ? colors.primary : '#f4f3f4'}
            disabled={isSaving}
          />
        </View>

        {/* App Reminder Notifications */}
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>App Reminders</Text>
            <Text style={styles.settingDescription}>
              Get reminded to open the app during business hours
            </Text>
          </View>
          <Switch
            value={settings.appReminderNotifications}
            onValueChange={(value) => handleSettingChange('appReminderNotifications', value)}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={settings.appReminderNotifications ? colors.primary : '#f4f3f4'}
            disabled={isSaving || !settings.pushNotificationsEnabled}
          />
        </View>

        {/* Stats Notifications */}
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Stats Notifications</Text>
            <Text style={styles.settingDescription}>
              Get daily, weekly, and monthly WiFi usage statistics
            </Text>
          </View>
          <Switch
            value={settings.statsNotifications}
            onValueChange={(value) => handleSettingChange('statsNotifications', value)}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={settings.statsNotifications ? colors.primary : '#f4f3f4'}
            disabled={isSaving}
          />
        </View>

        {settings.statsNotifications && (
          <>
            {/* Daily Stats Time */}
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Daily Stats Time</Text>
                <Text style={styles.settingDescription}>
                  When to receive daily statistics: {settings.dailyStatsTime}
                </Text>
              </View>
              <PaperButton
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                disabled={isSaving}
                style={styles.timeButton}
              >
                {settings.dailyStatsTime}
              </PaperButton>
            </View>

            {/* Weekly Stats Day */}
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Weekly Stats Day</Text>
                <Text style={styles.settingDescription}>
                  Day of the week: {getDayName(settings.weeklyStatsDay)}
                </Text>
              </View>
              <View style={styles.daySelector}>
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <PaperButton
                    key={day}
                    mode={settings.weeklyStatsDay === day ? "contained" : "outlined"}
                    onPress={() => handleSettingChange('weeklyStatsDay', day)}
                    disabled={isSaving}
                    style={styles.dayButton}
                    contentStyle={styles.dayButtonContent}
                  >
                    {getDayName(day).slice(0, 3)}
                  </PaperButton>
                ))}
              </View>
            </View>

            {/* Monthly Stats Day */}
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Monthly Stats Day</Text>
                <Text style={styles.settingDescription}>
                  Day of the month: {settings.monthlyStatsDay}
                </Text>
              </View>
              <PaperButton
                mode="outlined"
                onPress={() => {
                  // Use a simple alert for cross-platform compatibility
                  const days = Array.from({length: 31}, (_, i) => i + 1);
                  const dayOptions = days.map(day => ({
                    text: `Day ${day}`,
                    onPress: () => handleSettingChange('monthlyStatsDay', day)
                  }));
                  
                  Alert.alert(
                    'Monthly Stats Day',
                    'Choose the day of the month:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      ...dayOptions.slice(0, 3), // Show first 3 options, or implement a picker
                      { 
                        text: 'More...', 
                        onPress: () => {
                          // For now, just cycle through common days
                          const nextDay = settings.monthlyStatsDay >= 28 ? 1 : settings.monthlyStatsDay + 1;
                          handleSettingChange('monthlyStatsDay', nextDay);
                        }
                      }
                    ]
                  );
                }}
                disabled={isSaving}
                style={styles.timeButton}
              >
                Day {settings.monthlyStatsDay}
              </PaperButton>
            </View>

            {/* Test Notifications */}
            <View style={styles.testSection}>
              <Text style={styles.testTitle}>Test Notifications</Text>
              <View style={styles.testButtons}>
                <Button
                  title="Daily"
                  onPress={() => handleTestNotification('daily')}
                  style={[styles.testButton, { backgroundColor: colors.secondary }]}
                />
                <Button
                  title="Weekly"
                  onPress={() => handleTestNotification('weekly')}
                  style={[styles.testButton, { backgroundColor: colors.secondary }]}
                />
                <Button
                  title="Monthly"
                  onPress={() => handleTestNotification('monthly')}
                  style={[styles.testButton, { backgroundColor: colors.secondary }]}
                />
              </View>
            </View>
          </>
        )}

        {/* Time Picker Modal */}
        {showTimePicker && (
          <DateTimePicker
            value={getTimeFromString(settings.dailyStatsTime)}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
  },
  warningText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timeButton: {
    minWidth: 80,
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayButton: {
    minWidth: 40,
  },
  dayButtonContent: {
    paddingHorizontal: 4,
  },
  testSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    paddingVertical: 8,
  },
}); 