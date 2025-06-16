import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { rf, rs } from '../../utils/responsive';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { wifiService, WiFiSession } from '../../services/wifiService';
import { treeService, Tree, RedeemTreeData } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import ENV from '../../config/env';
// @ts-ignore
import CustomModal from '../../components/CustomModal';

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
    top: rs(80),
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
    paddingBottom: rs(90),
  },
  content: {},
  pointsCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(24),
    marginBottom: rs(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 140,
  },
  splitContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  pointsSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: rs(16),
  },
  leaderboardSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(8),
  },
  leaderboardTitle: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
  },
  leaderboardSubtext: {
    fontSize: rf(12),
    color: '#666',
    marginTop: rs(8),
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
  },
  pointsValue: {
    fontSize: rf(36),
    fontWeight: 'bold',
    color: '#50AF27',
    marginVertical: rs(8),
    textAlign: 'center',
  },
  sessionContainer: {
    marginTop: rs(8),
    alignItems: 'center',
  },
  sessionPoints: {
    fontSize: rf(14),
    color: '#50AF27',
    fontWeight: '500',
    marginBottom: rs(4),
  },
  sessionNote: {
    fontSize: rf(10),
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  redeemCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    marginBottom: rs(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  redeemText: {
    fontSize: rf(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: rs(16),
    lineHeight: rf(22),
  },
  redeemButton: {
    backgroundColor: '#50AF27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(14),
    borderRadius: rs(12),
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: 'bold',
    marginLeft: rs(8),
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(16),
  },
  historyCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: rs(12),
    padding: rs(16),
    marginBottom: rs(8),
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(4),
  },
  historyIcon: {
    marginRight: rs(8),
  },
  historyType: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#333',
  },
  historyTime: {
    fontSize: rf(14),
    color: '#666',
    marginBottom: rs(2),
  },
  historyDuration: {
    fontSize: rf(12),
    color: '#999',
  },
  pointsChange: {
    fontSize: rf(18),
    fontWeight: 'bold',
  },
  pointsPositive: {
    color: '#50AF27',
  },
  pointsNegative: {
    color: '#FFA79D',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: rf(16),
    marginVertical: rs(20),
  },
  noTransactionsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: rf(14),
    marginVertical: rs(20),
    lineHeight: rf(20),
  },
});

// Types
type RootStackParamList = {
  Leaderboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  treesPlanted: number;
  studentId?: string;
  university?: string;
}

interface TreeSpecies {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  maxHeight: string;
}

interface SpeciesSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  treeSpecies: TreeSpecies[];
  loading: boolean;
}

interface PointsHistoryItemProps {
  type: string;
  time: string;
  duration: number;
  points: number;
}

interface Transaction {
  id?: string;
  _id?: string;
  type: string;
  amount: number;
  createdAt: string;
  metadata?: {
    startTime?: string;
    endTime?: string;
  };
}

interface WifiStatus {
  isConnected: boolean;
  sessionInfo: {
    pendingPoints?: number;
    progressPercent?: number;
  } | null;
}

interface TreeRedeemResult {
  user: User;
  tree: Tree;
}

const PointsHistoryItem: React.FC<PointsHistoryItemProps> = ({
  type,
  time,
  duration,
  points,
}) => {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyContent}>
        <View style={styles.historyLeft}>
          <View style={styles.historyTypeContainer}>
            <Icon
              name={type === 'WiFi Connection' ? 'wifi' : 'tree'}
              size={20}
              color="#50AF27"
              style={styles.historyIcon}
            />
            <Text style={styles.historyType}>{type}</Text>
          </View>
          <Text style={styles.historyTime}>{time}</Text>
          {duration > 0 && (
            <Text style={styles.historyDuration}>
              Duration: {Math.round(duration)} minutes
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.pointsChange,
            points >= 0 ? styles.pointsPositive : styles.pointsNegative,
          ]}
        >
          {points >= 0 ? '+' : ''}{points}
        </Text>
      </View>
    </View>
  );
};

const PointsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [treeSpecies, setTreeSpecies] = useState<TreeSpecies[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(user?.points || 0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showInsufficientPointsModal, setShowInsufficientPointsModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '' });
  const [currentSession, setCurrentSession] = useState<WiFiSession | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeData();
    
    // Get current WiFi session
    const getCurrentSession = async () => {
      try {
        const session = await wifiService.getActiveSession();
        setCurrentSession(session);
        if (session) {
          const duration = wifiService.calculateSessionDuration(session.startTime);
          const points = wifiService.calculatePointsEarned(duration);
          setSessionPoints(points);
        }
      } catch (error) {
        console.error('Error getting active session:', error);
      }
    };
    
    getCurrentSession();
    
    // Listen for WiFi session changes
    const unsubscribeWifi = eventService.addListener('wifi', async () => {
      await getCurrentSession();
    });
    
    // Listen for real-time points updates
    const unsubscribePoints = eventService.addListener('points', (data: { points?: number; totalPoints?: number }) => {
      console.log('PointsScreen - Received points update:', data);
      if (data.points !== undefined || data.totalPoints !== undefined) {
        const newPoints = data.totalPoints ?? data.points;
        setCurrentPoints(newPoints ?? 0);
        console.log('PointsScreen - Updated current points to:', newPoints);
      }
    });
    
    return () => {
      unsubscribeWifi.remove();
      unsubscribePoints.remove();
    };
  }, []);

  // Update points when user data changes
  useEffect(() => {
    if (user?.points !== undefined && user.points !== currentPoints) {
      console.log('PointsScreen - User points changed from', currentPoints, 'to', user.points);
      setCurrentPoints(user.points);
    }
  }, [user?.points]);

  const initializeData = async () => {
    try {
      await Promise.all([
        fetchTransactions(),
        initializeTreeService()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const initializeTreeService = async () => {
    try {
      const types = await treeService.getTreeTypes();
      const species = types.map((type, index) => ({
        id: index.toString(),
        name: type,
        description: `A beautiful ${type.toLowerCase()} tree species`,
        pointsCost: treeService.getTreeCost(),
        maxHeight: '20-30m'
      }));
      setTreeSpecies(species);
    } catch (error) {
      console.error('Error initializing TreeService:', error);
      setTreeSpecies([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      if (!user?.id) {
        console.warn('No user ID available for fetching transactions');
        setTransactions([]);
        return;
      }
      
      const history = await wifiService.getSessionHistory();
      const transactions = history.map(session => ({
        id: session._id,
        type: 'WiFi Connection',
        amount: session.pointsEarned || 0,
        createdAt: session.startTime.toString(),
        metadata: {
          startTime: session.startTime.toString(),
          endTime: session.endTime?.toString()
        }
      }));
      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setModalData({
        title: 'Error',
        message: 'Failed to fetch transactions. Please try again later.',
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      const currentUserPoints = currentPoints;
      const treeCost = ENV.POINTS_FOR_TREE;

      if (currentUserPoints < treeCost) {
        setModalData({
          title: 'Not Enough Points',
          message: `You need ${treeCost} points to redeem a tree. You currently have ${currentUserPoints} points.`
        });
        setShowInsufficientPointsModal(true);
        return;
      }

      // Load tree species if not already loaded
      if (treeSpecies.length === 0) {
        setSpeciesLoading(true);
        try {
          await initializeTreeService();
        } catch (error) {
          console.error('Error loading tree species:', error);
          setModalData({
            title: 'Error',
            message: 'Failed to load tree species. Please check your connection and try again.'
          });
          setShowErrorModal(true);
          return;
        } finally {
          setSpeciesLoading(false);
        }
      }

      // Show species selection modal
      if (treeSpecies.length > 0) {
        // Show loading state in the modal if species are still loading
        if (speciesLoading) {
          setModalData({
            title: 'Loading Tree Species',
            message: 'Please wait while we load available tree species...'
          });
          setShowSpeciesModal(true);
          return;
        }

        // Show the first species in the modal
        const firstSpecies = treeSpecies[0];
        setSelectedSpecies(firstSpecies);
        setShowSpeciesModal(true);
      } else {
        setModalData({
          title: 'No Trees Available',
          message: 'No tree species are currently available. Please try again later.'
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error in handleRedeem:', error);
      setModalData({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
      setShowErrorModal(true);
    }
  };

  const handleSpeciesSelect = async (speciesId: string) => {
    try {
      // Validate species exists
      const selectedSpecies = treeSpecies.find(species => species.id === speciesId);
      if (!selectedSpecies) {
        throw new Error('Selected tree species not found. Please try again.');
      }

      const data: RedeemTreeData = { speciesId };
      const result = await treeService.redeemTree(data);
      
      setShowSpeciesModal(false);
      setSelectedSpecies(null);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);

      // Update user data and local points
      if (user) {
        const updatedUser = {
          ...user,
          points: user.points - ENV.POINTS_FOR_TREE,
          treesPlanted: (user.treesPlanted || 0) + 1,
        };
        setCurrentPoints(updatedUser.points || 0);
        await updateUser(updatedUser);
      }

      // Refresh transactions
      fetchTransactions();

      setModalData({
        title: 'Tree Redeemed!',
        message: `Congratulations! Your ${result.species} tree has been planted. You now have ${user?.treesPlanted || 0} trees!`,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error redeeming tree:', error);
      setModalData({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to redeem tree. Please try again.',
      });
      setShowErrorModal(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await initializeData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: isAnimating
          ? withSequence(
              withSpring(1.2),
              withDelay(500, withSpring(1))
            )
          : 1,
      },
    ],
  }));

  const renderTransaction = ({ item }: { item: Transaction }) => {
    // Calculate duration from metadata if available
    let duration = 0;
    if (item.metadata?.startTime && item.metadata?.endTime) {
      const start = new Date(item.metadata.startTime);
      const end = new Date(item.metadata.endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        duration = (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
      }
    }

    return (
      <PointsHistoryItem
        type={item.type || 'WiFi Connection'}
        time={(() => {
          try {
            const date = new Date(item.createdAt);
            if (isNaN(date.getTime())) {
              return 'Unknown time';
            }
            return formatDistanceToNow(date, { addSuffix: true });
          } catch (error) {
            console.warn('Invalid createdAt:', item.createdAt);
            return 'Unknown time';
          }
        })()}
        duration={duration}
        points={item.amount}
      />
    );
  };

  const handleCloseModal = () => {
    setShowSpeciesModal(false);
    setSelectedSpecies(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" />

      {/* Fixed Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={[styles.headerSection, { paddingTop: insets.top }]}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.titleText}>Your Points</Text>
          <Text style={styles.subtitleText}>
            Earn points by connecting to university WiFi
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.content}>
            {/* Points Summary Card - Split Design */}
            <Animated.View style={[styles.pointsCard, animatedStyle]}>
              <View style={styles.splitContainer}>
                {/* Left Side - Total Points */}
                <View style={styles.pointsSection}>
                  <View style={styles.cardHeader}>
                    <Icon name="star" size={24} color="#50AF27" />
                    <Text style={styles.cardTitle}>Total Points</Text>
                  </View>
                  <Text style={styles.pointsValue}>{currentPoints}</Text>
                  {sessionPoints > 0 && (
                    <View style={styles.sessionContainer}>
                      <Text style={styles.sessionPoints}>
                        Pending: +{sessionPoints}
                      </Text>
                      <Text style={styles.sessionNote}>
                        (Auto-awarded per hour)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Divider */}
                <View style={styles.dividerVertical} />

                {/* Right Side - Leaderboard */}
                <TouchableOpacity 
                  style={styles.leaderboardSection}
                  onPress={() => navigation.navigate('Leaderboard')}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Icon name="trophy" size={24} color="#FFD700" />
                    <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                  </View>
                  <Icon name="chevron-right" size={32} color="#98D56D" />
                  <Text style={styles.leaderboardSubtext}>
                    View Rankings
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Redeem Tree Card */}
            <View style={styles.redeemCard}>
              <View style={styles.cardHeader}>
                <Icon name="tree" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Plant a Tree</Text>
              </View>
              <Text style={styles.redeemText}>
                Use 100 points to plant a tree and help the environment!
              </Text>
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  currentPoints < 100 && styles.redeemButtonDisabled
                ]}
                onPress={handleRedeem}
                disabled={currentPoints < 100}
              >
                <Icon name="plus-circle" size={20} color="#fff" />
                <Text style={styles.redeemButtonText}>
                  Redeem Tree (100 pts)
                </Text>
              </TouchableOpacity>
            </View>

            {/* History Card */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Activity</Text>
              {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : transactions.length > 0 ? (
                <FlatList
                  data={transactions.slice(0, 5)} // Show only recent 5
                  renderItem={renderTransaction}
                  keyExtractor={(item, index) => {
                    const key = item.id || item._id || `${item.createdAt}-${index}` || `transaction-${index}`;
                    return key.toString();
                  }}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noTransactionsText}>
                  No transactions yet. Start connecting to WiFi to earn points!
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../../assets/mascots/Unitree - Mascot-6.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Modals */}
      {selectedSpecies && (
        <CustomModal
          visible={showSpeciesModal}
          onClose={handleCloseModal}
          title="Choose Your Tree"
          message={`${selectedSpecies.description}\n\nHeight: ${selectedSpecies.maxHeight}\nCost: ${selectedSpecies.pointsCost} points`}
          iconName="tree"
          iconColor="#50AF27"
          type="default"
          buttons={[
            {
              text: 'Cancel',
              onPress: handleCloseModal
            },
            {
              text: 'Plant Tree',
              onPress: () => handleSpeciesSelect(selectedSpecies.id),
              style: 'primary'
            }
          ]}
        />
      )}

      <CustomModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalData.title}
        message={modalData.message}
        type="success"
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowSuccessModal(false),
            style: 'primary'
          }
        ]}
      />

      <CustomModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalData.title}
        message={modalData.message}
        type="error"
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowErrorModal(false),
            style: 'primary'
          }
        ]}
      />

      <CustomModal
        visible={showInsufficientPointsModal}
        onClose={() => setShowInsufficientPointsModal(false)}
        title={modalData.title}
        message={modalData.message}
        type="warning"
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowInsufficientPointsModal(false),
            style: 'primary'
          }
        ]}
      />
    </View>
  );
};

export default PointsScreen; 