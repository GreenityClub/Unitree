import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { useTabBarContext } from '../../context/TabBarContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { treeService, Tree, RealTree } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import type { WiFiSession } from '../../services/wifiService';
import { 
  rf, 
  rs, 
  isSmallHeightDevice,
  isTablet,
  isTabletLarge,
  getLayoutConfig,
  getContainerPadding,
  getMaxContentWidth,
  getGridColumns
} from '../../utils/responsive';
import { ResponsiveGrid } from '../../components';
import { router } from 'expo-router';

// Tree stage images from assets
const getStageImage = (stage: string): any => {
  const stageImages: { [key: string]: any } = {
    'seedling': require('../../assets/trees/stage01.png'),
    'sprout': require('../../assets/trees/stage02.png'),
    'sapling': require('../../assets/trees/stage03.png'),
    'young_tree': require('../../assets/trees/stage04.png'),
    'mature_tree': require('../../assets/trees/stage05.png'),
    'ancient_tree': require('../../assets/trees/stage06.png')
  };
  return stageImages[stage] || stageImages['seedling'];
};

interface TreeCardProps {
  tree: Tree;
  onPress: () => void;
}

const TreeCard: React.FC<TreeCardProps> = ({ tree, onPress }) => {
  const { species, stage, healthScore, totalWifiTime, name, isDead, healthStatus, growthProgress } = tree;

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FF5722';
    return '#f44336';
  };

  const getHealthStatusText = () => {
    if (isDead) return 'Dead';
    if (!healthStatus) return 'Unknown';
    return healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1);
  };

  const getGrowthStatusText = () => {
    if (!growthProgress) return 'Unknown';
    if (growthProgress.isMaxStage) return 'Fully Grown';
    return `${growthProgress.progressPercent.toFixed(0)}% to ${treeService.getTreeStatusText(growthProgress.nextStage || stage)}`;
  };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.treeCard, isDead && styles.deadTreeCard]}>
      <View style={styles.treeHeader}>
        <View style={[styles.treeImageContainer, isDead && styles.deadTreeImageContainer]}>
          <Image 
            source={getStageImage(stage)} 
            style={[styles.treeImage, isDead && styles.deadTreeImage]} 
            resizeMode="contain"
          />
          {isDead && (
            <View style={styles.deadOverlay}>
              <Icon name="skull" size={20} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.treeInfo}>
          <Text style={styles.treeName}>{name || `My ${species}`}</Text>
          <Text style={[styles.treeStage, { color: treeService.getStageColor(stage) }]}>
            {treeService.getTreeStatusText(stage)}
          </Text>
          <Text style={styles.wifiHours}>
            {treeService.formatWifiTime(totalWifiTime)} WiFi collected
          </Text>
        </View>
      </View>

      {/* Growth Progress Bar */}
      <View style={styles.metricSection}>
        <View style={styles.metricHeader}>
          <Icon name="trending-up" size={16} color={growthProgress?.isMaxStage ? '#FFD700' : '#4CAF50'} />
          <Text style={styles.metricLabel}>Growth</Text>
          <Text style={styles.metricStatus}>{getGrowthStatusText()}</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: growthProgress?.isMaxStage ? '#FFD700' : '#4CAF50',
                width: `${growthProgress?.progressPercent || 0}%` 
              }
            ]} 
          />
        </View>
        {!growthProgress?.isMaxStage && growthProgress?.hoursToNextStage && (
          <Text style={styles.progressSubtext}>
            {growthProgress.hoursToNextStage} more hour{growthProgress.hoursToNextStage !== 1 ? 's' : ''} needed
          </Text>
        )}
      </View>

      {/* Health Progress Bar */}
      <View style={styles.metricSection}>
        <View style={styles.metricHeader}>
          <Icon 
            name={isDead ? 'skull' : 'heart'} 
            size={16} 
            color={isDead ? '#666' : getHealthColor(healthScore)} 
          />
          <Text style={styles.metricLabel}>Health</Text>
          <Text style={[styles.metricStatus, { color: isDead ? '#666' : getHealthColor(healthScore) }]}>
            {healthScore}% - {getHealthStatusText()}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: isDead ? '#666' : getHealthColor(healthScore),
                width: `${healthScore}%` 
              }
            ]} 
          />
        </View>
        {healthStatus && !isDead && healthStatus.canWater && (
          <Text style={styles.needsWaterText}>
            💧 Needs watering
          </Text>
        )}
        {healthStatus && !isDead && healthStatus.status === 'critical' && (
          <Text style={styles.criticalText}>
            ⚠️ Critical - {healthStatus.daysUntilDeath.toFixed(1)} days left!
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface RealTreeCardProps {
  realTree: RealTree;
}

const RealTreeCard: React.FC<RealTreeCardProps> = ({ realTree }) => {
  const { treeSpecie, stage, location, plantedDate, pointsCost, studentId, notes } = realTree;

  const getStageIcon = () => {
    return treeService.getRealTreeIcon(stage);
  };

  const getStageColor = () => {
    return treeService.getRealTreeStageColor(stage);
  };

  const getStageText = () => {
    return treeService.getRealTreeStageText(stage);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <View style={[styles.realTreeCard, stage === 'dead' && styles.deadRealTreeCard]}>
      <View style={styles.realTreeHeader}>
        <View style={styles.realTreeIconContainer}>
          <Text style={styles.realTreeIcon}>{getStageIcon()}</Text>
        </View>
        <View style={styles.realTreeInfo}>
          <Text style={styles.realTreeSpecie}>{treeSpecie}</Text>
          <Text style={[styles.realTreeStage, { color: getStageColor() }]}>
            {getStageText()}
          </Text>
        </View>
        <View style={styles.realTreeBadge}>
          <Text style={styles.realTreeBadgeText}>REAL</Text>
        </View>
      </View>

      <View style={styles.realTreeDetails}>
        <View style={styles.realTreeDetailRow}>
          <Icon name="map-marker" size={16} color="#666" />
          <Text style={styles.realTreeDetailLabel}>Location:</Text>
          <Text style={styles.realTreeDetailValue}>{location}</Text>
        </View>
        
        <View style={styles.realTreeDetailRow}>
          <Icon name="calendar" size={16} color="#666" />
          <Text style={styles.realTreeDetailLabel}>Planted:</Text>
          <Text style={styles.realTreeDetailValue}>{formatDate(plantedDate)}</Text>
        </View>
        
        <View style={styles.realTreeDetailRow}>
          <Icon name="account" size={16} color="#666" />
          <Text style={styles.realTreeDetailLabel}>Student ID:</Text>
          <Text style={styles.realTreeDetailValue}>{studentId}</Text>
        </View>
        
        <View style={styles.realTreeDetailRow}>
          <Icon name="star" size={16} color="#666" />
          <Text style={styles.realTreeDetailLabel}>Cost:</Text>
          <Text style={styles.realTreeDetailValue}>{pointsCost} points</Text>
        </View>

        {notes && (
          <View style={styles.realTreeNotesContainer}>
            <Icon name="note-text" size={16} color="#666" />
            <Text style={styles.realTreeNotesLabel}>Admin Notes:</Text>
            <Text style={styles.realTreeNotes}>{notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const TreesScreen = () => {
  const { user } = useAuth();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'trees' });
  const [trees, setTrees] = useState<Tree[]>([]);
  const [realTrees, setRealTrees] = useState<RealTree[]>([]);
  const [selectedTreeType, setSelectedTreeType] = useState<'virtual' | 'real'>('virtual');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const layoutConfig = getLayoutConfig();

  useEffect(() => {
    loadAllTrees();
  }, []);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('TreesScreen - Real-time refresh...');
      loadAllTrees();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for tree redemption events
  useEffect(() => {
    if (!user) return;

    const treeSubscription = eventService.addListener('treeRedeemed', (data: { speciesName: string; newTreeCount: number }) => {
      console.log('TreesScreen - Tree redeemed:', data);
      loadAllTrees(); // Refresh trees list
    });

    return () => {
      eventService.removeAllListeners('treeRedeemed');
    };
  }, [user?.id]);

  const loadAllTrees = async () => {
    try {
      setLoading(true);
      
      // Load virtual trees (required)
      const virtualTrees = await treeService.getTrees();
      setTrees(virtualTrees);
      
      // Load real trees (optional - fail silently)
      try {
        const realTreesData = await treeService.getRealTrees();
        setRealTrees(realTreesData);
      } catch (realTreeError) {
        // Silently handle real tree loading failures
        // This is expected when the real trees collection doesn't exist yet
        setRealTrees([]);
      }
    } catch (error) {
      console.error('Error loading virtual trees:', error);
      Alert.alert('Error', 'Failed to load your virtual trees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllTrees();
    setRefreshing(false);
  };

  // Calculate summary statistics
  const aliveTrees = trees.filter(tree => !tree.isDead);
  const deadTrees = trees.filter(tree => tree.isDead);
  const aliveRealTrees = realTrees.filter(tree => tree.stage !== 'dead');
  const deadRealTrees = realTrees.filter(tree => tree.stage === 'dead');

  const handleTreeTypeChange = (type: 'virtual' | 'real') => {
    setSelectedTreeType(type);
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
            alignSelf: 'center',
            paddingHorizontal: 0,
            alignItems: 'flex-start',
          }
        ]}>
          <Text style={[styles.titleText, { textAlign: 'left' }]}>
            Your Forest
          </Text>
          <Text style={[styles.subtitleText, { textAlign: 'left' }]}>
            Watch your forest grow with each WiFi connection
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
        {/* Fixed Forest Summary Card - Non-scrollable */}
        <View style={[
          styles.fixedSummaryContainer,
          {
            width: '100%',
            alignSelf: 'center',
            paddingHorizontal: 0,
          }
        ]}>
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <Icon name="forest" size={rf(24, 28, 32)} color="#50AF27" />
              <Text style={styles.cardTitle}>Forest Summary</Text>
            </View>
            
            {/* Combined Statistics - Always show all 3 fields */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="tree" size={rf(20, 24, 28)} color="#50AF27" />
                <Text style={styles.statValue}>{aliveTrees.length}</Text>
                <Text style={styles.statLabel}>Virtual Trees</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="pine-tree" size={rf(20, 24, 28)} color="#50AF27" />
                <Text style={styles.statValue}>{aliveRealTrees.length}</Text>
                <Text style={styles.statLabel}>Real Trees</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="earth" size={rf(20, 24, 28)} color="#50AF27" />
                <Text style={styles.statValue}>
                  {(aliveRealTrees.length * 22).toFixed(0)}
                </Text>
                <Text style={styles.statLabel}>kg CO₂/year</Text>
              </View>
            </View>
            
            {/* Warning messages for dead trees */}
            {(deadTrees.length > 0 || deadRealTrees.length > 0) && (
              <View style={styles.deadTreesWarning}>
                <Icon name="skull" size={rf(16, 18, 20)} color="#f44336" />
                <Text style={styles.deadTreesText}>
                  {deadTrees.length > 0 && `${deadTrees.length} virtual tree${deadTrees.length !== 1 ? 's' : ''} died`}
                  {deadTrees.length > 0 && deadRealTrees.length > 0 && ', '}
                  {deadRealTrees.length > 0 && `${deadRealTrees.length} real tree${deadRealTrees.length !== 1 ? 's' : ''} died`}
                </Text>
              </View>
            )}
          </View>

          {/* Fixed Pill Tabs - Non-scrollable */}
          <View style={styles.fixedTabsContainer}>
            <View style={styles.pillTabs}>
              <TouchableOpacity
                style={[
                  styles.pillTab,
                  selectedTreeType === 'virtual' && styles.pillTabActive
                ]}
                onPress={() => handleTreeTypeChange('virtual')}
              >
                <Text style={[
                  styles.pillTabText,
                  selectedTreeType === 'virtual' && styles.pillTabTextActive
                ]}>
                  Virtual Trees
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pillTab,
                  selectedTreeType === 'real' && styles.pillTabActive
                ]}
                onPress={() => handleTreeTypeChange('real')}
              >
                <Text style={[
                  styles.pillTabText,
                  selectedTreeType === 'real' && styles.pillTabTextActive
                ]}>
                  Real Trees
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scrollable Tree Cards Only */}
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
            {/* Tree List */}
            {loading ? (
              <Text style={styles.loadingText}>Loading your forest...</Text>
            ) : selectedTreeType === 'virtual' ? (
              // Virtual Trees List
              trees.length > 0 ? (
                layoutConfig.isTablet ? (
                  <ResponsiveGrid 
                    baseColumns={1}
                    gap={16}
                  >
                    {trees.map((tree) => (
                      <TreeCard
                        key={tree._id}
                        tree={tree}
                        onPress={() => router.push({ pathname: '/tree-detail', params: { treeId: tree._id } })}
                      />
                    ))}
                  </ResponsiveGrid>
                ) : (
                  trees.map((tree) => (
                    <TreeCard
                      key={tree._id}
                      tree={tree}
                      onPress={() => router.push({ pathname: '/tree-detail', params: { treeId: tree._id } })}
                    />
                  ))
                )
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="tree" size={rf(64, 72, 80)} color="#98D56D" />
                  <Text style={styles.emptyStateText}>
                    You haven't planted any virtual trees yet. Start by redeeming your points for a new tree!
                  </Text>
                </View>
              )
            ) : (
              // Real Trees List
              realTrees.length > 0 ? (
                layoutConfig.isTablet ? (
                  <ResponsiveGrid 
                    baseColumns={1}
                    gap={16}
                  >
                    {realTrees.map((realTree) => (
                      <RealTreeCard
                        key={realTree._id}
                        realTree={realTree}
                      />
                    ))}
                  </ResponsiveGrid>
                ) : (
                  realTrees.map((realTree) => (
                    <RealTreeCard
                      key={realTree._id}
                      realTree={realTree}
                    />
                  ))
                )
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="pine-tree" size={rf(64, 72, 80)} color="#98D56D" />
                  <Text style={styles.emptyStateText}>
                    You haven't planted any real trees yet. Redeem points for a real tree to make an actual environmental impact!
                  </Text>
                </View>
              )
            )}
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
    paddingBottom: isSmallHeightDevice() ? rs(60, 75, 90) : rs(90, 110, 130),
    paddingTop: rs(10, 15, 20),
  },
  welcomeSection: {
    marginTop: rs(10, 15, 20),
  },
  titleText: {
    fontSize: rf(32, 40, 48),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(10, 12, 16),
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
    borderTopLeftRadius: rs(30, 40, 50),
    borderTopRightRadius: rs(30, 40, 50),
    paddingTop: rs(60, 75, 90),
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
    marginTop: rs(20, 25, 30),
    borderRadius: rs(16, 20, 24),
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {},
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: rs(12, 16, 20),
    padding: rs(12, 16, 20),
    marginBottom: rs(12, 16, 20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8, 10, 12),
  },
  cardTitle: {
    fontSize: rf(16, 18, 20),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8, 10, 12),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: rf(20, 24, 28),
    fontWeight: 'bold',
    color: '#50AF27',
    marginTop: rs(4, 6, 8),
    marginBottom: rs(2, 3, 4),
  },
  statLabel: {
    fontSize: rf(11, 13, 15),
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: rs(12),
  },
  loadingText: {
    textAlign: 'center',
    marginTop: rs(20),
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(20),
    marginTop: rs(20),
  },
  emptyStateText: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    marginTop: rs(12),
    maxWidth: '80%',
  },
  // Updated TreeCard styles
  treeCard: {
    backgroundColor: '#fff',
    borderRadius: rs(12, 16, 20),
    padding: rs(12, 16, 20),
    marginBottom: rs(10, 12, 16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8, 10, 12),
  },
  treeImageContainer: {
    width: rs(40, 50, 60),
    height: rs(40, 50, 60),
    borderRadius: rs(6, 8, 10),
    overflow: 'hidden',
  },
  treeImage: {
    width: '100%',
    height: '100%',
  },
  treeInfo: {
    flex: 1,
    marginLeft: rs(10, 12, 16),
  },
  treeName: {
    fontSize: rf(16, 18, 20),
    fontWeight: 'bold',
    color: '#333',
  },
  treeStage: {
    fontSize: rf(12, 14, 16),
    color: '#666',
    marginTop: rs(1, 2, 3),
  },
  wifiHours: {
    fontSize: rf(12, 14, 16),
    color: '#666',
    marginBottom: rs(10, 12, 16),
  },
  metricSection: {
    marginBottom: rs(8),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(6),
  },
  metricLabel: {
    fontSize: rf(12),
    color: '#333',
    marginLeft: rs(6),
    flex: 1,
  },
  metricStatus: {
    fontSize: rf(12),
    color: '#4CAF50',
    textAlign: 'right',
  },
  progressBar: {
    height: rs(6),
    backgroundColor: '#E0E0E0',
    borderRadius: rs(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: rs(3),
  },
  deadTreeCard: {
    backgroundColor: '#f44336',
  },
  deadTreeImageContainer: {
    borderWidth: 2,
    borderColor: '#666',
  },
  deadTreeImage: {
    width: '100%',
    height: '100%',
  },
  deadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSubtext: {
    fontSize: rf(12),
    color: '#666',
    textAlign: 'center',
    marginTop: rs(4),
  },
  needsWaterText: {
    fontSize: rf(12),
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: rs(4),
  },
  criticalText: {
    fontSize: rf(12),
    color: '#f44336',
    textAlign: 'center',
    marginTop: rs(4),
  },
  deadTreesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(8),
  },
  deadTreesText: {
    fontSize: rf(12),
    color: '#f44336',
    marginLeft: rs(6),
  },
  realTreeCard: {
    backgroundColor: '#fff',
    borderRadius: rs(12),
    padding: rs(12),
    marginBottom: rs(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  realTreeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  realTreeIconContainer: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(6),
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(10),
  },
  realTreeIcon: {
    fontSize: rf(28),
    textAlign: 'center',
  },
  realTreeInfo: {
    flex: 1,
  },
  realTreeSpecie: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
  },
  realTreeStage: {
    fontSize: rf(12),
    color: '#666',
    marginTop: rs(1),
  },
  realTreeBadge: {
    backgroundColor: '#50AF27',
    borderRadius: rs(12),
    padding: rs(3),
    marginLeft: rs(8),
  },
  realTreeBadgeText: {
    fontSize: rf(10),
    fontWeight: 'bold',
    color: '#fff',
  },
  realTreeDetails: {
    marginTop: rs(8),
  },
  realTreeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(6),
  },
  realTreeDetailLabel: {
    fontSize: rf(12),
    color: '#666',
    marginLeft: rs(6),
    marginRight: rs(3),
    fontWeight: '500',
  },
  realTreeDetailValue: {
    fontSize: rf(12),
    color: '#333',
    fontWeight: '600',
  },
  realTreeNotesContainer: {
    marginTop: rs(8),
    padding: rs(8),
    backgroundColor: '#F0F9FF',
    borderRadius: rs(6),
    borderLeftWidth: 2,
    borderLeftColor: '#50AF27',
  },
  realTreeNotesLabel: {
    fontSize: rf(12),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(3),
    flexDirection: 'row',
    alignItems: 'center',
  },
  realTreeNotes: {
    fontSize: rf(12),
    color: '#666',
    lineHeight: rf(16),
  },
  deadRealTreeCard: {
    backgroundColor: '#f44336',
  },
  summarySection: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(15),
    backgroundColor: '#FFCED2',
  },
  tabsContainer: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(15),
    backgroundColor: '#FFCED2',
  },
  fixedSummaryContainer: {
    paddingHorizontal: rs(20),
    paddingTop: rs(15),
  },
  fixedTabsContainer: {
    paddingHorizontal: rs(5),
    paddingVertical: rs(-5),
  },
  pillTabsContainer: {
    marginBottom: rs(20),
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
});

export default TreesScreen; 