import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { wifiService } from '../../services/wifiService';
import type { WiFiSession } from '../../services/wifiService';
import { formatSessionDuration, formatMinutesToHHMMSS } from '../../utils/timeUtils';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';

interface Stats {
  today: { duration: number; points: number };
  week: { duration: number; points: number };
  month: { duration: number; points: number };
  total: { duration: number; points: number };
}

interface TimeTracking {
  timeTracking: {
    total: {
      minutes: number;
      hours: number;
    };
  };
  pointsFromTotalTime: number;
}

interface StatItemProps {
  label: string;
  duration: number;
  points: number;
  icon: string;
}

interface TotalTimeStatItemProps {
  timeTracking: TimeTracking | null;
}

const StatItem: React.FC<StatItemProps> = ({ label, duration, points, icon }) => (
  <View style={styles.statItem}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={20} color="#50AF27" />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={styles.statDetails}>
      <Text style={styles.statText}>Connected: {formatMinutesToHHMMSS(duration)}</Text>
      <Text style={styles.statText}>Hours: {Math.floor(duration / 60)}h {Math.floor(duration % 60)}m</Text>
      <Text style={styles.statText}>Points: {points}</Text>
    </View>
  </View>
);

const TotalTimeStatItem: React.FC<TotalTimeStatItemProps> = ({ timeTracking }) => (
  <View style={styles.statItem}>
    <View style={styles.statHeader}>
      <Icon name="clock-outline" size={20} color="#50AF27" />
      <Text style={styles.statLabel}>Total Time Connected</Text>
    </View>
    <View style={styles.statDetails}>
      <Text style={styles.statText}>Connected: {timeTracking ? formatMinutesToHHMMSS(timeTracking.timeTracking.total.minutes) : '00:00:00'}</Text>
      <Text style={styles.statText}>Hours: {timeTracking ? `${timeTracking.timeTracking.total.hours}h ${Math.floor(timeTracking.timeTracking.total.minutes % 60)}m` : '0h 0m'}</Text>
      <Text style={styles.statText}>Points: {timeTracking ? timeTracking.pointsFromTotalTime : 0}</Text>
    </View>
  </View>
);

const WifiStatusScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isConnected, currentSession, currentSSID } = useWiFi();
  const [stats, setStats] = useState<Stats>({
    today: { duration: 0, points: 0 },
    week: { duration: 0, points: 0 },
    month: { duration: 0, points: 0 },
    total: { duration: 0, points: 0 }
  });
  const [timeTracking, setTimeTracking] = useState<TimeTracking | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Here you would call your API to get the stats
        // For now using placeholder data
        setStats({
          today: { duration: 120, points: 200 },
          week: { duration: 840, points: 1400 },
          month: { duration: 3600, points: 6000 },
          total: { duration: 7200, points: 12000 }
        });

        // Fetch time tracking data
        // This would be replaced with actual API call
        setTimeTracking({
          timeTracking: {
            total: {
              minutes: 7200,
              hours: 120
            }
          },
          pointsFromTotalTime: 12000
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const getWifiStatusIcon = () => {
    return isConnected ? 'wifi' : 'wifi-off';
  };

  const getConnectionTime = () => {
    if (isConnected && currentSession?.startTime) {
      return wifiService.formatSessionDuration(wifiService.calculateSessionDuration(new Date(currentSession.startTime), currentTime));
    }
    return '00:00:00';
  };

  const getSessionProgressInfo = () => {
    if (isConnected && currentSession && timeTracking) {
      // This would be replaced with actual logic to calculate progress
      return {
        minutesToNext: 30,
        progress: 50,
        potentialPoints: 100
      };
    }
    return null;
  };

  const getHourProgressInfo = () => {
    if (!isConnected || !currentSession) {
      return {
        progress: 0,
        minutesToNext: 60,
        nextPoints: 100,
        totalMinutes: 0,
        currentHourProgress: 0
      };
    }

    const sessionDuration = wifiService.calculateSessionDuration(new Date(currentSession.startTime), currentTime);
    const minutesInCurrentHour = Math.floor((sessionDuration % 3600) / 60);
    const progress = minutesInCurrentHour / 60;
    const minutesToNext = 60 - minutesInCurrentHour;

    return {
      progress,
      minutesToNext,
      nextPoints: 100,
      totalMinutes: Math.floor(sessionDuration / 60),
      currentHourProgress: minutesInCurrentHour
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FFCED2" />

      {/* Fixed Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={[styles.headerSection, { paddingTop: insets.top }]}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.titleText}>
            Hello, {user?.name || 'Student'}!
          </Text>
          <Text style={styles.subtitleText}>
            {isConnected 
              ? 'Keep connected to earn more points!'
              : 'Connect to university WiFi to start earning'}
          </Text>
        </View>
      </Animated.View>

      {/* Content Section */}
      <Animated.View 
        entering={FadeInUp.delay(400)}
        style={[styles.contentSection, { paddingBottom: insets.bottom }]}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + rs(90) }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* WiFi Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.cardHeader}>
                <Icon 
                  name={getWifiStatusIcon()} 
                  size={28} 
                  color={isConnected ? "#50AF27" : "#FFA79D"} 
                />
                <Text style={styles.cardTitle}>WiFi Status</Text>
              </View>
              <Text style={[
                styles.statusText,
                isConnected ? styles.connectedText : styles.disconnectedText
              ]}>
                {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
              </Text>
              {isConnected && currentSession && (
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionText}>
                    Current session: {getConnectionTime()}
                  </Text>
                  {(() => {
                    const progressInfo = getSessionProgressInfo();
                    return progressInfo && progressInfo.minutesToNext && (
                      <Text style={styles.sessionText}>
                        Next reward in: {progressInfo.minutesToNext} minutes
                      </Text>
                    );
                  })()}
                </View>
              )}
            </View>

            {/* Current Points Card with Progress Bar */}
            <View style={styles.pointsCard}>
              <View style={styles.cardHeader}>
                <Icon name="star" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Total Points</Text>
              </View>
              <Text style={styles.pointsValue}>{user?.points || 0}</Text>
              
              {/* Progress toward next hour milestone */}
              {(() => {
                const hourProgress = getHourProgressInfo();
                return (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress to next 100 points</Text>
                      <Text style={styles.progressTime}>
                        {hourProgress.currentHourProgress}min / 60min ({Math.floor(hourProgress.progress * 100)}%)
                      </Text>
                    </View>
                    <ProgressBar 
                      progress={hourProgress.progress} 
                      color="#50AF27"
                      style={styles.progressBar}
                    />
                    <Text style={styles.progressSubtext}>
                      {hourProgress.minutesToNext} minutes until next 100 points
                      {isConnected && (
                        <Text style={styles.activeSessionText}> • Session Active</Text>
                      )}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Stats Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Icon name="chart-bar" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Connection Statistics</Text>
              </View>
              
              <StatItem 
                label="Today" 
                duration={stats.today.duration}
                points={stats.today.points}
                icon="calendar-today"
              />
              <View style={styles.divider} />
              
              <StatItem 
                label="This Week" 
                duration={stats.week.duration}
                points={stats.week.points}
                icon="calendar-week"
              />
              <View style={styles.divider} />
              
              <StatItem 
                label="This Month" 
                duration={stats.month.duration}
                points={stats.month.points}
                icon="calendar-month"
              />
              <View style={styles.divider} />

              <TotalTimeStatItem timeTracking={timeTracking} />
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../../assets/mascots/Unitree - Mascot-1.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCED2',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: rs(90),
  },
  
  // Header Section Styles
  headerSection: {
    backgroundColor: '#FFCED2',
    paddingBottom: rs(90),
    paddingTop: rs(10),
  },
  welcomeSection: {
    alignItems: 'flex-start',
    paddingHorizontal: rs(20),
    marginTop: rs(10),
  },
  titleText: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(10),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: rf(16),
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: rf(24),
  },

  // Content Section Styles
  contentSection: {
    flex: 1,
    backgroundColor: '#98D56D',
    borderTopLeftRadius: rs(30),
    borderTopRightRadius: rs(30),
    paddingHorizontal: rs(24),
    paddingTop: rs(32),
  },
  mascotContainer: {
    position: 'absolute',
    right: rs(20),
    top: deviceValue(
      rs(80),  // small
      rs(90),  // medium
      rs(100)  // large
    ),
    zIndex: 9999,
    transform: [{ scale: deviceValue(
      0.8,  // small
      0.9,  // medium
      1.0   // large
    )}],
  },
  mascotImage: {
    ...getImageSize(160, 160),
  },
  scrollContainer: {
    flex: 1,
    marginTop: rs(40),
    borderRadius: rs(16),
  },
  content: {},
  
  // Card Styles
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    marginBottom: rs(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pointsCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    marginBottom: rs(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
  },
  statusText: {
    fontSize: rf(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: rs(12),
  },
  connectedText: {
    color: '#50AF27',
  },
  disconnectedText: {
    color: '#FFA79D',
  },
  sessionInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: rs(12),
    padding: rs(16),
  },
  sessionText: {
    fontSize: rf(14),
    color: '#50AF27',
    fontWeight: '500',
    marginBottom: rs(4),
  },
  pointsValue: {
    fontSize: rf(48),
    fontWeight: 'bold',
    color: '#50AF27',
    marginVertical: rs(8),
  },
  statItem: {
    paddingVertical: rs(12),
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  statLabel: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
  },
  statDetails: {
    marginLeft: rs(28),
  },
  statText: {
    fontSize: rf(14),
    color: '#666',
    marginBottom: rs(2),
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: rs(8),
  },
  progressContainer: {
    marginTop: rs(16),
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(8),
  },
  progressLabel: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
  },
  progressTime: {
    fontSize: rf(14),
    color: '#666',
  },
  progressBar: {
    height: 12,
    borderRadius: rs(6),
    backgroundColor: '#E0E0E0',
  },
  progressSubtext: {
    fontSize: rf(14),
    color: '#666',
    marginTop: rs(8),
  },
  activeSessionText: {
    fontSize: rf(14),
    color: '#50AF27',
    fontWeight: 'bold',
  },
});

export default WifiStatusScreen; 