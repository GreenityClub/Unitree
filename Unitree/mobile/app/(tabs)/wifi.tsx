import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useWiFi } from '../../src/context/WiFiContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Card } from '../../src/components';
import SafeScreen from '../../src/components/SafeScreen';
import { colors, spacing } from '../../src/theme';
import { Formatters } from '../../src/utils';

export default function WiFiScreen() {
  const { user } = useAuth();
  const {
    isConnected,
    currentSSID,
    connectionType,
    currentSession,
    sessionHistory,
    startTracking,
    stopTracking,
    checkWiFiStatus,
    refreshHistory
  } = useWiFi();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkWiFiStatus();
      await refreshHistory();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualToggle = async () => {
    setLoading(true);
    try {
      if (currentSession) {
        await stopTracking();
        Alert.alert('Session Ended', 'WiFi tracking session has been stopped.');
      } else {
        if (!isConnected) {
          Alert.alert(
            'Not Connected', 
            'Please connect to a university WiFi network to start tracking.'
          );
          return;
        }
        await startTracking();
        Alert.alert('Session Started', 'WiFi tracking session has been started.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle tracking session.');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusIcon = () => {
    if (isConnected) return '🟢';
    if (connectionType === 'wifi') return '🟡';
    return '🔴';
  };

  const getConnectionDescription = () => {
    if (!connectionType) {
      return 'Checking your network connection...';
    }
    
    if (connectionType === 'wifi') {
      if (isConnected) {
        return 'You are connected to a university WiFi network. Points will be earned automatically while connected.';
      } else {
        return 'You are connected to WiFi, but it\'s not a recognized university network. Connect to university WiFi to earn points.';
      }
    }
    
    if (connectionType === 'cellular') {
      return 'You are using cellular data. Connect to university WiFi to start earning points.';
    }
    
    return `You are connected via ${connectionType}. University WiFi is required to earn points.`;
  };

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.header}>
        <Text style={styles.title}>📡 WiFi Tracking</Text>
        <Text style={styles.subtitle}>
          Connect to university WiFi to earn points automatically
        </Text>
      </View>

      {/* Connection Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{getConnectionStatusIcon()}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {isConnected ? 'Connected & Earning' : 'Not Earning Points'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {connectionType ? `${connectionType.toUpperCase()} Connection` : 'Checking...'}
            </Text>
          </View>
        </View>
        
        {currentSSID && (
          <View style={styles.networkInfo}>
            <Text style={styles.networkLabel}>Network:</Text>
            <Text style={styles.networkValue}>{currentSSID}</Text>
          </View>
        )}
        
        <Text style={styles.statusDescription}>
          {getConnectionDescription()}
        </Text>
      </Card>

      {/* Current Session */}
      {currentSession && (
        <Card style={[styles.sessionCard, { backgroundColor: colors.backgroundGreen }]}>
          <Text style={styles.cardTitle}>🏃‍♂️ Active Session</Text>
          <View style={styles.sessionDetails}>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Network:</Text>
              <Text style={styles.sessionValue}>{currentSession.ssid}</Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Started:</Text>
              <Text style={styles.sessionValue}>
                {Formatters.formatTime(new Date(currentSession.startTime))}
              </Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Duration:</Text>
              <Text style={styles.sessionValue}>
                {Formatters.formatDuration(
                  Date.now() - new Date(currentSession.startTime).getTime()
                )}
              </Text>
            </View>
          </View>
          
          <Button
            title="Stop Session"
            onPress={handleManualToggle}
            loading={loading}
            style={[styles.actionButton, { backgroundColor: colors.error }]}
          />
        </Card>
      )}

      {/* Manual Controls */}
      {!currentSession && (
        <Card style={styles.controlsCard}>
          <Text style={styles.cardTitle}>Manual Controls</Text>
          <Text style={styles.controlsDescription}>
            Normally, sessions start automatically when you connect to university WiFi. 
            You can also start a session manually if needed.
          </Text>
          
          <Button
            title={isConnected ? "Start Session" : "Connect to University WiFi First"}
            onPress={handleManualToggle}
            loading={loading}
            disabled={!isConnected}
            style={styles.actionButton}
          />
        </Card>
      )}

      {/* Session History */}
      <Card style={styles.historyCard}>
        <Text style={styles.cardTitle}>📊 Session History</Text>
        {sessionHistory.length > 0 ? (
          <View>
            {sessionHistory.slice(0, 10).map((session, index) => (
              <View key={session._id} style={styles.historyItem}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyNetwork}>{session.ssid}</Text>
                  <Text style={styles.historyDate}>
                    {Formatters.formatDate(new Date(session.startTime))}
                  </Text>
                  {session.endTime && (
                    <Text style={styles.historyDuration}>
                      Duration: {Formatters.formatDuration(
                        new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
                      )}
                    </Text>
                  )}
                </View>
                <View style={styles.historyPoints}>
                  {session.pointsEarned && (
                    <Text style={styles.pointsEarned}>+{session.pointsEarned}</Text>
                  )}
                  {!session.endTime && (
                    <Text style={styles.activeBadge}>ACTIVE</Text>
                  )}
                </View>
              </View>
            ))}
            
            {sessionHistory.length > 10 && (
              <Text style={styles.moreHistory}>
                ...and {sessionHistory.length - 10} more sessions
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noHistory}>
            No sessions yet. Connect to university WiFi to start your first session!
          </Text>
        )}
      </Card>

      {/* Tips */}
      <Card style={styles.tipsCard}>
        <Text style={styles.cardTitle}>💡 Tips</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>
            • Sessions start automatically when you connect to university WiFi
          </Text>
          <Text style={styles.tipItem}>
            • You earn 100 points per hour of connection time
          </Text>
          <Text style={styles.tipItem}>
            • Sessions end automatically when you disconnect or leave campus
          </Text>
          <Text style={styles.tipItem}>
            • Make sure location permissions are enabled for accurate detection
          </Text>
        </View>
      </Card>
    </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.component.screenPadding,
    paddingTop: spacing.component.screenPaddingVertical,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  networkInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  networkLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 80,
  },
  networkValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sessionCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sessionDetails: {
    marginBottom: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    width: 80,
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  controlsCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  controlsDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
  },
  historyCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyMain: {
    flex: 1,
  },
  historyNetwork: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyPoints: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pointsEarned: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.backgroundGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  moreHistory: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  noHistory: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  tipsCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
    marginBottom: spacing.component.screenPaddingVertical,
  },
  tipsList: {
    marginLeft: 8,
  },
  tipItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
}); 