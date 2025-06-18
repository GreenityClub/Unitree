import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Text, ProgressBar, Card, Chip } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { wifiService } from '../../services/wifiService';
import type { WiFiStats } from '../../services/wifiService';
import { formatSessionDuration, formatMinutesToHHMMSS } from '../../utils/timeUtils';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';
import ENV from '../../config/env';

interface StatItemProps {
  label: string;
  duration: number;
  points: number;
  sessions: number;
  icon: string;
  resetTime?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, duration, points, sessions, icon, resetTime }) => (
  <Card style={styles.statCard}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={24} color="#50AF27" />
      <Text style={styles.statLabel}>{label}</Text>
      {resetTime && <Chip style={styles.resetChip} textStyle={styles.resetText}>{resetTime}</Chip>}
    </View>
    <View style={styles.statDetails}>
      <View style={styles.statRow}>
        <Icon name="clock-outline" size={16} color="#666" />
        <Text style={styles.statText}>Time: {wifiService.formatDurationHuman(duration)}</Text>
      </View>
      <View style={styles.statRow}>
        <Icon name="star-outline" size={16} color="#666" />
        <Text style={styles.statText}>Points: {points}</Text>
      </View>
      <View style={styles.statRow}>
        <Icon name="wifi" size={16} color="#666" />
        <Text style={styles.statText}>Sessions: {sessions}</Text>
      </View>
    </View>
  </Card>
);

const WifiStatusScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    isConnected, 
    currentSession, 
    currentSSID, 
    currentBSSID,
    wifiStats,
    sessionDuration,
    potentialPoints,
    refreshStats,
    checkWiFiStatus 
  } = useWiFi();
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Update time every second for real-time display
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkWiFiStatus(),
        refreshStats(),
      ]);
    } catch (error) {
      console.error('Error refreshing WiFi status data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [checkWiFiStatus, refreshStats]);

  const getWifiStatusIcon = () => {
    return isConnected ? 'wifi' : 'wifi-off';
  };

  const getWifiStatusColor = () => {
    return isConnected ? '#50AF27' : '#FF6B6B';
  };

  const getConnectionStatus = () => {
    if (isConnected && currentSSID) {
      return `Connected to ${currentSSID}`;
    }
    return 'Not connected to university WiFi';
  };

  const getBSSIDStatus = () => {
    if (currentBSSID) {
      const prefix = wifiService.extractBSSIDPrefix(currentBSSID);
      const isValid = wifiService.isValidUniversityBSSID(currentBSSID);
      return {
        bssid: currentBSSID,
        prefix,
        isValid,
      };
    }
    return null;
  };

  const getHourProgressInfo = () => {
    if (!currentSession || sessionDuration === 0) {
      return {
        progress: 0,
        minutesToNext: 60,
        nextPoints: ENV.POINTS_PER_HOUR,
        currentMinutes: 0,
        currentHourProgress: 0
      };
    }

    const currentMinutes = Math.floor(sessionDuration / 60);
    const minutesInCurrentHour = currentMinutes % 60;
    const progress = minutesInCurrentHour / 60;
    const minutesToNext = 60 - minutesInCurrentHour;

    return {
      progress,
      minutesToNext,
      nextPoints: ENV.POINTS_PER_HOUR,
      currentMinutes,
      currentHourProgress: minutesInCurrentHour
    };
  };

  const getResetTimes = () => {
    return {
      dayReset: wifiService.formatDurationHuman(wifiService.getTimeUntilDayReset()),
      weekReset: wifiService.formatDurationHuman(wifiService.getTimeUntilWeekReset()),
      monthReset: wifiService.formatDurationHuman(wifiService.getTimeUntilMonthReset()),
    };
  };

  const hourProgress = getHourProgressInfo();
  const bssidStatus = getBSSIDStatus();
  const resetTimes = getResetTimes();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#50AF27" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>WiFi Tracking</Text>
            <Text style={styles.headerSubtitle}>Real-time connection monitoring</Text>
          </View>
        </Animated.View>

        {/* Current Status */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Icon 
                name={getWifiStatusIcon()} 
                size={32} 
                color={getWifiStatusColor()} 
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>{getConnectionStatus()}</Text>
                {bssidStatus && (
                  <View style={styles.bssidContainer}>
                    <Text style={styles.bssidText}>
                      BSSID: {bssidStatus.prefix}:xx:xx
                    </Text>
                    <Chip 
                      style={[
                        styles.validationChip,
                        { backgroundColor: bssidStatus.isValid ? '#E8F5E8' : '#FFF0F0' }
                      ]}
                      textStyle={{
                        color: bssidStatus.isValid ? '#50AF27' : '#FF6B6B',
                        fontSize: 12
                      }}
                    >
                      {bssidStatus.isValid ? 'Valid' : 'Invalid'}
                    </Chip>
                  </View>
                )}
              </View>
            </View>
            
            {currentSession && (
              <View style={styles.sessionInfo}>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionLabel}>Session Time:</Text>
                  <Text style={styles.sessionValue}>
                    {wifiService.formatSessionDuration(sessionDuration)}
                  </Text>
                </View>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionLabel}>Potential Points:</Text>
                  <Text style={styles.sessionValue}>{potentialPoints}</Text>
                </View>
                
                {/* Hour Progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      Progress to next {ENV.POINTS_PER_HOUR} points
                    </Text>
                    <Text style={styles.progressTime}>
                      {hourProgress.minutesToNext}m remaining
                    </Text>
                  </View>
                  <ProgressBar 
                    progress={hourProgress.progress} 
                    color="#50AF27" 
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressDetails}>
                    {hourProgress.currentHourProgress} of 60 minutes completed
                  </Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Statistics */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Time Period Statistics</Text>
          
          {wifiStats ? (
            <>
              <StatItem
                label="Today"
                duration={wifiStats.today.duration}
                points={wifiStats.today.points}
                sessions={wifiStats.today.sessions}
                icon="calendar-today"
                resetTime={`Resets in ${resetTimes.dayReset}`}
              />
              
              <StatItem
                label="This Week"
                duration={wifiStats.week.duration}
                points={wifiStats.week.points}
                sessions={wifiStats.week.sessions}
                icon="calendar-week"
                resetTime={`Resets in ${resetTimes.weekReset}`}
              />
              
              <StatItem
                label="This Month"
                duration={wifiStats.month.duration}
                points={wifiStats.month.points}
                sessions={wifiStats.month.sessions}
                icon="calendar-month"
                resetTime={`Resets in ${resetTimes.monthReset}`}
              />
              
              <StatItem
                label="Total Time"
                duration={wifiStats.total.duration}
                points={wifiStats.total.points}
                sessions={wifiStats.total.sessions}
                icon="clock-outline"
              />
            </>
          ) : (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </Card>
          )}
        </Animated.View>

        {/* WiFi Configuration Info */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.configContainer}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Card style={styles.configCard}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Points per Hour:</Text>
              <Text style={styles.configValue}>{ENV.POINTS_PER_HOUR}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Required BSSID Prefix:</Text>
              <Text style={styles.configValue}>{ENV.UNIVERSITY_BSSID_PREFIX}:xx:xx</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Update Interval:</Text>
              <Text style={styles.configValue}>{ENV.SESSION_UPDATE_INTERVAL}s</Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    marginBottom: 20,
    padding: 16,
    elevation: 4,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bssidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bssidText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  validationChip: {
    height: 24,
  },
  sessionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 16,
    color: '#666',
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#50AF27',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statCard: {
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    borderRadius: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  resetChip: {
    backgroundColor: '#E8F5E8',
    height: 28,
  },
  resetText: {
    fontSize: 12,
    color: '#50AF27',
  },
  statDetails: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  configContainer: {
    marginBottom: 20,
  },
  configCard: {
    padding: 16,
    elevation: 2,
    borderRadius: 8,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default WifiStatusScreen; 