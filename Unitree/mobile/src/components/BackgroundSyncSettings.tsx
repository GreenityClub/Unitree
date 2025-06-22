import React, { useState } from 'react';
import { View, Text, Switch, Alert, StyleSheet } from 'react-native';
import { useBackgroundSync } from '../context/BackgroundSyncContext';
import Button from './common/Button';
import Card from './common/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface BackgroundSyncSettingsProps {
  onClose?: () => void;
}

const BackgroundSyncSettings: React.FC<BackgroundSyncSettingsProps> = ({ onClose }) => {
  const {
    isBackgroundMonitoringEnabled,
    enableBackgroundMonitoring,
    disableBackgroundMonitoring,
    syncStats,
    refreshSyncStats,
    performForegroundSync,
    isInitialized,
    isSyncing
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

  const handleManualSync = async () => {
    try {
      setIsLoading(true);
      const result = await performForegroundSync();
      
      if (result.synced > 0) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.synced} background session${result.synced !== 1 ? 's' : ''}.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Data to Sync',
          'All background sessions are already synchronized.',
          [{ text: 'OK' }]
        );
      }
      
      await refreshSyncStats();
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to sync background data. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hrs ago`;
    return date.toLocaleDateString();
  };

  if (!isInitialized) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>Background Sync</Text>
        <Text style={styles.description}>Initializing background sync settings...</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Background WiFi Monitoring</Text>
      
      <Text style={styles.description}>
        Enable background monitoring to track WiFi sessions even when the app is closed. 
        This ensures you never miss earning points for university WiFi usage.
      </Text>

      <View style={styles.settingRow}>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>Background Monitoring</Text>
          <Text style={styles.settingSubtext}>
            {isBackgroundMonitoringEnabled 
              ? 'Track WiFi when app is closed' 
              : 'Only track when app is open'
            }
          </Text>
        </View>
        <Switch
          value={isBackgroundMonitoringEnabled}
          onValueChange={handleToggleBackgroundMonitoring}
          disabled={isLoading}
          trackColor={{ false: colors.gray, true: colors.primary }}
          thumbColor={isBackgroundMonitoringEnabled ? colors.white : colors.lightGray}
        />
      </View>

      {syncStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Sync Status</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Pending Sessions:</Text>
            <Text style={styles.statValue}>{syncStats.pendingCount}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last Sync:</Text>
            <Text style={styles.statValue}>{formatLastSync(syncStats.lastSync)}</Text>
          </View>
          
          {syncStats.currentSession && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Background Session:</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>Active</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {syncStats?.pendingCount > 0 && (
          <Button
            title={isSyncing ? 'Syncing...' : `Sync ${syncStats.pendingCount} Session${syncStats.pendingCount !== 1 ? 's' : ''}`}
            onPress={handleManualSync}
            disabled={isLoading || isSyncing}
            variant="secondary"
            style={styles.syncButton}
          />
        )}
        
        <Button
          title="Refresh Status"
          onPress={refreshSyncStats}
          disabled={isLoading}
          variant="outline"
          style={styles.refreshButton}
        />
        
        {onClose && (
          <Button
            title="Close"
            onPress={onClose}
            variant="primary"
            style={styles.closeButton}
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • Background monitoring tracks WiFi connections with minimal battery usage{'\n'}
          • Data syncs automatically when you open the app{'\n'}
          • Only university WiFi sessions earn points{'\n'}
          • Your privacy is protected - only connection times and duration are tracked
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    margin: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  settingText: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  syncButton: {
    backgroundColor: colors.warning,
  },
  refreshButton: {
    marginTop: spacing.xs,
  },
  closeButton: {
    marginTop: spacing.sm,
  },
  infoContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default BackgroundSyncSettings; 