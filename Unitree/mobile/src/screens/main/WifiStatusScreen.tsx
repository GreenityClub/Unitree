import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { useBackgroundSync } from '../../context/BackgroundSyncContext';
import { useTabBarContext } from '../../context/TabBarContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { wifiService } from '../../services/wifiService';
import { pointsService } from '../../services/pointsService';

import { 
  rf, 
  rs, 
  wp, 
  hp, 
  deviceValue, 
  getImageSize, 
  SCREEN_DIMENSIONS, 
  isSmallHeightDevice,
  isTablet,
  isTabletLarge,
  getLayoutConfig,
  getContainerPadding,
  getMaxContentWidth
} from '../../utils/responsive';
import { ResponsiveGrid } from '../../components';

interface StatItemProps {
  label: string;
  duration: number;
  points: number;
  icon: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, duration, points, icon }) => (
  <View style={styles.statItem}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={rf(20, 24, 28)} color="#50AF27" />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={styles.statDetails}>
      <Text style={styles.statText}>Time: {wifiService.formatWifiTime(duration)}</Text>
      <Text style={styles.statText}>Points: {points}</Text>
    </View>
  </View>
);

const LiveBadge: React.FC = () => (
  <View style={styles.liveBadge}>
    <View style={styles.liveDot} />
    <Text style={styles.liveText}>LIVE</Text>
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
    ipAddress,
    isUniversityWifi, 
    isSessionActive, 
    currentSessionDuration,
    sessionCount,
    stats, 
    refreshStats, 
    error,
    wifiMonitor 
  } = useWiFi();
  const { syncStats, isSyncing } = useBackgroundSync();
  const layoutConfig = getLayoutConfig();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [liveTotalPoints, setLiveTotalPoints] = useState(user?.points || 0);


  useEffect(() => {
    // Update time every second for real-time display and calculate live points
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Calculate live total points like in PointsScreen
      if (stats?.currentSession?.startTime && isSessionActive) {
        const sessionDuration = wifiService.calculateSessionDuration(new Date(stats.currentSession.startTime));
        const sessionPoints = Math.floor(sessionDuration / 60); // 1 minute = 1 point
        const basePoints = pointsService.getState().points;
        setLiveTotalPoints(basePoints + sessionPoints);
      } else {
        setLiveTotalPoints(pointsService.getState().points);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [stats, isSessionActive]);

  // Listen for points service updates
  useEffect(() => {
    const unsubscribePoints = pointsService.addListener((state) => {
      if (!isSessionActive) {
        setLiveTotalPoints(state.points);
      }
    });

    return () => {
      unsubscribePoints();
    };
  }, [isSessionActive]);

  // Real-time stats refresh effect
  useEffect(() => {
    const statsTimer = setInterval(async () => {
      try {
        await refreshStats();
      } catch (error) {
        console.error('Failed to refresh stats:', error);
      }
    }, 5000); // Refresh every 5 seconds for real-time updates

    return () => clearInterval(statsTimer);
  }, [refreshStats]);

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

  const getLiveSessionDuration = () => {
    if (stats?.currentSession?.startTime) {
      const duration = wifiService.calculateSessionDuration(new Date(stats.currentSession.startTime));
      return duration;
    }
    return stats?.currentSession?.duration || 0;
  };

  const getLiveSessionPoints = () => {
    if (stats?.currentSession?.startTime) {
      const duration = wifiService.calculateSessionDuration(new Date(stats.currentSession.startTime));
      return Math.floor(duration / 60); // 1 minute = 1 point
    }
    return stats?.currentSession?.points || 0;
  };

  const renderScreen = () => (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FFCED2" />

        {/* Fixed Header Section */}
        <Animated.View 
          style={[
            styles.headerSection, 
            { 
              paddingTop: insets.top,
              paddingHorizontal: layoutConfig.isTablet ? rs(40) : rs(20),
            }, 
            headerAnimatedStyle
          ]}
          onTouchStart={handleTouchStart}
        >
        {/* Welcome Section */}
        <View style={[
          styles.welcomeSection,
          {
            width: '100%',
            paddingHorizontal: 0,
            alignItems: 'flex-start', // Always align left
          }
        ]}>
          <Text style={[styles.titleText, { textAlign: 'left' }]}>
            WiFi Status
          </Text>
          <Text style={[styles.subtitleText, { textAlign: 'left' }]}>
            {(isConnected && isUniversityWifi)
              ? 'Keep connected to earn more points!'
              : 'Connect to university WiFi to start earning'}
          </Text>
        </View>
      </Animated.View>

      {/* Scrollable Content Section */}
      <Animated.View 
          style={[
            styles.contentSection, 
            { 
              paddingBottom: insets.bottom,
              paddingHorizontal: layoutConfig.isTablet ? rs(40) : rs(24),
            }, 
            contentAnimatedStyle
          ]}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
              { 
                paddingBottom: insets.bottom + rs(90),
                width: '100%'
              }
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
            {layoutConfig.isTablet ? (
              <View style={{ flex: 1, width: '100%' }}>
                {/* WiFi Status Card */}
                <View style={styles.statusCard}>
                  {(isConnected && isUniversityWifi && isSessionActive) && <LiveBadge />}
                  <View style={styles.cardHeader}>
                    <Icon 
                      name={getWifiStatusIcon()} 
                      size={rf(28, 32, 36)} 
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
                  {(isConnected && isUniversityWifi) && (
                    <Text style={styles.bssidInfo}>
                      {process.env.EXPO_PUBLIC_UNIVERSITY_SSIDS} ✓
                    </Text>
                  )}
                  {(isConnected && isUniversityWifi) && isSessionActive && stats?.currentSession && (
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionText}>
                        Current session: {wifiService.formatWifiTime(getLiveSessionDuration())}
                      </Text>
                      <Text style={styles.sessionText}>
                        Points earned: {getLiveSessionPoints()}
                      </Text>
                      <Text style={styles.sessionText}>
                        Sessions today: {sessionCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Current Points Card */}
                <View style={styles.pointsCard}>
                  {isSessionActive && <LiveBadge />}
                  <View style={styles.cardHeader}>
                    <Icon name="star" size={rf(28, 32, 36)} color="#50AF27" />
                    <Text style={styles.cardTitle}>Total Points</Text>
                  </View>
                  <Text style={styles.pointsValue}>{liveTotalPoints}</Text>
                  {isSessionActive && (
                    <Text style={styles.activeSessionText}>• Session Active - Earning 1 point per minute</Text>
                  )}
                </View>

                {/* Stats Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.cardHeader}>
                    <Icon name="chart-bar" size={rf(28, 32, 36)} color="#50AF27" />
                    <Text style={styles.cardTitle}>Connection Statistics</Text>
                  </View>

                  {stats ? (
                    <>
                      {/* Session Count Display */}
                      <View style={styles.statItem}>
                        <View style={styles.statHeader}>
                          <Icon name="counter" size={rf(20, 24, 28)} color="#50AF27" />
                          <Text style={styles.statLabel}>Sessions Today</Text>
                        </View>
                        <View style={styles.statDetails}>
                          <Text style={styles.statText}>Count: {sessionCount}</Text>
                          <Text style={styles.statText}>Status: {isSessionActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                      </View>
                      <View style={styles.divider} />

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

                {/* Background Sync Status */}
                {syncStats && (
                  <View style={styles.backgroundSyncCard}>
                    <View style={styles.cardHeader}>
                      <Icon name="sync" size={rf(28, 32, 36)} color="#50AF27" />
                      <Text style={styles.cardTitle}>Background Sync Status</Text>
                      {isSyncing && <Icon name="loading" size={rf(20, 24, 28)} color="#50AF27" />}
                    </View>
                    
                    <View style={styles.backgroundSyncRow}>
                      <Text style={styles.backgroundSyncLabel}>Pending Sessions:</Text>
                      <Text style={styles.backgroundSyncValue}>{syncStats.pendingCount}</Text>
                    </View>
                    
                    {syncStats.currentSession && (
                      <View style={styles.backgroundSyncRow}>
                        <Text style={styles.backgroundSyncLabel}>Background Session:</Text>
                        <Text style={[styles.backgroundSyncValue, { color: '#50AF27' }]}>Active</Text>
                      </View>
                    )}
                    
                    <Text style={styles.backgroundSyncNote}>
                      Go to User Settings to enable/disable background monitoring
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <>
            {/* WiFi Status Card */}
            <View style={styles.statusCard}>
              {(isConnected && isUniversityWifi && isSessionActive) && <LiveBadge />}
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
              {(isConnected && isUniversityWifi) && (
                <Text style={styles.bssidInfo}>
                  {process.env.EXPO_PUBLIC_UNIVERSITY_SSIDS} ✓
                </Text>
              )}
              {(isConnected && isUniversityWifi) && isSessionActive && stats?.currentSession && (
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionText}>
                    Current session: {wifiService.formatWifiTime(getLiveSessionDuration())}
                  </Text>
                  <Text style={styles.sessionText}>
                    Points earned: {getLiveSessionPoints()}
                  </Text>
                  <Text style={styles.sessionText}>
                    Sessions today: {sessionCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Current Points Card */}
            <View style={styles.pointsCard}>
              {isSessionActive && <LiveBadge />}
              <View style={styles.cardHeader}>
                <Icon name="star" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Total Points</Text>
              </View>
              <Text style={styles.pointsValue}>{liveTotalPoints}</Text>
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
                  {/* Session Count Display */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Icon name="counter" size={20} color="#50AF27" />
                      <Text style={styles.statLabel}>Sessions Today</Text>
                    </View>
                    <View style={styles.statDetails}>
                      <Text style={styles.statText}>Count: {sessionCount}</Text>
                      <Text style={styles.statText}>Status: {isSessionActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />

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

            {/* Background Sync Status */}
            {syncStats && (
              <View style={styles.backgroundSyncCard}>
                <View style={styles.cardHeader}>
                  <Icon name="sync" size={28} color="#50AF27" />
                  <Text style={styles.cardTitle}>Background Sync Status</Text>
                  {isSyncing && <Icon name="loading" size={20} color="#50AF27" />}
                </View>
                
                <View style={styles.backgroundSyncRow}>
                  <Text style={styles.backgroundSyncLabel}>Pending Sessions:</Text>
                  <Text style={styles.backgroundSyncValue}>{syncStats.pendingCount}</Text>
                </View>
                
                {syncStats.currentSession && (
                  <View style={styles.backgroundSyncRow}>
                    <Text style={styles.backgroundSyncLabel}>Background Session:</Text>
                    <Text style={[styles.backgroundSyncValue, { color: '#50AF27' }]}>Active</Text>
                  </View>
                )}
                
                <Text style={styles.backgroundSyncNote}>
                  Go to User Settings to enable/disable background monitoring
                </Text>
              </View>
            )}
              </>
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

  // For tablet, wrap with SafeAreaView since we bypass ScreenLayout
  if (layoutConfig.isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFCED2' }} edges={['left', 'right']}>
        {renderScreen()}
      </SafeAreaView>
    );
  }

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCED2',
  },
  headerSection: {
    backgroundColor: '#FFCED2',
    paddingBottom: isSmallHeightDevice() ? rs(60) : rs(90),
    paddingTop: rs(10),
  },
  welcomeSection: {
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    marginTop: rs(10),
  },
  titleText: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(10),
    textAlign: 'left',
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
    paddingTop: rs(32),
    marginTop: rs(10),
  },
  mascotContainer: {
    position: 'absolute',
    right: rs(20),
    top: isSmallHeightDevice() ? rs(75) : rs(105),
    zIndex: 9999,
  },
  mascotImage: {
    width: rs(160, 180, 200),
    height: rs(160, 180, 200),
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
    marginTop: rs(10),
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
    marginTop: rs(12),
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
  },
  liveBadge: {
    position: 'absolute',
    top: rs(5),
    right: rs(-3),
    backgroundColor: '#50AF27',
    borderRadius: rs(32),
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '30deg' }],
    zIndex: 10,
  },
  liveDot: {
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: '#fff',
    marginRight: rs(8),
  },
  liveText: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#fff',
  },
  backgroundSyncCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    marginTop: rs(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backgroundSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(8),
  },
  backgroundSyncLabel: {
    fontSize: rf(14),
    color: '#333',
  },
  backgroundSyncValue: {
    fontSize: rf(14),
    fontWeight: 'bold',
    color: '#333',
  },
  backgroundSyncNote: {
    fontSize: rf(12),
    color: '#666',
    textAlign: 'center',
    marginTop: rs(12),
    fontStyle: 'italic',
  },
}); 

export default WifiStatusScreen; 