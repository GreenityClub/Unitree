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
import { Text, ProgressBar } from 'react-native-paper';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { useTabBarContext } from '../../context/TabBarContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { wifiService } from '../../services/wifiService';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';

interface StatItemProps {
  label: string;
  duration: number;
  points: number;
  icon: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, duration, points, icon }) => (
  <View style={styles.statItem}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={20} color="#50AF27" />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={styles.statDetails}>
      <Text style={styles.statText}>Time: {wifiService.formatWifiTime(duration)}</Text>
      <Text style={styles.statText}>Points: {points}</Text>
    </View>
  </View>
);

const WifiStatusScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'wifi' });
  const { 
    isConnected, 
    ssid, 
    isUniversityWifi, 
    isSessionActive, 
    stats, 
    refreshStats, 
    error,
    wifiMonitor 
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

  useEffect(() => {
    refreshStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshStats();
    } catch (error) {
      console.error('Error refreshing WiFi status data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshStats]);

  const getWifiStatusIcon = () => {
    return (isConnected && isUniversityWifi) ? 'wifi' : 'wifi-off';
  };

  const getConnectionStatus = () => {
    if (isConnected && isUniversityWifi) {
      return 'CONNECTED';
    }
    return 'NOT CONNECTED';
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FFCED2" />

        {/* Fixed Header Section */}
        <Animated.View 
          style={[styles.headerSection, { paddingTop: insets.top }, headerAnimatedStyle]}
          onTouchStart={handleTouchStart}
        >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.titleText}>
            WiFi Status
          </Text>
          <Text style={styles.subtitleText}>
            {(isConnected && isUniversityWifi)
              ? 'Keep connected to earn more points!'
              : 'Connect to university WiFi to start earning'}
          </Text>
        </View>
      </Animated.View>

      {/* Scrollable Content Section */}
      <Animated.View 
        style={[styles.contentSection, { paddingBottom: insets.bottom }, contentAnimatedStyle]}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + rs(90) }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onTouchStart={handleTouchStart}
          scrollEventThrottle={16}
        >
          <View style={styles.content}>
            {/* WiFi Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.cardHeader}>
                <Icon 
                  name={getWifiStatusIcon()} 
                  size={28} 
                  color={(isConnected && isUniversityWifi) ? "#50AF27" : "#FFA79D"} 
                />
                <Text style={styles.cardTitle}>WiFi Status</Text>
              </View>
              <Text style={[
                styles.statusText,
                (isConnected && isUniversityWifi) ? styles.connectedText : styles.disconnectedText
              ]}>
                {getConnectionStatus()}
              </Text>
              {ssid && (
                <Text style={styles.networkInfo}>
                  Connected to: {ssid}
                </Text>
              )}
              {isUniversityWifi && (
                <Text style={styles.bssidInfo}>
                  University WiFi ✓
                </Text>
              )}
              {(isConnected && isUniversityWifi) && stats?.currentSession && (
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionText}>
                    Current session: {wifiService.formatWifiTime(stats.currentSession.duration)}
                  </Text>
                  <Text style={styles.sessionText}>
                    Points earned: {Math.floor(stats.currentSession.duration / 60)}
                  </Text>
                </View>
              )}
            </View>

            {/* Current Points Card */}
            <View style={styles.pointsCard}>
              <View style={styles.cardHeader}>
                <Icon name="star" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Total Points</Text>
              </View>
              <Text style={styles.pointsValue}>{user?.points || 0}</Text>
              {isSessionActive && (
                <Text style={styles.activeSessionText}>• Session Active - Earning 1 point per minute</Text>
              )}
            </View>

            {/* Stats Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Icon name="chart-bar" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Connection Statistics</Text>
              </View>

              {stats ? (
                <>
                  <StatItem 
                    label="Today" 
                    duration={stats.periods.today.duration}
                    points={stats.periods.today.points}
                    icon="calendar-today"
                  />
                  <View style={styles.divider} />
                  
                  <StatItem 
                    label="This Week" 
                    duration={stats.periods.thisWeek.duration}
                    points={stats.periods.thisWeek.points}
                    icon="calendar-week"
                  />
                  <View style={styles.divider} />
                  
                  <StatItem 
                    label="This Month" 
                    duration={stats.periods.thisMonth.duration}
                    points={stats.periods.thisMonth.points}
                    icon="calendar-month"
                  />
                  <View style={styles.divider} />

                  <StatItem 
                    label="Total Time" 
                    duration={stats.periods.allTime.duration}
                    points={stats.periods.allTime.points}
                    icon="clock-outline"
                  />
                </>
              ) : (
                <Text style={styles.loadingText}>Loading statistics...</Text>
              )}
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            
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
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCED2',
  },
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
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(10),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: rf(16),
    color: '#fff',
    opacity: 0.9,
    textAlign: 'left',
    lineHeight: rf(24),
  },
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
    top: rs(105),
    zIndex: 9999,
  },
  mascotImage: {
    width: rs(160),
    height: rs(160),
  },
  scrollContainer: {
    flex: 1,
    marginTop: rs(40),
    borderRadius: rs(16),
  },
  scrollContent: {
    flexGrow: 1,
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
  errorCard: {
    backgroundColor: '#ffebee',
    borderRadius: rs(16),
    padding: rs(20),
    marginBottom: rs(16),
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
  networkInfo: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: rs(4),
  },
  bssidInfo: {
    fontSize: rf(12),
    color: '#50AF27',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: rs(8),
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
  activeSessionText: {
    fontSize: rf(14),
    color: '#50AF27',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: rf(16),
    color: '#666',
    textAlign: 'center',
    padding: rs(20),
  },
  errorText: {
    fontSize: rf(16),
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '500',
  }
}); 

export default WifiStatusScreen; 