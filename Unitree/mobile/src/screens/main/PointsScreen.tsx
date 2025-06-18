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
  Modal,
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
import { pointsService, Transaction, PointsState } from '../../services/pointsService';
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
  
  // Tree Redemption Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(20),
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    width: '100%',
    maxWidth: rs(400),
    maxHeight: '80%',
    minHeight: rs(500),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: rs(20),
    paddingBottom: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  modalContent: {
    padding: rs(20),
    paddingTop: rs(16),
    flex: 1,
    minHeight: rs(200),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: rf(16),
    color: '#D32F2F',
    marginBottom: rs(16),
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#50AF27',
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: rs(8),
  },
  retryText: {
    color: '#fff',
    fontSize: rf(14),
    fontWeight: 'bold',
  },
  speciesScrollView: {
    flex: 1,
  },
  noSpeciesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: rf(16),
    padding: rs(20),
  },
  treeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: rs(12),
    padding: rs(16),
    marginBottom: rs(12),
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  treeCardDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  treeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rs(8),
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: rs(2),
  },
  treeScientific: {
    fontSize: rf(14),
    color: '#666',
    fontStyle: 'italic',
  },
  treeCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costText: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#50AF27',
    marginRight: rs(4),
  },
  treeDescription: {
    fontSize: rf(14),
    color: '#444',
    lineHeight: rf(20),
    marginBottom: rs(12),
  },
  treeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treeStat: {
    fontSize: rf(12),
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
});

// Types  
type RootStackParamList = {
  leaderboard: undefined;
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
  scientificName: string;
  description: string;
  careLevel: string;
  maxHeight: string;
  lifespan: string;
  nativeTo: string;
  cost: number;
  stages: string[];
}



interface PointsHistoryItemProps {
  type: string;
  time: string;
  duration: number;
  points: number;
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

const TreeRedemptionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  userPoints: number;
  onRedeemTree: (species: TreeSpecies) => void;
}> = ({ visible, onClose, userPoints, onRedeemTree }) => {
  const [species, setSpecies] = useState<TreeSpecies[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      console.log('TreeRedemptionModal: Modal became visible, loading species...');
      loadTreeSpecies();
    }
  }, [visible]);

  const loadTreeSpecies = async () => {
    console.log('TreeRedemptionModal: Starting to load species...');
    setLoading(true);
    setError(null);
    try {
      console.log('TreeRedemptionModal: Calling treeService.getTreeSpecies()...');
      const speciesData = await treeService.getTreeSpecies();
      console.log('TreeRedemptionModal: Received species data:', speciesData);
      console.log('TreeRedemptionModal: Species count:', speciesData?.length || 0);
      setSpecies(speciesData || []);
    } catch (err) {
      console.error('TreeRedemptionModal: Error loading species:', err);
      setError('Failed to load tree species');
    } finally {
      setLoading(false);
      console.log('TreeRedemptionModal: Finished loading species');
    }
  };

  const handleSelectTree = (selectedSpecies: TreeSpecies) => {
    if (userPoints >= selectedSpecies.cost) {
      onRedeemTree(selectedSpecies);
      onClose();
    }
  };

  const renderSpeciesCard = (treeSpecies: TreeSpecies) => {
    const canAfford = userPoints >= treeSpecies.cost;
    
    return (
      <TouchableOpacity
        key={treeSpecies.id}
        style={[
          styles.treeCard,
          !canAfford && styles.treeCardDisabled
        ]}
        onPress={() => handleSelectTree(treeSpecies)}
        disabled={!canAfford}
      >
        <View style={styles.treeCardHeader}>
          <View style={styles.treeInfo}>
            <Text style={[styles.treeName, !canAfford && styles.disabledText]}>
              {treeSpecies.name}
            </Text>
            <Text style={[styles.treeScientific, !canAfford && styles.disabledText]}>
              {treeSpecies.scientificName}
            </Text>
          </View>
          <View style={styles.treeCost}>
            <Text style={[styles.costText, !canAfford && styles.disabledText]}>
              {treeSpecies.cost} pts
            </Text>
            {!canAfford && <Icon name="lock" size={16} color="#999" />}
          </View>
        </View>
        
        <Text style={[styles.treeDescription, !canAfford && styles.disabledText]}>
          {treeSpecies.description}
        </Text>
        
        <View style={styles.treeStats}>
          <Text style={[styles.treeStat, !canAfford && styles.disabledText]}>
            📏 {treeSpecies.maxHeight}
          </Text>
          <Text style={[styles.treeStat, !canAfford && styles.disabledText]}>
            💚 {treeSpecies.careLevel}
          </Text>
          <Text style={[styles.treeStat, !canAfford && styles.disabledText]}>
            ⏰ {treeSpecies.lifespan}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Tree</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {(() => {
              console.log('TreeRedemptionModal: Rendering content - loading:', loading, 'error:', error, 'species count:', species.length);
              
              if (loading) {
                console.log('TreeRedemptionModal: Showing loading state');
                return (
                  <View style={[styles.loadingContainer, { padding: 20, justifyContent: 'center', alignItems: 'center', minHeight: 100 }]}>
                    <Text style={[styles.loadingText, { fontSize: 16, color: '#666' }]}>Loading tree species...</Text>
                  </View>
                );
              }
              
              if (error) {
                console.log('TreeRedemptionModal: Showing error state:', error);
                return (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={loadTreeSpecies}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              
              console.log('TreeRedemptionModal: Showing species list, count:', species.length);
              return (
                <ScrollView style={[styles.speciesScrollView, { flex: 1, minHeight: 150 }]}>
                  {species.length === 0 ? (
                    <Text style={[styles.noSpeciesText, { textAlign: 'center', color: '#666', fontSize: 16, padding: 20 }]}>
                      No tree species available
                    </Text>
                  ) : (
                    species.map(renderSpeciesCard)
                  )}
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const PointsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUser } = useAuth();
  const [pointsState, setPointsState] = useState<PointsState>({ points: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '' });
  const [currentSession, setCurrentSession] = useState<WiFiSession | null>(null);
  const [showSpeciesSelection, setShowSpeciesSelection] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeData();
    
    // Initialize points service
    const initPointsService = async () => {
      await pointsService.init();
      setPointsState(pointsService.getState());
      setLoading(false);
    };
    
    initPointsService();
    
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
    
    // Listen for points service updates
    const unsubscribePoints = pointsService.addListener((state: PointsState) => {
      console.log('PointsScreen - Received points update:', state);
      setPointsState(state);
    });
    
    return () => {
      unsubscribeWifi.remove();
      unsubscribePoints();
    };
  }, []);

  const initializeData = async () => {
    try {
      await initializeTreeService();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const initializeTreeService = async () => {
    // This is now handled by the TreeRedemptionModal component
    return;
  };



  const handleRedeem = async () => {
    setShowSpeciesSelection(true);
  };

  const handleRedeemTree = async (species: TreeSpecies) => {
    try {
      console.log('Redeeming tree:', species);
      
      const data: RedeemTreeData = { speciesId: species.id };
      const result = await treeService.redeemTree(data);
      
      console.log('Tree redemption result:', result);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);

      // Update user data
      if (user) {
        const updatedUser = {
          ...user,
          points: pointsState.points - species.cost,
          treesPlanted: (user.treesPlanted || 0) + 1,
        };
        await updateUser(updatedUser);
      }

      // Notify other screens about the new tree
      eventService.emit('treeRedeemed', { 
        speciesName: species.name,
        newTreeCount: (user?.treesPlanted || 0) + 1 
      });

      // Refresh points from service
      await pointsService.refreshPoints();
      setPointsState(pointsService.getState());

      setModalData({
        title: 'Tree Planted!',
        message: `Congratulations! Your ${species.name} (${species.scientificName}) has been planted successfully!`,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error redeeming tree:', error);
      setModalData({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to plant tree. Please try again.',
      });
      setShowErrorModal(true);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await initializeData();
      await pointsService.refreshPoints();
      setPointsState(pointsService.getState());
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
                  <Text style={styles.pointsValue}>{pointsState.points}</Text>
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
                  onPress={() => navigation.navigate('leaderboard')}
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
                Choose from multiple tree species and help the environment!
              </Text>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeem}
              >
                <Icon name="plus-circle" size={20} color="#fff" />
                <Text style={styles.redeemButtonText}>
                  Choose Tree Species
                </Text>
              </TouchableOpacity>
            </View>

            {/* History Card */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Activity</Text>
              {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : pointsState.transactions.length > 0 ? (
                <FlatList
                  data={pointsState.transactions.slice(0, 5)} // Show only recent 5
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

      {/* Tree Redemption Modal */}
      <TreeRedemptionModal
        visible={showSpeciesSelection}
        onClose={() => setShowSpeciesSelection(false)}
        userPoints={pointsState.points}
        onRedeemTree={handleRedeemTree}
      />

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


    </View>
  );
};

export default PointsScreen; 