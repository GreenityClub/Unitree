import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBackgroundSync } from '../../context/BackgroundSyncContext';
import { useNotifications } from '../../context/NotificationContext';
import { rf, rs } from '../../utils/responsive';
import { colors } from '../../theme';

const SystemSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { isBackgroundMonitoringEnabled, enableBackgroundMonitoring, disableBackgroundMonitoring } = useBackgroundSync();
  const { notificationSettings, updateNotificationSettings, isInitialized: notificationsInitialized } = useNotifications();
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const toggleNotificationSetting = async (setting: string) => {
    if (!notificationSettings || isUpdatingSettings) return;

    const currentValue = notificationSettings[setting as keyof typeof notificationSettings] as boolean;
    const newValue = !currentValue;

    setIsUpdatingSettings(true);
    
    try {
      // Update notification settings directly
      const updatedSettings = { 
        ...notificationSettings,
        [setting]: newValue 
      };

      // Save to persistent storage through notification context
      await updateNotificationSettings(updatedSettings);
      console.log(`✅ ${setting} notification setting updated to:`, newValue);
      
    } catch (error) {
      console.error(`❌ Failed to update ${setting} notification setting:`, error);
      
      Alert.alert(
        'Settings Error', 
        'Failed to save notification settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleBackgroundMonitoringToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enableBackgroundMonitoring();
      } else {
        await disableBackgroundMonitoring();
      }
    } catch (error) {
      console.error('Failed to toggle background monitoring:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* WiFi Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="wifi" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>WiFi & Connection</Text>
          </View>

          <View style={styles.card}>
            {/* Background Monitoring Toggle */}
            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <Icon name="sync" size={20} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Background Monitoring</Text>
                  <Text style={styles.settingDescription}>
                    Monitor WiFi connections when app is closed
                  </Text>
                </View>
              </View>
              <Switch
                value={isBackgroundMonitoringEnabled}
                onValueChange={handleBackgroundMonitoringToggle}
                trackColor={{ false: '#e0e0e0', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="bell" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.card}>
            {/* Points Updates */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="star" size={20} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Points Updates</Text>
                  <Text style={styles.settingDescription}>
                    Get notified when you earn points
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings?.pointsUpdates ?? true}
                onValueChange={() => toggleNotificationSetting('pointsUpdates')}
                trackColor={{ false: '#e0e0e0', true: colors.primary }}
                thumbColor={colors.white}
                disabled={isUpdatingSettings}
                style={{ opacity: isUpdatingSettings ? 0.6 : 1 }}
              />
            </View>

            {/* Tree Planting */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="tree" size={20} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Tree Planting</Text>
                  <Text style={styles.settingDescription}>
                    Get notified when trees are planted
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings?.treePlanting ?? true}
                onValueChange={() => toggleNotificationSetting('treePlanting')}
                trackColor={{ false: '#e0e0e0', true: colors.primary }}
                thumbColor={colors.white}
                disabled={isUpdatingSettings}
                style={{ opacity: isUpdatingSettings ? 0.6 : 1 }}
              />
            </View>

            {/* WiFi Connection */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="wifi" size={20} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>WiFi Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about connection status
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings?.wifiConnection ?? true}
                onValueChange={() => toggleNotificationSetting('wifiConnection')}
                trackColor={{ false: '#e0e0e0', true: colors.primary }}
                thumbColor={colors.white}
                disabled={isUpdatingSettings}
                style={{ opacity: isUpdatingSettings ? 0.6 : 1 }}
              />
            </View>

            {/* Achievements */}
            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <Icon name="trophy" size={20} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Achievements</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about new achievements
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings?.achievements ?? true}
                onValueChange={() => toggleNotificationSetting('achievements')}
                trackColor={{ false: '#e0e0e0', true: colors.primary }}
                thumbColor={colors.white}
                disabled={isUpdatingSettings}
                style={{ opacity: isUpdatingSettings ? 0.6 : 1 }}
              />
            </View>
          </View>
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="information" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Icon name="cellphone" size={20} color={colors.primary} />
                <Text style={styles.infoLabel}>App Version</Text>
              </View>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Icon name="code-tags" size={20} color={colors.primary} />
                <Text style={styles.infoLabel}>Build Number</Text>
              </View>
              <Text style={styles.infoValue}>1</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    flex: 1,
    fontSize: rf(20),
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: rs(16),
  },
  headerSpacer: {
    width: rs(40),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: rs(20),
  },
  section: {
    marginBottom: rs(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
    paddingHorizontal: rs(4),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: rs(12),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: rs(12),
    flex: 1,
  },
  settingTitle: {
    fontSize: rf(16),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginTop: rs(2),
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: rf(14),
    color: colors.textSecondary,
    marginLeft: rs(12),
  },
  infoValue: {
    fontSize: rf(14),
    fontWeight: '500',
    color: colors.textPrimary,
  },
});

export default SystemSettingsScreen; 