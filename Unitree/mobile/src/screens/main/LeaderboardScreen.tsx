import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import userService, { LeaderboardUser, LeaderboardResponse } from '../../services/userService';
import { getAvatarUrl, handleAvatarError } from '../../utils/imageUtils';
import { rf, rs, wp, hp } from '../../utils/responsive';

interface LeaderboardItemProps {
  rank: number;
  user: LeaderboardUser;
  isCurrentUser: boolean;
  period: 'all-time' | 'monthly';
  onPress?: (user: LeaderboardUser) => void;
}

// Sparkle effect component for top 3 users
const SparkleEffect: React.FC<{ rank: number }> = ({ rank }) => {
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);

  useEffect(() => {
    const startSparkles = () => {
      sparkle1.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
      sparkle2.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        true
      );
      sparkle3.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
      );
    };

    if (rank <= 3) {
      startSparkles();
    }
  }, [rank]);

  const sparkle1Style = useAnimatedStyle(() => {
    const opacity = interpolate(sparkle1.value, [0, 0.5, 1], [0.3, 1, 0.3]);
    const scale = interpolate(sparkle1.value, [0, 0.5, 1], [0.5, 1.2, 0.5]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const sparkle2Style = useAnimatedStyle(() => {
    const opacity = interpolate(sparkle2.value, [0, 0.5, 1], [0.2, 0.8, 0.2]);
    const scale = interpolate(sparkle2.value, [0, 0.5, 1], [0.3, 1, 0.3]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const sparkle3Style = useAnimatedStyle(() => {
    const opacity = interpolate(sparkle3.value, [0, 0.5, 1], [0.4, 1, 0.4]);
    const scale = interpolate(sparkle3.value, [0, 0.5, 1], [0.6, 1.1, 0.6]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  if (rank > 3) return null;

  return (
    <View style={styles.sparkleContainer}>
      <Animated.View style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
        <Icon name="star-four-points" size={12} color="#FFD700" />
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
        <Icon name="star-four-points" size={8} color="#FFA500" />
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>
        <Icon name="star-four-points" size={10} color="#FFD700" />
      </Animated.View>
    </View>
  );
};

// Custom error type to handle API errors
interface ApiError extends Error {
  code?: string;
  response?: {
    status?: number;
    data?: any;
  };
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ rank, user, isCurrentUser, period, onPress }) => {
  const [avatarError, setAvatarError] = useState(false);
  
  // Animation values for top 3 special effects
  const glowValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  // Memoize avatar URI to prevent multiple calls and excessive logging
  const avatarUri = useMemo(() => {
    if (user.avatar && !avatarError) {
      const fullAvatarUrl = getAvatarUrl(user.avatar);
      if (fullAvatarUrl) {
        return { uri: fullAvatarUrl };
      }
    }
    return undefined; // Will show default fallback
  }, [user.avatar, avatarError]);

  useEffect(() => {
    if (rank <= 3) {
      // Glow animation for top 3
      glowValue.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
      
      // Pulse animation for #1
      if (rank === 1) {
        pulseValue.value = withRepeat(
          withTiming(1.05, { duration: 1500 }),
          -1,
          true
        );
      }
    }
  }, [rank]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    if (rank > 3) return {};
    
    const opacity = interpolate(glowValue.value, [0, 1], [0.3, 0.8]);
    const scale = interpolate(glowValue.value, [0, 1], [1, 1.02]);
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => {
    if (rank !== 1) return {};
    
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  const getInitials = (user: LeaderboardUser) => {
    const name = user.nickname || user.fullname || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getLevelBadge = (points: number = 0) => {
    // Simple level calculation based on points
    const level = Math.floor(points / 1000) + 1;
    return level;
  };

  const getTopRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'crown';
      case 2:
        return 'medal-outline';
      case 3:
        return 'medal-outline';
      default:
        return null;
    }
  };

  const getTopRankIconColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#666';
    }
  };

  const getTopRankStyle = (rank: number) => {
    if (rank > 3) return null;
    
    switch (rank) {
      case 1:
        return styles.firstPlaceItem;
      case 2:
        return styles.secondPlaceItem;
      case 3:
        return styles.thirdPlaceItem;
      default:
        return null;
    }
  };

  const getTopRankGlowStyle = (rank: number) => {
    if (rank > 3) return null;
    
    switch (rank) {
      case 1:
        return styles.firstPlaceGlow;
      case 2:
        return styles.secondPlaceGlow;
      case 3:
        return styles.thirdPlaceGlow;
      default:
        return null;
    }
  };

  const topRankIcon = getTopRankIcon(rank);
  const topRankStyle = getTopRankStyle(rank);
  const topRankGlowStyle = getTopRankGlowStyle(rank);

  return (
    <View style={styles.itemWrapper}>
      {/* Glow effect background for top 3 */}
      {rank <= 3 && (
        <Animated.View
          style={[
            styles.glowBackground,
            topRankGlowStyle,
            animatedGlowStyle,
          ]}
        />
      )}
      
      <Animated.View style={rank === 1 ? animatedPulseStyle : {}}>
        <TouchableOpacity
          style={[
            styles.leaderboardItem,
            topRankStyle,
            isCurrentUser && styles.currentUserItem
          ]}
          onPress={() => onPress && onPress(user)}
          activeOpacity={0.7}
        >
          <View style={styles.rankContainer}>
            {topRankIcon ? (
              <View style={styles.rankWithIcon}>
                <Icon 
                  name={topRankIcon} 
                  size={rank === 1 ? 28 : 24} 
                  color={getTopRankIconColor(rank)} 
                />
                <Text style={[
                  styles.rankText,
                  styles.topRankText,
                  rank === 1 && styles.firstPlaceRankText,
                  isCurrentUser && styles.currentUserRankText
                ]}>
                  {rank}
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.rankText,
                isCurrentUser && styles.currentUserRankText
              ]}>
                {rank}
              </Text>
            )}
          </View>

          <View style={[
            styles.avatarContainer,
            rank <= 3 && styles.topRankAvatarContainer
          ]}>
            {avatarUri ? (
              <Image
                source={avatarUri}
                style={[
                  styles.avatar,
                  rank <= 3 && styles.topRankAvatar
                ]}
                resizeMode="cover"
                onError={handleAvatarError(() => setAvatarError(true))}
              />
            ) : (
              <View style={[
                styles.defaultAvatar,
                rank <= 3 && styles.topRankAvatar,
                isCurrentUser && styles.currentUserDefaultAvatar
              ]}>
                <Text style={[
                  styles.avatarInitials,
                  isCurrentUser && styles.currentUserAvatarInitials
                ]}>
                  {getInitials(user)}
                </Text>
              </View>
            )}
            
            {/* Crown overlay for #1 */}
            {rank === 1 && (
              <View style={styles.crownOverlay}>
                <Icon name="crown" size={20} color="#FFD700" />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={[
              styles.userName,
              rank <= 3 && styles.topRankUserName,
              isCurrentUser && styles.currentUserName
            ]}>
              {user.nickname || user.fullname || 'Anonymous'}
            </Text>
            <Text style={[
              styles.userPoints,
              rank <= 3 && styles.topRankUserPoints,
              isCurrentUser && styles.currentUserPoints
            ]}>
              {period === 'monthly' 
                ? `${user.monthlyPoints || 0} This Month` 
                : `${user.allTimePoints || 0} Total Points`
              }
            </Text>
          </View>

                     {/* Special badge for top 3 */}
           {rank <= 3 && (
             <View style={styles.specialBadgeContainer}>
               <View style={[
                 styles.specialBadge,
                 rank === 1 && styles.firstPlaceBadge,
                 rank === 2 && styles.secondPlaceBadge,
                 rank === 3 && styles.thirdPlaceBadge,
               ]}>
                 <Text style={[
                   styles.specialBadgeText,
                   rank === 1 && styles.firstPlaceBadgeText,
                 ]}>
                   {rank === 1 ? 'CHAMPION' : rank === 2 ? 'RUNNER-UP' : 'TOP 3'}
                 </Text>
               </View>
             </View>
           )}

           {/* Sparkle effects for top 3 */}
           <SparkleEffect rank={rank} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const LeaderboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all-time' | 'monthly'>('all-time');

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up auto-refresh every minute
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing leaderboard...');
      fetchLeaderboard(true);
    }, 60000); // 60 seconds = 1 minute
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [selectedPeriod]); // Re-fetch when period changes

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch real leaderboard data from API using userService
      const data = await userService.getLeaderboard(50, selectedPeriod);
      
      if (data && data.leaderboard) {
        setLeaderboardData(data.leaderboard);
        setUserRank(data.userRank || null);
        
        console.log('Leaderboard data loaded:', {
          totalUsers: data.totalUsers,
          userRank: data.userRank,
          leaderboardSize: data.leaderboard.length,
          currentUserId: data.currentUserId
        });
      } else {
        console.warn('Invalid leaderboard response:', data);
        setLeaderboardData([]);
        setUserRank(null);
      }
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      
      // Handle different error types
      const apiError = error as ApiError;
      if (apiError.code === 'NETWORK_ERROR' || apiError.message.includes('Network')) {
        console.log('Network error - setting empty leaderboard');
      } else if (apiError.response?.status === 401 || apiError.message.includes('Session expired')) {
        console.log('Session expired - user needs to login again');
      } else {
        console.log('General error loading leaderboard:', apiError.message);
      }
      
      // Set empty data on error
      setLeaderboardData([]);
      setUserRank(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  const handleUserPress = (userData: LeaderboardUser) => {
    // Navigate to user profile or show user details
    console.log('User pressed:', userData);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: 'all-time' | 'monthly') => {
    setSelectedPeriod(period);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#98D56D" />

      {/* Header */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerPlaceholder} />
      </Animated.View>

      {/* Pill Tabs */}
      <Animated.View 
        entering={FadeInUp.delay(300)}
        style={styles.tabsContainer}
      >
        <View style={styles.pillTabs}>
          <TouchableOpacity
            style={[
              styles.pillTab,
              selectedPeriod === 'all-time' && styles.pillTabActive
            ]}
            onPress={() => handlePeriodChange('all-time')}
          >
            <Text style={[
              styles.pillTabText,
              selectedPeriod === 'all-time' && styles.pillTabTextActive
            ]}>
              All Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pillTab,
              selectedPeriod === 'monthly' && styles.pillTabActive
            ]}
            onPress={() => handlePeriodChange('monthly')}
          >
            <Text style={[
              styles.pillTabText,
              selectedPeriod === 'monthly' && styles.pillTabTextActive
            ]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View 
        entering={FadeInUp.delay(400)}
        style={styles.content}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="trophy-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No rankings available yet</Text>
              <Text style={styles.emptySubtext}>Start earning points to appear on the leaderboard!</Text>
            </View>
          ) : (
            leaderboardData.map((item, index) => {
              const rank = index + 1;
              const isCurrentUser = item.id?.toString() === user?.id?.toString() || 
                                  item.email === user?.email ||
                                  (userRank !== null && rank === userRank);
              
              return (
                <Animated.View
                  key={item.id || index}
                  entering={FadeInUp.delay(600 + (index * 100))}
                >
                  <LeaderboardItem
                    rank={rank}
                    user={item}
                    isCurrentUser={isCurrentUser}
                    period={selectedPeriod}
                    onPress={handleUserPress}
                  />
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCED2', // Pink background
  },
  header: {
    backgroundColor: '#98D56D', // Green header
    paddingTop: rs(50),
    paddingBottom: rs(20),
    paddingHorizontal: rs(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: rs(8),
  },
  headerTitle: {
    flex: 1,
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40, // Same width as back button for centering
  },
  content: {
    flex: 1,
    paddingTop: rs(20),
  },
  tabsContainer: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(15),
    backgroundColor: '#FFCED2',
  },
  pillTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: rs(25),
    padding: rs(4),
  },
  pillTab: {
    flex: 1,
    paddingVertical: rs(10),
    paddingHorizontal: rs(20),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTabActive: {
    backgroundColor: '#98D56D',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pillTabText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: '#666',
  },
  pillTabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: rs(20),
  },
  scrollContent: {
    paddingBottom: rs(100), // Extra padding for tab bar
    paddingTop: rs(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: rs(60),
  },
  loadingText: {
    fontSize: rf(16),
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: rs(60),
  },
  emptyText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginTop: rs(16),
    marginBottom: rs(8),
  },
  emptySubtext: {
    fontSize: rf(14),
    color: '#999',
    textAlign: 'center',
  },
  leaderboardItem: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(15),
    marginBottom: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentUserItem: {
    backgroundColor: '#98D56D', // Green for current user
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserRankText: {
    color: '#fff',
  },
  avatarContainer: {
    marginLeft: rs(16),
    marginRight: rs(16),
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: rs(25),
    borderWidth: 2,
    borderColor: '#fff',
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: rs(25),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarInitials: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserDefaultAvatar: {
    backgroundColor: '#98D56D',
  },
  currentUserAvatarInitials: {
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(4),
  },
  currentUserName: {
    color: '#fff',
  },
  userPoints: {
    fontSize: rf(17),
    color: '#98D56D',
    fontWeight: '500',
  },
  currentUserPoints: {
    color: '#E8F5E8',
  },
  userSubPoints: {
    fontSize: rf(12),
    color: '#999',
  },
  currentUserSubPoints: {
    color: '#999',
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: rs(8),
    paddingVertical: rs(4),
    borderRadius: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserLevelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#98D56D',
    marginLeft: rs(2),
  },
  currentUserLevelText: {
    color: '#fff',
  },
  itemWrapper: {
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  firstPlaceItem: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  secondPlaceItem: {
    backgroundColor: '#C0C0C0',
    borderWidth: 2,
    borderColor: '#A8A8A8',
    elevation: 6,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    transform: [{ scale: 1.01 }],
  },
  thirdPlaceItem: {
    backgroundColor: '#CD7F32',
    borderWidth: 2,
    borderColor: '#B8860B',
    elevation: 4,
    shadowColor: '#CD7F32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  firstPlaceGlow: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: rs(20),
    marginHorizontal: -rs(4),
    marginVertical: -rs(2),
  },
  secondPlaceGlow: {
    backgroundColor: 'rgba(192, 192, 192, 0.25)',
    borderRadius: rs(18),
    marginHorizontal: -rs(3),
    marginVertical: -rs(1.5),
  },
  thirdPlaceGlow: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderRadius: rs(17),
    marginHorizontal: -rs(2),
    marginVertical: -rs(1),
  },
  rankWithIcon: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankText: {
    fontWeight: 'bold',
  },
  firstPlaceRankText: {
    color: '#FFD700',
  },
  secondPlaceRankText: {
    color: '#C0C0C0',
  },
  thirdPlaceRankText: {
    color: '#CD7F32',
  },
  topRankUserName: {
    color: '#fff',
  },
  topRankUserPoints: {
    color: '#E8F5E8',
  },
  specialBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: rs(8),
  },
  specialBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: rs(4),
    paddingVertical: rs(2),
    borderRadius: rs(4),
  },
  specialBadgeText: {
    fontSize: rf(12),
    fontWeight: 'bold',
    color: '#333',
  },
  firstPlaceBadge: {
    backgroundColor: '#FFD700',
  },
  firstPlaceBadgeText: {
    color: '#fff',
  },
  secondPlaceBadge: {
    backgroundColor: '#C0C0C0',
  },
  thirdPlaceBadge: {
    backgroundColor: '#CD7F32',
  },
  crownOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: rs(4),
  },
  topRankAvatarContainer: {
    marginLeft: rs(16),
    marginRight: rs(16),
  },
  topRankAvatar: {
    width: 55,
    height: 55,
    borderRadius: rs(27.5),
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: rs(15),
    right: rs(25),
  },
  sparkle2: {
    top: rs(35),
    left: rs(15),
  },
  sparkle3: {
    bottom: rs(20),
    right: rs(45),
  },
});

export default LeaderboardScreen; 