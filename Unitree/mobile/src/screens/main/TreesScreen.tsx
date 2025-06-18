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
import { treeService } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import type { WiFiSession } from '../../services/wifiService';
import { rf, rs } from '../../utils/responsive';
import { router } from 'expo-router';
import type { Tree as BaseTree } from '../../services/treeService';

// Define a UI-specific tree type instead of extending BaseTree
interface Tree {
  _id: string;
  userId: string;
  name?: string;
  plantedDate: Date;
  stage: 'sapling' | 'young' | 'mature';
  healthScore: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastWatered: Date;
  currentStage: number;
  wifiHoursAccumulated: number;
  species: {
    name: string;
    hoursToNextStage: number;
  };
}

// Define the session info type
interface SessionInfo {
  startTime: Date;
  durationMinutes: number;
}



// Tree stage images from assets
const getStageImage = (stage: number): any => {
  const stageImages: { [key: number]: any } = {
    0: require('../../assets/trees/stage01.png'),
    1: require('../../assets/trees/stage02.png'),
    2: require('../../assets/trees/stage03.png'),
    3: require('../../assets/trees/stage04.png'),
    4: require('../../assets/trees/stage05.png'),
    5: require('../../assets/trees/stage06.png')
  };
  return stageImages[stage] || stageImages[0];
};

interface TreeCardProps {
  tree: Tree;
  onPress: () => void;
  currentSessionHours: number;
}

const TreeCard: React.FC<TreeCardProps> = ({ tree, onPress, currentSessionHours = 0 }) => {
  const { species, currentStage, healthScore, wifiHoursAccumulated, name } = tree;

  return (
    <TouchableOpacity onPress={onPress} style={styles.treeCard}>
      <View style={styles.treeHeader}>
        <Image 
          source={getStageImage(currentStage)} 
          style={styles.treeImage} 
          resizeMode="contain"
        />
        <View style={styles.treeInfo}>
          <Text style={styles.treeName}>{name || `My ${species.name}`}</Text>
          <Text style={styles.treeStage}>Ancient Tree</Text>
        </View>
      </View>

      <Text style={styles.wifiHours}>
        {wifiHoursAccumulated.toFixed(1)}h WiFi collected {currentSessionHours > 0 && `(+${currentSessionHours.toFixed(1)}h live)`}
      </Text>

      {/* Growth Progress Bar */}
      <View style={styles.metricSection}>
        <View style={styles.metricHeader}>
          <Icon name="trending-up" size={16} color="#4CAF50" />
          <Text style={styles.metricLabel}>Growth</Text>
          <Text style={styles.metricStatus}>Fully Grown</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: '#FFD700', width: '100%' }]} />
        </View>
      </View>

      {/* Health Progress Bar */}
      <View style={styles.metricSection}>
        <View style={styles.metricHeader}>
          <Icon name="heart" size={16} color="#4CAF50" />
          <Text style={styles.metricLabel}>Health</Text>
          <Text style={styles.metricStatus}>100% - Excellent</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TreesScreen = () => {
  const { user } = useAuth();
  const { currentSession } = useWiFi();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const calculateSessionDuration = (session: WiFiSession | null): number => {
    if (!session || !session.startTime) return 0;
    const start = new Date(session.startTime);
    const now = new Date();
    const durationInMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
    return durationInMinutes / 60; // Convert to hours
  };

  useEffect(() => {
    loadTrees();
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
      // Transform the base trees into our UI-specific tree format
      const transformedTrees: Tree[] = userTrees.map(tree => ({
        ...tree,
        name: tree.name, // Preserve the tree name
        currentStage: 1, // Default to stage 1
        wifiHoursAccumulated: 0, // Default to 0 hours
        species: {
          name: tree.species || 'Unknown Tree',
          hoursToNextStage: 24, // Default to 24 hours
        }
      }));
      setTrees(transformedTrees);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E8F2CD" />

      {/* Fixed Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={[styles.headerSection, { paddingTop: insets.top }]}
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
            {/* Tree Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Icon name="forest" size={24} color="#50AF27" />
                <Text style={styles.cardTitle}>Forest Summary</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="tree" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>{trees.length}</Text>
                  <Text style={styles.statLabel}>Trees Planted</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="clock-outline" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>
                    {trees.reduce((acc, tree) => acc + tree.wifiHoursAccumulated, 0)}
                  </Text>
                  <Text style={styles.statLabel}>WiFi Hours</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="cloud-outline" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>
                    {trees.length * 48}
                  </Text>
                  <Text style={styles.statLabel}>kg CO₂/year</Text>
                </View>
              </View>
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
                  currentSessionHours={calculateSessionDuration(currentSession)}
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
  treeImage: {
    width: rs(48),
    height: rs(48),
    marginRight: rs(12),
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
});

export default TreesScreen; 