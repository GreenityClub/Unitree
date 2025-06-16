import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wifiService } from '../../services/wifiService';
import { treeService } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
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
  Points: undefined;
  Trees: undefined;
  Profile: undefined;
  WifiStatus: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WifiStatus {
  isConnected: boolean;
  sessionInfo: {
    startTime?: Date;
    pendingPoints?: number;
    completeHours?: number;
    progressPercent?: number;
    minutesToNextHour?: number;
    transaction?: any;
    newTotalPoints?: number;
  } | null;
}

const HomeScreen = () => {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [wifiStatus, setWifiStatus] = useState<WifiStatus>({
    isConnected: false,
    sessionInfo: null
  });
  const [currentPoints, setCurrentPoints] = useState<number>(user?.points || 0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const insets = useSafeAreaInsets();

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

  // Listen for real-time points updates
  useEffect(() => {
    if (!user) return;

    const subscription = eventService.addListener('points', (data: { points?: number; totalPoints?: number }) => {
      console.log('HomeScreen - Received points update:', data);
      if (data.points !== undefined || data.totalPoints !== undefined) {
        const newPoints = data.totalPoints ?? data.points;
        setCurrentPoints(newPoints ?? 0);
        console.log('HomeScreen - Updated current points to:', newPoints);
      }
    });

    return () => {
      eventService.removeAllListeners('points');
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
      const duration = wifiService.calculateSessionDuration(wifiStatus.sessionInfo.startTime);
      return `Connected to university WiFi\nSession duration: ${wifiService.formatSessionDuration(duration)}`;
    }
    return 'Not connected to university WiFi';
  };

  const getWifiStatusIcon = () => {
    return wifiStatus.isConnected ? 'wifi' : 'wifi-off';
  };

  // Navigation handlers
  const navigateToPoints = () => {
    navigation.navigate('Points');
  };

  const navigateToTrees = () => {
    navigation.navigate('Trees');
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const navigateToWifi = () => {
    navigation.navigate('WifiStatus');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" />

      {/* Fixed Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={[styles.headerSection, { paddingTop: insets.top }]}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.titleText}>
            Welcome back, {user?.name || 'User'}!
          </Text>
          <Text style={styles.subtitleText}>
            Track your WiFi sessions and plant more trees
          </Text>
        </View>
      </Animated.View>

      {/* Scrollable Content Section */}
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
            {/* Points Card */}
            <TouchableOpacity 
              style={styles.pointsCard}
              onPress={navigateToPoints}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Icon name="star" size={24} color="#50AF27" />
                <Text style={styles.cardTitle}>Your Points</Text>
                <View style={styles.cardArrow}>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              </View>
              <Text style={styles.pointsValue}>{currentPoints}</Text>
              <Text style={styles.pointsSubtext}>Keep connecting to earn more!</Text>
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
                    Pending points: {wifiStatus.sessionInfo.pendingPoints || 0}
                  </Text>
                  <Text style={styles.sessionText}>
                    Complete hours: {wifiStatus.sessionInfo.completeHours || 0}
                  </Text>
                  <Text style={styles.sessionText}>
                    Progress to next hour: {wifiStatus.sessionInfo.progressPercent || 0}% 
                    ({wifiStatus.sessionInfo.minutesToNextHour || 60} min remaining)
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
              <Text style={styles.treeCount}>{user?.treesPlanted || 0}</Text>
              <Text style={styles.co2Text}>
                You've helped reduce CO₂ by approximately {(user?.treesPlanted || 0) * 48}kg per year!
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Mascot - Positioned to appear on top */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../../assets/mascots/Unitree - Mascot-4.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#B7DDE6',
  },
  container: {
    flex: 1,
    backgroundColor: '#B7DDE6',
  },
  
  // Header Section Styles
  headerSection: {
    backgroundColor: '#B7DDE6',
    paddingBottom: rs(80),
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
    textAlign: 'left',
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
    minHeight: '100%',
  },
  mascotContainer: {
    position: 'absolute',
    right: rs(20),
    top: rs(80),
    zIndex: 9999,
  },
  mascotImage: {
    width: wp(40),
    height: wp(40),
  },
  scrollContainer: {
    flex: 1,
    marginTop: rs(40),
    borderRadius: rs(16),
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: rs(80),
  },
  content: {
    width: '100%',
  },
  
  // Card Styles
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