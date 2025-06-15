import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { Button, Card } from '../../components';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';
import { Formatters } from '../../utils';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { 
    isConnected, 
    currentSSID, 
    connectionType,
    currentSession, 
    sessionHistory, 
    refreshHistory 
  } = useWiFi();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshHistory();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getConnectionStatusText = () => {
    if (!connectionType) {
      return 'Checking connection...';
    }
    
    if (connectionType === 'wifi') {
      if (isConnected) {
        return `Connected to university WiFi: ${currentSSID}`;
      } else {
        return `Connected to WiFi: ${currentSSID || 'Unknown'} (Not a university network)`;
      }
    }
    
    return `Connected via ${connectionType} (WiFi required for points)`;
  };

  const getConnectionStatusColor = () => {
    if (isConnected) {
      return colors.success;
    } else if (connectionType === 'wifi') {
      return colors.warning;
    }
    return colors.error;
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
        <Text style={styles.title}>🌳 Welcome to UniTree</Text>
        <Text style={styles.subtitle}>
          Earn points by attending classes, plant real trees!
        </Text>
      </View>

      {/* User Stats */}
      <Card style={styles.statsCard}>
        <Text style={styles.cardTitle}>Your Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.points || 0}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.trees?.length || 0}</Text>
            <Text style={styles.statLabel}>Trees Planted</Text>
          </View>
        </View>
        <Text style={styles.exchangeRate}>
          💡 100 points = 1 tree sapling
        </Text>
      </Card>

      {/* Network Status */}
      <Card style={styles.networkCard}>
        <Text style={styles.cardTitle}>Network Status</Text>
        <View style={styles.networkStatus}>
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getConnectionStatusColor() }
            ]} 
          />
          <Text style={styles.networkText}>
            {getConnectionStatusText()}
          </Text>
        </View>
        {connectionType && (
          <Text style={styles.networkDetails}>
            Connection Type: {connectionType.toUpperCase()}
          </Text>
        )}
      </Card>

      {/* Current Session */}
      {currentSession && (
        <Card style={styles.sessionCard}>
          <Text style={styles.cardTitle}>📡 Active Session</Text>
          <Text style={styles.sessionText}>
            Connected to: {currentSession.ssid}
          </Text>
          <Text style={styles.sessionText}>
            Started: {Formatters.formatTime(new Date(currentSession.startTime))}
          </Text>
          <Text style={styles.sessionText}>
            Duration: {Formatters.formatDuration(
              Date.now() - new Date(currentSession.startTime).getTime()
            )}
          </Text>
          <Text style={styles.earnedPoints}>
            ⏱️ Earning points while connected to university WiFi!
          </Text>
        </Card>
      )}

      {/* Recent Sessions */}
      {sessionHistory.length > 0 && (
        <Card style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {sessionHistory.slice(0, 3).map((session) => (
            <View key={session._id} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historySSID}>{session.ssid}</Text>
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
              {session.pointsEarned && (
                <Text style={styles.historyPoints}>
                  +{session.pointsEarned} pts
                </Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <Button
          title="View All Trees"
          onPress={() => {/* Navigate to trees */}}
          style={styles.actionButton}
        />
        <Button
          title="Redeem Points"
          onPress={() => {/* Navigate to redemption */}}
          disabled={!user?.points || user.points < 100}
          style={styles.actionButton}
        />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Connect to university WiFi to start earning points!
        </Text>
      </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  exchangeRate: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  networkCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  networkText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  networkDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 24,
  },
  sessionCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
    backgroundColor: colors.backgroundGreen,
  },
  sessionText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  earnedPoints: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    marginTop: 8,
  },
  historyCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historySSID: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  actionsCard: {
    margin: spacing.component.screenPadding,
    marginTop: 0,
  },
  actionButton: {
    marginBottom: 12,
  },
  footer: {
    padding: spacing.component.screenPadding,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 