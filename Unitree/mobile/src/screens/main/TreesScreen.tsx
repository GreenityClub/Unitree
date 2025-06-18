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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWiFi } from '../../context/WiFiContext';
import { useTabBarContext } from '../../context/TabBarContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { treeService, Tree } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import type { WiFiSession } from '../../services/wifiService';
import { rf, rs } from '../../utils/responsive';
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

const TreesScreen = () => {
  const { user } = useAuth();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'trees' });
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTrees();
  }, []);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('TreesScreen - Real-time refresh...');
      loadTrees();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for tree redemption events
  useEffect(() => {
    if (!user) return;

    const treeSubscription = eventService.addListener('treeRedeemed', (data: { speciesName: string; newTreeCount: number }) => {
      console.log('TreesScreen - Tree redeemed:', data);
      loadTrees(); // Refresh trees list
    });

    return () => {
      eventService.removeAllListeners('treeRedeemed');
    };
  }, [user?.id]);

  const loadTrees = async () => {
    try {
      setLoading(true);
      const userTrees = await treeService.getTrees();
      console.log('TreesScreen - Loaded trees:', userTrees);
      setTrees(userTrees);
    } catch (error) {
      console.error('Error loading trees:', error);
      Alert.alert('Error', 'Failed to load your trees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  // Calculate summary statistics
  const totalWifiHours = trees.reduce((acc, tree) => acc + (tree.totalWifiTime / 3600), 0);
  const aliveTrees = trees.filter(tree => !tree.isDead);
  const deadTrees = trees.filter(tree => tree.isDead);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E8F2CD" />

        {/* Fixed Header Section */}
        <Animated.View 
          style={[styles.headerSection, { paddingTop: insets.top }, headerAnimatedStyle]}
          onTouchStart={handleTouchStart}
        >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.titleText}>Your Forest</Text>
          <Text style={styles.subtitleText}>
            Watch your forest grow with each WiFi connection
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
            {/* Tree Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Icon name="forest" size={24} color="#50AF27" />
                <Text style={styles.cardTitle}>Forest Summary</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="tree" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>{aliveTrees.length}</Text>
                  <Text style={styles.statLabel}>Living Trees</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="clock-outline" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>
                    {Math.floor(totalWifiHours)}h
                  </Text>
                  <Text style={styles.statLabel}>WiFi Hours</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="cloud-outline" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>
                    {(aliveTrees.length * 48).toFixed(0)}
                  </Text>
                  <Text style={styles.statLabel}>kg CO₂/year</Text>
                </View>
              </View>
              {deadTrees.length > 0 && (
                <View style={styles.deadTreesWarning}>
                  <Icon name="skull" size={16} color="#f44336" />
                  <Text style={styles.deadTreesText}>
                    {deadTrees.length} tree{deadTrees.length !== 1 ? 's' : ''} died from lack of care
                  </Text>
                </View>
              )}
            </View>

            {/* Tree List */}
            {loading ? (
              <Text style={styles.loadingText}>Loading your forest...</Text>
            ) : trees.length > 0 ? (
              trees.map((tree) => (
                <TreeCard
                  key={tree._id}
                  tree={tree}
                  onPress={() => router.push({ pathname: '/tree-detail', params: { treeId: tree._id } })}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="tree" size={64} color="#98D56D" />
                <Text style={styles.emptyStateText}>
                  You haven't planted any trees yet. Start by redeeming your points for a new tree!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../assets/mascots/Unitree - Mascot-4.png')}
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
    backgroundColor: '#FFCED2',
  },
  headerSection: {
    backgroundColor: '#FFCED2',
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
  summaryCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(16),
  },
  cardTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
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
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#50AF27',
    marginTop: rs(8),
    marginBottom: rs(4),
  },
  statLabel: {
    fontSize: rf(12),
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: rs(16),
  },
  loadingText: {
    textAlign: 'center',
    marginTop: rs(20),
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(32),
    marginTop: rs(32),
  },
  emptyStateText: {
    fontSize: rf(16),
    color: '#666',
    textAlign: 'center',
    marginTop: rs(16),
    maxWidth: '80%',
  },
  // Updated TreeCard styles
  treeCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(16),
    marginBottom: rs(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
  },
  treeImageContainer: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(8),
    overflow: 'hidden',
  },
  treeImage: {
    width: '100%',
    height: '100%',
  },
  treeInfo: {
    flex: 1,
    marginLeft: rs(12),
  },
  treeName: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#333',
  },
  treeStage: {
    fontSize: rf(14),
    color: '#666',
    marginTop: rs(2),
  },
  wifiHours: {
    fontSize: rf(14),
    color: '#666',
    marginBottom: rs(16),
  },
  metricSection: {
    marginBottom: rs(12),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  metricLabel: {
    fontSize: rf(14),
    color: '#333',
    marginLeft: rs(8),
    flex: 1,
  },
  metricStatus: {
    fontSize: rf(14),
    color: '#4CAF50',
    textAlign: 'right',
  },
  progressBar: {
    height: rs(8),
    backgroundColor: '#E0E0E0',
    borderRadius: rs(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: rs(4),
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
    marginTop: rs(12),
  },
  deadTreesText: {
    fontSize: rf(14),
    color: '#f44336',
    marginLeft: rs(8),
  },
});

export default TreesScreen; 