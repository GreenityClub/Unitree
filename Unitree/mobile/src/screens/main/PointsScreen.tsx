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
  TextInput,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
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
import { useTabBarContext } from '../../context/TabBarContext';
import { useWiFi } from '../../context/WiFiContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { formatDistanceToNow } from 'date-fns';
import { rf, rs, isSmallHeightDevice } from '../../utils/responsive';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { wifiService, WiFiSession, WifiStats } from '../../services/wifiService';
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
    paddingBottom: isSmallHeightDevice() ? rs(60) : rs(90),
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
    borderRadius: rs(20),
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: rs(20),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: rs(4),
  },
  modalPillTabsContainer: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(15),
  },
  modalPillTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(152, 213, 109, 0.2)',
    borderRadius: rs(25),
    padding: rs(4),
  },
  modalPillTab: {
    flex: 1,
    paddingVertical: rs(10),
    paddingHorizontal: rs(20),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPillTabActive: {
    backgroundColor: '#98D56D',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalPillTabText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: '#666',
  },
  modalPillTabTextActive: {
    color: '#fff',
  },
  modalContent: {
    maxHeight: rs(400),
    paddingHorizontal: rs(20),
  },
  modalDescription: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: rs(16),
    lineHeight: rf(20),
  },
  userPointsText: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#50AF27',
    textAlign: 'center',
    marginBottom: rs(20),
  },
  speciesGrid: {
    paddingBottom: rs(20),
  },
  speciesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: rs(12),
    padding: rs(16),
    marginBottom: rs(12),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  speciesCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(4),
  },
  speciesScientific: {
    fontSize: rf(12),
    color: '#666',
    fontStyle: 'italic',
    marginBottom: rs(8),
  },
  speciesDescription: {
    fontSize: rf(13),
    color: '#666',
    lineHeight: rf(18),
    marginBottom: rs(12),
  },
  speciesDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  speciesDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  speciesDetailText: {
    fontSize: rf(11),
    color: '#666',
    marginLeft: rs(4),
  },
  speciesCost: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: rs(8),
    padding: rs(8),
    minWidth: rs(60),
  },
  costText: {
    fontSize: rf(14),
    fontWeight: 'bold',
    color: '#50AF27',
  },
  costSubtext: {
    fontSize: rf(10),
    color: '#666',
  },
  realTreeInfo: {
    marginVertical: rs(10),
  },
  realTreeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(16),
    paddingHorizontal: rs(16),
  },
  realTreeInfoText: {
    fontSize: rf(14),
    color: '#333',
    marginLeft: rs(12),
    flex: 1,
  },
  realTreeCostContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: rs(12),
    padding: rs(20),
    marginVertical: rs(10),
  },
  realTreeCost: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#50AF27',
  },
  realTreeCostLabel: {
    fontSize: rf(12),
    color: '#666',
    marginTop: rs(4),
  },
  redeemRealTreeButton: {
    backgroundColor: '#50AF27',
    borderRadius: rs(12),
    padding: rs(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(20),
  },
  redeemRealTreeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemRealTreeButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: 'bold',
    marginLeft: rs(8),
  },
  loadingContainer: {
    padding: rs(40),
    alignItems: 'center',
  },
  // Missing styles for tree species cards
  disabledText: {
    color: '#999',
    opacity: 0.6,
  },
});

// Types  
type RootStackParamList = {
  leaderboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  id: string;
  fullname: string;
  nickname: string;
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

// New unified redemption modal component
const RedemptionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  userPoints: number;
  onRedeemTree: (species: TreeSpecies) => void;
  onRedeemRealTree: () => void;
}> = ({ visible, onClose, userPoints, onRedeemTree, onRedeemRealTree }) => {
  const [selectedType, setSelectedType] = useState<'virtual' | 'real'>('virtual');
  const [treeSpecies, setTreeSpecies] = useState<TreeSpecies[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && selectedType === 'virtual') {
      loadTreeSpecies();
    }
  }, [visible, selectedType]);

  const loadTreeSpecies = async () => {
    try {
      setLoading(true);
      const species = await treeService.getTreeSpecies();
      setTreeSpecies(species);
    } catch (error) {
      console.error('Error loading tree species:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTree = (selectedSpecies: TreeSpecies) => {
    onRedeemTree(selectedSpecies);
    onClose();
  };

  const handleRedeemReal = () => {
    onRedeemRealTree();
    onClose();
  };

  const renderSpeciesCard = (treeSpecies: TreeSpecies) => (
    <TouchableOpacity
      key={treeSpecies.id}
      style={[
        styles.speciesCard,
        userPoints < treeSpecies.cost && styles.speciesCardDisabled
      ]}
      onPress={() => handleSelectTree(treeSpecies)}
      disabled={userPoints < treeSpecies.cost}
    >
      <View style={styles.speciesInfo}>
        <Text style={[styles.speciesName, userPoints < treeSpecies.cost && styles.disabledText]}>
          {treeSpecies.name}
        </Text>
        <Text style={[styles.speciesScientific, userPoints < treeSpecies.cost && styles.disabledText]}>
          {treeSpecies.scientificName}
        </Text>
        <Text style={[styles.speciesDescription, userPoints < treeSpecies.cost && styles.disabledText]}>
          {treeSpecies.description}
        </Text>
        
        <View style={styles.speciesDetails}>
          <View style={styles.speciesDetailItem}>
            <Icon name="ruler" size={12} color="#666" />
            <Text style={[styles.speciesDetailText, userPoints < treeSpecies.cost && styles.disabledText]}>
              {treeSpecies.maxHeight}
            </Text>
          </View>
          <View style={styles.speciesDetailItem}>
            <Icon name="heart" size={12} color="#666" />
            <Text style={[styles.speciesDetailText, userPoints < treeSpecies.cost && styles.disabledText]}>
              {treeSpecies.careLevel}
            </Text>
          </View>
          <View style={styles.speciesDetailItem}>
            <Icon name="clock" size={12} color="#666" />
            <Text style={[styles.speciesDetailText, userPoints < treeSpecies.cost && styles.disabledText]}>
              {treeSpecies.lifespan}
            </Text>
          </View>
        </View>
        
        <View style={styles.speciesCost}>
          <Text style={[styles.costText, userPoints < treeSpecies.cost && styles.disabledText]}>
            {treeSpecies.cost}
          </Text>
          <Text style={[styles.costSubtext, userPoints < treeSpecies.cost && styles.disabledText]}>
            points
          </Text>
          {userPoints < treeSpecies.cost && <Icon name="lock" size={16} color="#999" />}
        </View>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.modalTitle}>Redeem Points</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Pill Tabs */}
          <View style={styles.modalPillTabsContainer}>
            <View style={styles.modalPillTabs}>
              <TouchableOpacity
                style={[
                  styles.modalPillTab,
                  selectedType === 'virtual' && styles.modalPillTabActive
                ]}
                onPress={() => setSelectedType('virtual')}
              >
                <Text style={[
                  styles.modalPillTabText,
                  selectedType === 'virtual' && styles.modalPillTabTextActive
                ]}>
                  Virtual Tree
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalPillTab,
                  selectedType === 'real' && styles.modalPillTabActive
                ]}
                onPress={() => setSelectedType('real')}
              >
                <Text style={[
                  styles.modalPillTabText,
                  selectedType === 'real' && styles.modalPillTabTextActive
                ]}>
                  Real Tree
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedType === 'virtual' ? (
              <>
                <Text style={styles.modalDescription}>
                  Choose from virtual tree species that grow as you use WiFi!
                </Text>
                <Text style={styles.userPointsText}>
                  Your Points: {userPoints}
                </Text>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading tree species...</Text>
                  </View>
                ) : (
                  <View style={styles.speciesGrid}>
                    {treeSpecies.map(renderSpeciesCard)}
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.modalDescription}>
                  Contribute to real environmental impact with actual tree planting!
                </Text>
                <Text style={styles.userPointsText}>
                  Your Points: {userPoints}
                </Text>
                
                <View style={styles.realTreeInfo}>
                  <View style={styles.realTreeInfoItem}>
                    <Icon name="tree" size={24} color="#50AF27" />
                    <Text style={styles.realTreeInfoText}>Real environmental impact</Text>
                  </View>
                  <View style={styles.realTreeInfoItem}>
                    <Icon name="map-marker" size={24} color="#50AF27" />
                    <Text style={styles.realTreeInfoText}>Planted in designated locations</Text>
                  </View>
                  <View style={styles.realTreeInfoItem}>
                    <Icon name="certificate" size={24} color="#50AF27" />
                    <Text style={styles.realTreeInfoText}>Tracked by admin updates</Text>
                  </View>
                </View>

                <View style={styles.realTreeCostContainer}>
                  <Text style={styles.realTreeCost}>500 pts</Text>
                  <Text style={styles.realTreeCostLabel}>Fixed Cost</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.redeemRealTreeButton,
                    userPoints < 500 && styles.redeemRealTreeButtonDisabled
                  ]}
                  onPress={handleRedeemReal}
                  disabled={userPoints < 500}
                >
                  <Icon name="tree" size={20} color="#fff" />
                  <Text style={styles.redeemRealTreeButtonText}>
                    Redeem Real Tree
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const PointsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUser } = useAuth();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'points' });
  const { 
    isConnected, 
    isUniversityWifi, 
    isSessionActive, 
    stats, 
    sessionCount, 
    ipAddress 
  } = useWiFi();
  const [pointsState, setPointsState] = useState<PointsState>({ points: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSpeciesSelection, setShowSpeciesSelection] = useState(false);
  const [showRealTreeSelection, setShowRealTreeSelection] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '' });
  const [currentSession, setCurrentSession] = useState<WifiStats['currentSession']>(null);
  const insets = useSafeAreaInsets();

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
    const basePoints = pointsState.points;
    return basePoints + sessionPoints;
  };

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
          const duration = wifiService.calculateSessionDuration(new Date(session.startTime));
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
      
      // Emit to eventService so other screens can listen
      eventService.emit('points', { 
        points: state.points, 
        totalPoints: state.points 
      });
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
      console.log('Redeeming virtual tree:', species);
      
      const data: RedeemTreeData = { 
        speciesId: species.id,
        treeType: 'virtual'
      };
      const result = await treeService.redeemTree(data);
      
      console.log('Virtual tree redemption result:', result);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);

      // Update user data using API response
      if (user && result.user) {
        const updatedUser = {
          ...user,
          points: result.user.points,
          treesPlanted: result.user.treesPlanted,
          virtualTreesPlanted: result.user.virtualTreesPlanted,
          realTreesPlanted: result.user.realTreesPlanted,
        };
        await updateUser(updatedUser);
      }

      // Notify other screens about the new tree
      eventService.emit('treeRedeemed', { 
        speciesName: species.name,
        newTreeCount: result.user?.treesPlanted || (user?.treesPlanted || 0) + 1 
      });

      // Refresh points from service
      await pointsService.refreshPoints();
      setPointsState(pointsService.getState());

      setModalData({
        title: 'Virtual Tree Planted!',
        message: `Congratulations! Your ${species.name} (${species.scientificName}) has been planted successfully!`,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error redeeming virtual tree:', error);
      setModalData({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to plant tree. Please try again.',
      });
      setShowErrorModal(true);
    }
  };

  const handleRedeemRealTree = async () => {
    try {
      console.log('Redeeming real tree');
      
      const result = await treeService.redeemTree({ 
        treeType: 'real',
        treeSpecie: 'Tree Species', // Default values since admin will manage
        location: 'To be determined by admin'
      });
      
      console.log('Real tree redemption result:', result);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);

      // Update user data using API response
      if (user && result.user) {
        const updatedUser = {
          ...user,
          points: result.user.points,
          treesPlanted: result.user.treesPlanted,
          virtualTreesPlanted: result.user.virtualTreesPlanted,
          realTreesPlanted: result.user.realTreesPlanted,
        };
        await updateUser(updatedUser);
      }

      // Refresh points from service
      await pointsService.refreshPoints();
      setPointsState(pointsService.getState());

      setModalData({
        title: 'Real Tree Redeemed!',
        message: 'Congratulations! Your real tree will be planted and you\'ll receive updates about its progress!',
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error redeeming real tree:', error);
      setModalData({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to redeem real tree. Please try again.',
      });
      setShowErrorModal(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await initializeData();
      await pointsService.refreshPoints();
      const updatedState = pointsService.getState();
      setPointsState(updatedState);
      
      // Emit to eventService so other screens can listen
      eventService.emit('points', { 
        points: updatedState.points, 
        totalPoints: updatedState.points 
      });
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
          <Text style={styles.titleText}>Your Points</Text>
          <Text style={styles.subtitleText}>
            Earn points by connecting to university WiFi
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
            {/* Points Summary Card - Split Design */}
            <Animated.View style={[styles.pointsCard, animatedStyle]}>
              <View style={styles.splitContainer}>
                {/* Left Side - Total Points */}
                <View style={styles.pointsSection}>
                  <View style={styles.cardHeader}>
                    <Icon name="star" size={24} color="#50AF27" />
                    <Text style={styles.cardTitle}>Total Points</Text>
                  </View>
                  <Text style={styles.pointsValue}>
                    {isSessionActive ? getLiveTotalPoints() : pointsState.points}
                  </Text>
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

            {/* Redeem Card */}
            <View style={styles.redeemCard}>
              <View style={styles.cardHeader}>
                <Icon name="star" size={28} color="#50AF27" />
                <Text style={styles.cardTitle}>Redeem Points</Text>
              </View>
              
              <Text style={styles.redeemText}>
                Choose from virtual tree species that grow as you use WiFi!
              </Text>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeem}
              >
                <Icon name="gift" size={20} color="#fff" />
                <Text style={styles.redeemButtonText}>
                  Redeem Point
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

      {/* Tree Redemption Modal - Only render when needed */}
      {showSpeciesSelection && (
        <RedemptionModal
          visible={showSpeciesSelection}
          onClose={() => setShowSpeciesSelection(false)}
          userPoints={isSessionActive ? getLiveTotalPoints() : pointsState.points}
          onRedeemTree={handleRedeemTree}
          onRedeemRealTree={handleRedeemRealTree}
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


      </View>
    </GestureDetector>
  );
};

export default PointsScreen; 