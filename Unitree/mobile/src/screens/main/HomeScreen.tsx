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
import { eventService } from '../../services/eventService';
import { pointsService } from '../../services/pointsService';
import { useAuth } from '../../context/AuthContext';
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
  SCREEN_DIMENSIONS 
} from '../../utils/responsive';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
type RootStackParamList = {
  points: undefined;
  trees: undefined;
  profile: undefined;
  wifi: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WifiStatus {
  isConnected: boolean;
  sessionInfo: WifiStats['currentSession'];
}

const HomeScreen = () => {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'index' });
  const [wifiStatus, setWifiStatus] = useState<WifiStatus>({
    isConnected: false,
    sessionInfo: null
  });
  const [currentPoints, setCurrentPoints] = useState<number>(user?.points || 0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [actualTreeCount, setActualTreeCount] = useState<number>(0);
  const insets = useSafeAreaInsets();

  // Get last name from full name
  const getLastName = (fullname: string | undefined): string => {
    if (!fullname) return 'User';
    const nameParts = fullname.trim().split(' ');
    return nameParts[nameParts.length - 1];
  };

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    
    // Initialize WiFi monitoring and set up listeners
    const initializeWifiMonitor = async () => {
      try {
        // Only initialize if we have a user
        if (!user) {
          console.log('No user available, skipping WiFi monitor initialization');
          return;
        }
        
        console.log('Initializing WiFi monitor for user:', user.id);
        
        // Get initial connection status
        const currentSession = await wifiService.getActiveSession();
        setWifiStatus({
          isConnected: !!currentSession,
          sessionInfo: currentSession
        });

        // Fetch actual tree count
        await fetchActualTreeCount();

        // Add connection change listener
        const subscription = eventService.addListener('wifi', (status: WifiStatus) => {
          console.log('WiFi status changed:', status);
          setWifiStatus(status);
        });

        cleanup = () => {
          eventService.removeAllListeners('wifi');
        };
      } catch (error) {
        console.error('Error initializing WiFi monitor:', error);
      }
    };

    initializeWifiMonitor();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user?.id]); // Reinitialize when user changes

  // Update points when user data changes
  useEffect(() => {
    if (user?.points !== undefined) {
      setCurrentPoints(user.points);
    }
  }, [user?.points]);

  // Sync with pointsService when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const currentPointsFromService = pointsService.getPoints();
        console.log('HomeScreen focus - Points from service:', currentPointsFromService);
        console.log('HomeScreen focus - Current local points:', currentPoints);
        
        if (currentPointsFromService !== currentPoints) {
          setCurrentPoints(currentPointsFromService);
          console.log('HomeScreen focus - Updated points to:', currentPointsFromService);
        }
      }
    }, [currentPoints, user])
  );

  // Listen for real-time points updates
  useEffect(() => {
    if (!user) return;

    const pointsSubscription = eventService.addListener('points', (data: { points?: number; totalPoints?: number }) => {
      console.log('HomeScreen - Received points update:', data);
      if (data.points !== undefined || data.totalPoints !== undefined) {
        const newPoints = data.totalPoints ?? data.points;
        setCurrentPoints(newPoints ?? 0);
        console.log('HomeScreen - Updated current points to:', newPoints);
      }
    });

    const treeSubscription = eventService.addListener('treeRedeemed', (data: { speciesName: string; newTreeCount: number }) => {
      console.log('HomeScreen - Tree redeemed:', data);
      fetchActualTreeCount(); // Refresh actual tree count from API
    });

    return () => {
      eventService.removeAllListeners('points');
      eventService.removeAllListeners('treeRedeemed');
    };
  }, [user?.id]);

  // Update time every second for real-time duration display
  useEffect(() => {
    if (!user) return; // Don't run timer if user is not logged in

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user]); // Depend on user so timer restarts/stops with login/logout

  const getWifiStatusText = () => {
    if (wifiStatus.isConnected && wifiStatus.sessionInfo?.startTime) {
      const duration = wifiService.calculateSessionDuration(new Date(wifiStatus.sessionInfo.startTime));
      return `Connected to university WiFi\nSession duration: ${wifiService.formatSessionDuration(duration)}`;
    }
    return 'Not connected to university WiFi';
  };

  const getWifiStatusIcon = () => {
    return wifiStatus.isConnected ? 'wifi' : 'wifi-off';
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh WiFi status
      if (user) {
        const currentSession = await wifiService.getActiveSession();
        setWifiStatus({
          isConnected: !!currentSession,
          sessionInfo: currentSession
        });
      }
      
      // Refresh points from service
      await pointsService.refreshPoints();
      const updatedPoints = pointsService.getPoints();
      setCurrentPoints(updatedPoints);
      console.log('HomeScreen refresh - Updated points to:', updatedPoints);
      
      // Fetch actual tree count
      await fetchActualTreeCount();
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
          style={[styles.headerSection, { paddingTop: insets.top }, headerAnimatedStyle]}
          onTouchStart={handleTouchStart}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.titleText}>
              Welcome back, {getLastName(user?.fullname)}!
            </Text>
            <Text style={styles.subtitleText}>
              Track your WiFi sessions and plant more trees
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
            {/* Points Card */}
            <TouchableOpacity 
              style={styles.pointsCard}
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
              <Text style={styles.pointsValue}>{currentPoints}</Text>
              <Text style={styles.pointsSubtext}>
                Use your points to plant new trees!
              </Text>
            </TouchableOpacity>

            {/* WiFi Status Card */}
            <TouchableOpacity 
              style={styles.statusCard}
              onPress={navigateToWifi}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Icon 
                  name={getWifiStatusIcon()} 
                  size={24} 
                  color={wifiStatus.isConnected ? "#50AF27" : "#FFA79D"} 
                />
                <Text style={styles.cardTitle}>WiFi Status</Text>
                <View style={styles.cardArrow}>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              </View>
              <Text style={[
                styles.statusText,
                wifiStatus.isConnected ? styles.connectedText : styles.disconnectedText
              ]}>
                {getWifiStatusText()}
              </Text>
              {wifiStatus.isConnected && wifiStatus.sessionInfo && (
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionText}>
                    Points earned: {wifiStatus.sessionInfo.points || 0}
                  </Text>
                  <Text style={styles.sessionText}>
                    Duration: {wifiService.formatWifiTime(wifiStatus.sessionInfo.duration || 0)}
                  </Text>
                  <Text style={styles.tapHintText}>
                    Tap to view WiFi details
                  </Text>
                </View>
              )}
              {!wifiStatus.isConnected && (
                <Text style={styles.tapHintText}>
                  Tap to view WiFi details
                </Text>
              )}
            </TouchableOpacity>

            {/* Trees Card */}
            <TouchableOpacity 
              style={styles.treesCard}
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
                You've helped reduce CO₂ by approximately {(actualTreeCount * 48)}kg per year!
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../assets/mascots/Unitree - Mascot-5.png')}
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
    backgroundColor: '#B7DDE6',
  },
  headerSection: {
    backgroundColor: '#B7DDE6',
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
  pointsCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    marginBottom: rs(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    marginBottom: rs(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  treesCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
  },
  cardTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
  },
  pointsValue: {
    fontSize: rf(40),
    fontWeight: 'bold',
    color: '#50AF27',
    marginVertical: rs(8),
  },
  pointsSubtext: {
    fontSize: rf(14),
    color: '#666',
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: rf(16),
    lineHeight: rf(24),
  },
  connectedText: {
    color: '#50AF27',
    fontWeight: '600',
  },
  disconnectedText: {
    color: '#FFA79D',
    fontWeight: '600',
  },
  sessionInfo: {
    marginTop: rs(12),
    padding: rs(12),
    backgroundColor: '#F0F9FF',
    borderRadius: rs(8),
    marginBottom: rs(8),
  },
  sessionText: {
    fontSize: rf(14),
    color: '#50AF27',
    fontWeight: '500',
  },
  treeCount: {
    fontSize: rf(30),
    fontWeight: 'bold',
    color: '#50AF27',
    marginVertical: rs(8),
  },
  co2Text: {
    fontSize: rf(14),
    color: '#666',
    fontStyle: 'italic',
    lineHeight: rf(20),
  },
  cardArrow: {
    marginLeft: 'auto',
  },
  tapHintText: {
    fontSize: rf(12),
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: rs(4),
  },
});

export default HomeScreen; 