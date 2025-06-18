import React, { useEffect, useState } from 'react';
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
  onPress?: (user: LeaderboardUser) => void;
}

// Custom error type to handle API errors
interface ApiError extends Error {
  code?: string;
  response?: {
    status?: number;
    data?: any;
  };
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ rank, user, isCurrentUser, onPress }) => {
  const [avatarError, setAvatarError] = useState(false);

  const getDisplayAvatarUri = (user: LeaderboardUser) => {
    if (user.avatar && !avatarError) {
      const fullAvatarUrl = getAvatarUrl(user.avatar);
      if (fullAvatarUrl) {
        // Debug logging for development
        if (__DEV__) {
          console.log(`Loading avatar for ${user.nickname || user.name}: ${fullAvatarUrl}`);
        }
        return { uri: fullAvatarUrl };
      }
    }
    return undefined; // Will show default fallback
  };

  const getInitials = (user: LeaderboardUser) => {
    const name = user.nickname || user.name || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getLevelBadge = (points: number = 0) => {
    // Simple level calculation based on points
    const level = Math.floor(points / 1000) + 1;
    return level;
  };

  return (
    <TouchableOpacity
      style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem
      ]}
      onPress={() => onPress && onPress(user)}
      activeOpacity={0.7}
    >
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rankText,
          isCurrentUser && styles.currentUserRankText
        ]}>
          {rank}
        </Text>
      </View>

      <View style={styles.avatarContainer}>
        {getDisplayAvatarUri(user) ? (
          <Image
            source={getDisplayAvatarUri(user)!}
            style={styles.avatar}
            resizeMode="cover"
            onError={handleAvatarError(() => setAvatarError(true))}
          />
        ) : (
          <View style={[
            styles.defaultAvatar,
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
      </View>

      <View style={styles.userInfo}>
        <Text style={[
          styles.userName,
          isCurrentUser && styles.currentUserName
        ]}>
          {user.nickname || user.name || 'Anonymous'}
        </Text>
        <Text style={[
          styles.userPoints,
          isCurrentUser && styles.currentUserPoints
        ]}>
          {user.allTimePoints || 0} Total Points
        </Text>
        <Text style={[
          styles.userSubPoints,
          isCurrentUser && styles.currentUserSubPoints
        ]}>
          {user.points || 0} Available • {user.totalWifiTimeFormatted || '0m'} Connected
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const LeaderboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch real leaderboard data from API using userService
      const data = await userService.getLeaderboard(50);
      
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
  scrollView: {
    flex: 1,
    paddingHorizontal: rs(20),
  },
  scrollContent: {
    paddingBottom: rs(100), // Extra padding for tab bar
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
    padding: rs(20),
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
    fontSize: rf(14),
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
});

export default LeaderboardScreen; 