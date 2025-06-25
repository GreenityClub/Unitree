import React, { useEffect, useState, useCallback } from 'react';
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
import { Text } from 'react-native-paper';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wifiService, WifiStats } from '../../services/wifiService';
import { treeService } from '../../services/treeService';
import { pointsService } from '../../services/pointsService';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { useTabBarContext } from '../../context/TabBarContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { Formatters } from '../../utils/formatters';
import { 
  wp, 
  hp, 
  rf, 
  rs, 
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
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { ResponsiveGrid } from '../../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
type RootStackParamList = {
  points: undefined;
  trees: undefined;
  profile: undefined;
  wifi: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { user, updateUser } = useAuth();
  const { 
    isConnected, 
    isUniversityWifi, 
    isSessionActive, 
    currentSessionDuration, 
    sessionCount, 
    stats,
    ipAddress,
    isInitialized
  } = useWiFi();
  const navigation = useNavigation<NavigationProp>();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'index' });
  const [currentPoints, setCurrentPoints] = useState<number>(user?.points || 0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [actualTreeCount, setActualTreeCount] = useState<number>(0);
  const [realTreeCount, setRealTreeCount] = useState<number>(0);
  const insets = useSafeAreaInsets();
  const layoutConfig = getLayoutConfig();

  // Get last name from full name
  const getLastName = (fullname: string | undefined): string => {
    if (!fullname) return 'User';
    const nameParts = fullname.trim().split(' ');
    return nameParts[nameParts.length - 1];
  };

  useEffect(() => {
    // Fetch actual tree count when user changes
    const fetchInitialData = async () => {
      if (user) {
        await fetchActualTreeCount();
        await fetchRealTreeCount();
      }
    };

    fetchInitialData();
  }, [user?.id]); // Reinitialize when user changes

  // Update points when user data changes or when user logs in
  useEffect(() => {
    if (user?.points !== undefined) {
      setCurrentPoints(user.points);
      // Also update pointsService to keep it in sync
      pointsService.handlePointsUpdate({ points: user.points });
    }
  }, [user?.points, user?.id]); // Also depend on user.id to trigger on login

  // Sync with pointsService when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const currentPointsFromService = pointsService.getPoints();
        if (currentPointsFromService !== currentPoints) {
          setCurrentPoints(currentPointsFromService);
        }
      }
    }, [currentPoints, user])
  );

  // Listen for real-time points updates from pointsService
  useEffect(() => {
    if (!user) return;

    // Set up a periodic refresh for points to keep them in sync
    const pointsInterval = setInterval(() => {
      const currentPointsFromService = pointsService.getPoints();
      if (currentPointsFromService !== currentPoints) {
        setCurrentPoints(currentPointsFromService);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(pointsInterval);
    };
  }, [user?.id, currentPoints]);

  // Update time every second for real-time duration display
  useEffect(() => {
    if (!user) return; // Don't run timer if user is not logged in

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user]); // Depend on user so timer restarts/stops with login/logout

  const getWifiStatusText = () => {
    if (isConnected && isUniversityWifi && isSessionActive && stats?.currentSession?.startTime) {
      return `Connected to ${process.env.EXPO_PUBLIC_UNIVERSITY_SSIDS}`;
    }
    return 'Not connected to university WiFi';
  };

  // Real-time calculations for live updates
  const getLiveSessionDuration = () => {
    if (!stats?.currentSession?.startTime) return 0;
    return wifiService.calculateSessionDuration(new Date(stats.currentSession.startTime));
  };

  const getLiveSessionPoints = () => {
    const duration = getLiveSessionDuration();
    return wifiService.calculatePointsEarned(duration);
  };

  const getLiveTotalPoints = () => {
    const sessionPoints = getLiveSessionPoints();
    const basePoints = user?.points || 0;
    return basePoints + sessionPoints;
  };

  const getWifiStatusIcon = () => {
    // Show loading/disconnected icon if not initialized yet
    if (!isInitialized) return 'wifi-off';
    return (isConnected && isUniversityWifi) ? 'wifi' : 'wifi-off';
  };

  // Navigation handlers
  const navigateToPoints = () => {
    navigation.navigate('points');
  };

  const navigateToTrees = () => {
    navigation.navigate('trees');
  };

  const navigateToProfile = () => {
    navigation.navigate('profile');
  };

  const navigateToWifi = () => {
    navigation.navigate('wifi');
  };

  const fetchActualTreeCount = async () => {
    try {
      if (user) {
        const trees = await treeService.getTrees();
        setActualTreeCount(trees.length);
        // Also update the user context to keep it in sync
        updateUser({ treesPlanted: trees.length });
      }
    } catch (error) {
      console.error('Error fetching tree count:', error);
      // Fallback to user.treesPlanted if API call fails
      setActualTreeCount(user?.treesPlanted || 0);
    }
  };

  const fetchRealTreeCount = async () => {
    try {
      if (user) {
        const realTrees = await treeService.getRealTrees();
        const aliveRealTrees = realTrees.filter(tree => tree.stage !== 'dead');
        setRealTreeCount(aliveRealTrees.length);
      }
    } catch (error) {
      console.error('Error fetching real tree count:', error);
      // Set to 0 if real trees collection doesn't exist or fails
      setRealTreeCount(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh points from service
      await pointsService.refreshPoints();
      const updatedPoints = pointsService.getPoints();
      setCurrentPoints(updatedPoints);
      
      // Fetch actual tree count
      await fetchActualTreeCount();
      // Fetch real tree count
      await fetchRealTreeCount();
    } catch (error) {
      console.error('Error refreshing home data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" />

        {/* Fixed Header Section */}
        <Animated.View 
          style={[
            styles.headerSection, 
            { 
              paddingTop: insets.top,
              paddingHorizontal: layoutConfig.isTablet ? layoutConfig.containerPadding : rs(20),
            }, 
            headerAnimatedStyle
          ]}
          onTouchStart={handleTouchStart}
        >
          {/* Welcome Section */}
          <View style={[styles.welcomeSection, { maxWidth: layoutConfig.isTablet ? getMaxContentWidth() : '100%', alignSelf: 'center' }]}>
            <Text style={[styles.titleText, { textAlign: layoutConfig.isTablet ? 'center' : 'left' }]}>
              Welcome back, {getLastName(user?.fullname)}!
            </Text>
            <Text style={[styles.subtitleText, { textAlign: layoutConfig.isTablet ? 'center' : 'left' }]}>
              Track your WiFi sessions and plant more trees
            </Text>
          </View>
        </Animated.View>

        {/* Scrollable Content Section */}
        <Animated.View 
          style={[
            styles.contentSection, 
            { 
              paddingBottom: insets.bottom,
              paddingHorizontal: layoutConfig.isTablet ? layoutConfig.containerPadding : rs(24),
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
              maxWidth: layoutConfig.isTablet ? getMaxContentWidth() : '100%',
              alignSelf: 'center',
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
              <ResponsiveGrid 
                baseColumns={1}
                gap={16}
              >
                {/* Points Card */}
                <TouchableOpacity 
                  style={[styles.card, styles.pointsCard]}
                  onPress={navigateToPoints}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon name="star" size={rf(24, 28, 32)} color="#50AF27" />
                    <Text style={styles.cardTitle}>Available Points</Text>
                    <View style={styles.cardArrow}>
                      <Icon name="chevron-right" size={rf(20, 24, 28)} color="#666" />
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>
                    {isSessionActive ? getLiveTotalPoints() : currentPoints}
                  </Text>
                </TouchableOpacity>

                {/* WiFi Status Card */}
                <TouchableOpacity 
                  style={[styles.card, styles.statusCard]}
                  onPress={navigateToWifi}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon 
                      name={getWifiStatusIcon()} 
                      size={rf(24, 28, 32)} 
                      color={(isInitialized && isConnected && isUniversityWifi) ? "#50AF27" : "#FFA79D"} 
                    />
                    <Text style={styles.cardTitle}>WiFi Status</Text>
                    <View style={styles.cardArrow}>
                      <Icon name="chevron-right" size={rf(20, 24, 28)} color="#666" />
                    </View>
                  </View>
                  <Text style={[
                    styles.statusText,
                    (isInitialized && isConnected && isUniversityWifi) ? styles.connectedText : styles.disconnectedText
                  ]}>
                    {isInitialized ? getWifiStatusText() : 'Checking WiFi status...'}
                  </Text>

                  {(isInitialized && isConnected && isUniversityWifi) && isSessionActive && stats?.currentSession && (
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

                  {isInitialized && !(isConnected && isUniversityWifi) && (
                    <Text style={styles.tapHintText}>
                      Tap to view WiFi details
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Trees Card */}
                <TouchableOpacity 
                  style={[styles.card, styles.treesCard]}
                  onPress={navigateToTrees}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon name="tree" size={rf(24, 28, 32)} color="#50AF27" />
                    <Text style={styles.cardTitle}>Trees Planted</Text>
                    <View style={styles.cardArrow}>
                      <Icon name="chevron-right" size={rf(20, 24, 28)} color="#666" />
                    </View>
                  </View>
                  <Text style={styles.treeCount}>{actualTreeCount}</Text>
                  <Text style={styles.co2Text}>
                    You've helped reduce CO₂ by approximately {(realTreeCount * 22)}kg per year!
                  </Text>
                </TouchableOpacity>
              </ResponsiveGrid>
            ) : (
              <>
                {/* Points Card */}
                <TouchableOpacity 
                  style={[styles.card, styles.pointsCard]}
                  onPress={navigateToPoints}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon name="star" size={24} color="#50AF27" />
                    <Text style={styles.cardTitle}>Available Points</Text>
                    <View style={styles.cardArrow}>
                      <Icon name="chevron-right" size={20} color="#666" />
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>
                    {isSessionActive ? getLiveTotalPoints() : currentPoints}
                  </Text>
                </TouchableOpacity>

                {/* WiFi Status Card */}
                <TouchableOpacity 
                  style={[styles.card, styles.statusCard]}
                  onPress={navigateToWifi}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon 
                      name={getWifiStatusIcon()} 
                      size={24} 
                      color={(isInitialized && isConnected && isUniversityWifi) ? "#50AF27" : "#FFA79D"} 
                    />
                    <Text style={styles.cardTitle}>WiFi Status</Text>
                    <View style={styles.cardArrow}>
                      <Icon name="chevron-right" size={20} color="#666" />
                    </View>
                  </View>
                  <Text style={[
                    styles.statusText,
                    (isInitialized && isConnected && isUniversityWifi) ? styles.connectedText : styles.disconnectedText
                  ]}>
                    {isInitialized ? getWifiStatusText() : 'Checking WiFi status...'}
                  </Text>

                  {(isInitialized && isConnected && isUniversityWifi) && isSessionActive && stats?.currentSession && (
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

                  {isInitialized && !(isConnected && isUniversityWifi) && (
                    <Text style={styles.tapHintText}>
                      Tap to view WiFi details
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Trees Card */}
                <TouchableOpacity 
                  style={[styles.card, styles.treesCard]}
                  onPress={navigateToTrees}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon name="tree" size={24} color="#50AF27" />
                    <Text style={styles.cardTitle}>Trees Planted</Text>
                    <View style={styles.cardArrow}>
                      <Icon name="chevron-right" size={20} color="#666" />
                    </View>
                  </View>
                  <Text style={styles.treeCount}>{actualTreeCount}</Text>
                  <Text style={styles.co2Text}>
                    You've helped reduce CO₂ by approximately {(realTreeCount * 22)}kg per year!
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>

        {/* Mascot */}
        {!layoutConfig.isTablet && (
          <View style={styles.mascotContainer}>
            <Image
              source={require('../../assets/mascots/Unitree - Mascot-4.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7DDE6',
  },
  headerSection: {
    backgroundColor: '#B7DDE6',
    paddingBottom: isSmallHeightDevice() ? rs(60) : rs(90),
    paddingTop: rs(10),
  },
  welcomeSection: {
    alignItems: 'flex-start',
    marginTop: rs(10),
    width: '100%',
  },
  titleText: {
    fontSize: rf(32, 40, 48),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(10),
  },
  subtitleText: {
    fontSize: rf(16, 18, 20),
    color: '#fff',
    opacity: 0.9,
    lineHeight: rf(24, 28, 32),
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#98D56D',
    borderTopLeftRadius: rs(30),
    borderTopRightRadius: rs(30),
    paddingTop: rs(32),
  },
  mascotContainer: {
    position: 'absolute',
    right: rs(20),
    top: isSmallHeightDevice() ? rs(75) : rs(105),
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
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(16, 20, 24),
    padding: rs(20, 24, 28),
    marginBottom: rs(16, 20, 24),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pointsCard: {},
  statusCard: {},
  treesCard: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12, 16, 20),
  },
  cardTitle: {
    fontSize: rf(18, 20, 24),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8, 10, 12),
    flex: 1,
  },
  pointsValue: {
    fontSize: rf(40, 48, 56),
    fontWeight: 'bold',
    color: '#50AF27',
    marginVertical: rs(8, 12, 16),
  },
  pointsSubtext: {
    fontSize: rf(14, 16, 18),
    color: '#666',
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: rf(16, 18, 20),
    lineHeight: rf(24, 28, 32),
  },
  connectedText: {
    color: '#50AF27',
    fontWeight: '600',
  },
  disconnectedText: {
    color: '#FFA79D',
    fontWeight: '600',
  },
  treeCount: {
    fontSize: rf(30, 36, 42),
    fontWeight: 'bold',
    color: '#50AF27',
    marginVertical: rs(8, 12, 16),
  },
  co2Text: {
    fontSize: rf(14, 16, 18),
    color: '#666',
    fontStyle: 'italic',
    lineHeight: rf(20, 24, 28),
  },
  cardArrow: {
    marginLeft: 'auto',
  },
  tapHintText: {
    fontSize: rf(12, 14, 16),
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: rs(4, 6, 8),
  },
  sessionInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: rs(12, 16, 20),
    padding: rs(16, 20, 24),
    marginTop: rs(12, 16, 20),
  },
  sessionText: {
    fontSize: rf(14, 16, 18),
    color: '#50AF27',
    fontWeight: '500',
    marginBottom: rs(4, 6, 8),
  },
});

export default HomeScreen; 