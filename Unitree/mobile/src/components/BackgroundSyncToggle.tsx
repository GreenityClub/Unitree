import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { List, Switch, Text } from 'react-native-paper';
import { useBackgroundSync } from '../context/BackgroundSyncContext';
import { theme } from '../theme';
import { rs, rf } from '../utils/responsive';

const BackgroundSyncToggle: React.FC = () => {
  const {
    isBackgroundMonitoringEnabled,
    enableBackgroundMonitoring,
    disableBackgroundMonitoring,
    syncStats,
    isInitialized
  } = useBackgroundSync();

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleBackgroundMonitoring = async (enabled: boolean) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (enabled) {
        await enableBackgroundMonitoring();
        Alert.alert(
          'Background Monitoring Enabled',
          'Your WiFi sessions will now be tracked even when the app is closed. This helps ensure you never miss earning points for your university WiFi usage.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Disable Background Monitoring?',
          'You will only earn points when the app is open. Background WiFi tracking will be stopped.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disableBackgroundMonitoring();
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to update background monitoring settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <List.Item
        title="Background WiFi Monitoring"
        description="Initializing..."
        left={props => <List.Icon {...props} icon="sync" color={theme.colors.primary} />}
      />
    );
  }

  const description = isBackgroundMonitoringEnabled 
    ? `Enabled - Track WiFi when app is closed${syncStats?.pendingCount ? ` (${syncStats.pendingCount} pending)` : ''}`
    : 'Disabled - Only track when app is open';

  return (
    <View>
      <List.Item
        title="Background WiFi Monitoring"
        description={description}
        left={props => <List.Icon {...props} icon="sync" color={theme.colors.primary} />}
        right={() => (
          <Switch
            value={isBackgroundMonitoringEnabled}
            onValueChange={handleToggleBackgroundMonitoring}
            disabled={isLoading}
            color={theme.colors.primary}
          />
        )}
      />
      
      {isBackgroundMonitoringEnabled && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Background monitoring tracks WiFi connections with minimal battery usage. 
            Data syncs automatically when you open the app.
          </Text>
          {syncStats?.pendingCount > 0 && (
            <Text style={styles.pendingText}>
              {syncStats.pendingCount} session{syncStats.pendingCount !== 1 ? 's' : ''} pending sync
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    marginLeft: rs(16),
    marginRight: rs(16),
    marginBottom: rs(8),
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    backgroundColor: theme.colors.backgroundSecondary || '#F5F5F5',
    borderRadius: rs(8),
  },
  infoText: {
    fontSize: rf(12),
    color: theme.colors.textSecondary,
    lineHeight: rf(16),
  },
  pendingText: {
    fontSize: rf(12),
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: rs(4),
  },
});

export default BackgroundSyncToggle; 