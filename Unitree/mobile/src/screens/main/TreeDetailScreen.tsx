import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { wifiService, WiFiSession } from '../../services/wifiService';
import { treeService, Tree } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Navigation types


// Tree stage images from assets
const getStageImage = (stage: number) => {
  const stageImages = {
    0: require('../../assets/trees/stage01.png'),
    1: require('../../assets/trees/stage02.png'),
    2: require('../../assets/trees/stage03.png'),
    3: require('../../assets/trees/stage04.png'),
    4: require('../../assets/trees/stage05.png'),
    5: require('../../assets/trees/stage06.png')
  };
  return stageImages[stage as keyof typeof stageImages] || stageImages[0];
};

// Extended tree interface for UI
interface TreeDetails extends Tree {
  currentStage: number;
  wifiHoursAccumulated: number;
  daysSincePlanted: number;
  daysSinceLastWatered: number;
}

const TreeDetailScreen: React.FC = () => {
  const { user } = useAuth();
  const { treeId } = useLocalSearchParams<{ treeId: string }>();
  
  const [treeDetails, setTreeDetails] = useState<TreeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSessionHours, setCurrentSessionHours] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadTreeDetails();
  }, [treeId]);

  // Real-time WiFi session tracking
  useEffect(() => {
    // Get initial session info
    const updateSessionHours = async () => {
      try {
        const session = await wifiService.getActiveSession();
        if (session) {
          const sessionHours = wifiService.calculateSessionDuration(session.startTime) / 3600; // Convert to hours
          setCurrentSessionHours(sessionHours);
          setSessionStartTime(new Date(session.startTime));
        } else {
          setCurrentSessionHours(0);
          setSessionStartTime(null);
        }
      } catch (error) {
        console.error('Error getting session info:', error);
      }
    };

    // Update immediately
    updateSessionHours();

    // Listen for WiFi session changes
    const unsubscribe = eventService.addListener('wifi', async () => {
      await updateSessionHours();
    });

    // Set up interval to update session hours every 5 seconds
    const sessionInterval = setInterval(updateSessionHours, 5000);
    
    // Set up interval to refresh tree details every 10 seconds for real-time updates
    const treeRefreshInterval = setInterval(() => {
      console.log('Real-time tree detail refresh...');
      loadTreeDetails();
    }, 10000);

    return () => {
      unsubscribe.remove();
      clearInterval(sessionInterval);
      clearInterval(treeRefreshInterval);
    };
  }, []);

  const loadTreeDetails = async () => {
    try {
      // First try to fetch fresh data from server
      if (user && treeId) {
        console.log('Fetching fresh tree data from server...');
        const freshTreeData = await treeService.getTree(treeId);
        console.log('Fresh tree data:', freshTreeData);
        
        // Transform the data to include UI-specific fields
        const transformedTree: TreeDetails = {
          ...freshTreeData,
          currentStage: calculateCurrentStage(freshTreeData),
          wifiHoursAccumulated: calculateWifiHours(freshTreeData),
          daysSincePlanted: treeService.getDaysGrowing(freshTreeData.plantedDate),
          daysSinceLastWatered: calculateDaysSinceLastWatered(freshTreeData.lastWatered),
        };
        
        setTreeDetails(transformedTree);
        return;
      }
      
      // Fallback data if needed
      console.warn('No user or treeId available');
    } catch (error) {
      console.error('Error loading tree details:', error);
      // Provide safe fallback data
      setTreeDetails({
        _id: treeId,
        userId: user?.id || '',
        species: 'Unknown Tree',
        plantedDate: new Date(),
        stage: 'sapling',
        healthScore: 100,
        lastWatered: new Date(),
        currentStage: 0,
        wifiHoursAccumulated: 0,
        daysSincePlanted: 0,
        daysSinceLastWatered: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStage = (tree: Tree): number => {
    // This would be implemented based on your business logic
    // For now, return a stage based on days since planted
    const days = treeService.getDaysGrowing(tree.plantedDate);
    if (days < 7) return 0;
    if (days < 30) return 1;
    if (days < 90) return 2;
    if (days < 180) return 3;
    if (days < 365) return 4;
    return 5;
  };

  const calculateWifiHours = (tree: Tree): number => {
    // This would be calculated based on WiFi session history
    // For now, return a placeholder value
    return Math.floor(treeService.getDaysGrowing(tree.plantedDate) / 7) * 10;
  };

  const calculateDaysSinceLastWatered = (lastWatered: Date): number => {
    const now = new Date();
    const watered = new Date(lastWatered);
    const diffTime = Math.abs(now.getTime() - watered.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStageName = (stage: number): string => {
    const stageNames = {
      0: 'Seed',
      1: 'Sprout', 
      2: 'Seedling',
      3: 'Young Tree',
      4: 'Mature Tree',
      5: 'Ancient Tree'
    };
    return stageNames[stage as keyof typeof stageNames] || 'Unknown';
  };

  const getProgressToNextStage = () => {
    const maxStage = 5;
    const wifiHoursAccumulated = treeDetails?.wifiHoursAccumulated || 0;
    
    // Only add session hours if the tree was planted before the session started
    let applicableSessionHours = 0;
    if (currentSessionHours > 0 && sessionStartTime && treeDetails?.plantedDate) {
      const treePlantedDate = new Date(treeDetails.plantedDate);
      if (treePlantedDate <= sessionStartTime) {
        applicableSessionHours = currentSessionHours;
      }
    }
    
    // Add applicable session hours to accumulated hours for real-time calculation
    const totalHours = wifiHoursAccumulated + applicableSessionHours;
    const realTimeStage = Math.min(maxStage, Math.floor(totalHours));
    
    if (realTimeStage >= maxStage && totalHours >= maxStage) {
      return {
        progress: 100,
        hoursNeeded: 0,
        isMaxStage: true,
        nextStageName: 'Fully Grown',
        currentDisplayHours: totalHours,
        nextStageHours: maxStage,
        applicableSessionHours
      };
    }
    
    // Each stage requires 1 hour, so next stage is at (currentStage + 1) hours
    const hoursForNextStage = realTimeStage + 1;
    const hoursInCurrentStage = totalHours - realTimeStage;
    const hoursNeededForNextStage = hoursForNextStage - totalHours;
    
    // Progress within current stage (0-100%)
    const progress = Math.min(100, (hoursInCurrentStage / 1) * 100);
    
    return {
      progress: Math.max(0, progress),
      hoursNeeded: Math.max(0, hoursNeededForNextStage),
      isMaxStage: false,
      nextStageName: getStageName(realTimeStage + 1),
      currentDisplayHours: totalHours,
      nextStageHours: hoursForNextStage,
      applicableSessionHours
    };
  };

  const getHealthColor = (): string => {
    const healthScore = treeDetails?.healthScore || 100;
    if (healthScore >= 80) return '#50AF27';
    if (healthScore >= 50) return '#FFC107';
    return '#F44336';
  };

  const getHealthStatus = (): string => {
    const healthScore = treeDetails?.healthScore || 100;
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    if (healthScore >= 40) return 'Fair';
    if (healthScore >= 20) return 'Poor';
    return 'Critical';
  };

  const handleWaterTree = async () => {
    if (!treeDetails) return;
    
    try {
      // This would call the tree service to water the tree
      // For now, we'll just update the local state
      setTreeDetails({
        ...treeDetails,
        healthScore: Math.min(100, treeDetails.healthScore + 10),
        lastWatered: new Date(),
        daysSinceLastWatered: 0,
      });
      Alert.alert('Success', 'Tree has been watered!');
    } catch (error) {
      Alert.alert('Error', 'Failed to water tree');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTreeDetails();
    } catch (error) {
      console.error('Error refreshing tree details:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tree details...</Text>
      </View>
    );
  }

  if (!treeDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Tree not found</Text>
      </View>
    );
  }

  const currentStage = treeDetails.currentStage || 0;
  const species = treeDetails.species || 'Unknown Tree';
  const treeName = treeDetails.name || `My ${species}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{treeName}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />}>
        {/* Tree Visual Section */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.visualSection}
        >
          
          <View style={styles.forestBackground}>
            <View style={styles.forestBackgroundOverlay}>
              <Image source={require('../../assets/bg/forest.png')} style={styles.forestBackgroundImage} />
            </View>
            
            {/* Tree Image */}
            <Animated.View 
              entering={SlideInUp.delay(400)}
              style={styles.treeContainer}
            >
              <Image
                source={getStageImage(currentStage)}
                style={styles.treeImage}
                resizeMode="contain"
              />
            </Animated.View>
            
            {/* Stage Badge */}
            <Animated.View 
              entering={SlideInRight.delay(600)}
              style={styles.stageBadge}
            >
              <Text style={styles.stageBadgeText}>{getStageName(currentStage)}</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Tree Information Cards */}
        <Animated.View 
          entering={FadeInUp.delay(800)}
          style={styles.infoSection}
        >
          {/* Basic Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Icon name="information" size={24} color="#50AF27" />
              <Text style={styles.cardTitle}>Tree Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Species</Text>
                <Text style={styles.infoValue}>{species}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Stage</Text>
                <Text style={styles.infoValue}>{getStageName(currentStage)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>WiFi Hours</Text>
                <Text style={styles.infoValue}>
                  {getProgressToNextStage().currentDisplayHours.toFixed(2)}h
                  {currentSessionHours > 0 && (
                    <Text style={styles.sessionIndicator}> (+{currentSessionHours.toFixed(2)}h live)</Text>
                  )}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{treeDetails.daysSincePlanted} days</Text>
              </View>
            </View>
          </View>

          {/* Growth Progress Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Icon name="trending-up" size={24} color="#50AF27" />
              <Text style={styles.cardTitle}>Growth Progress</Text>
              {currentSessionHours > 0 && !getProgressToNextStage().isMaxStage && (
                <View style={styles.activeGrowthIndicator}>
                  <Icon name="leaf" size={16} color="#4CAF50" />
                  <Text style={styles.activeGrowthText}>Growing</Text>
                </View>
              )}
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  Current Stage: {getStageName(Math.floor(getProgressToNextStage().currentDisplayHours || 0))}
                </Text>
                {!getProgressToNextStage().isMaxStage && (
                  <Text style={styles.nextStageText}>
                    {getProgressToNextStage().hoursNeeded.toFixed(2)}h to {getProgressToNextStage().nextStageName}
                  </Text>
                )}
                
                {/* Real-time Growth Timer */}
                {currentSessionHours > 0 && !getProgressToNextStage().isMaxStage && (
                  <View style={styles.realTimeGrowth}>
                    <Icon name="timer-sand" size={14} color="#4CAF50" />
                    <Text style={styles.growthTimerText}>
                      Next stage in: {Math.floor((getProgressToNextStage().hoursNeeded * 60))} minutes
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getProgressToNextStage().progress}%`,
                      backgroundColor: getProgressToNextStage().isMaxStage ? '#FFD700' : '#50AF27'
                    },
                    currentSessionHours > 0 && !getProgressToNextStage().isMaxStage && styles.activeProgressBar
                  ]} 
                />
                {/* Show a glowing effect when actively growing */}
                {currentSessionHours > 0 && !getProgressToNextStage().isMaxStage && (
                  <Animated.View
                    style={[
                      styles.progressGlow,
                      { 
                        width: `${getProgressToNextStage().progress}%`,
                      }
                    ]}
                  />
                )}
              </View>
              <Text style={styles.progressText}>
                {getProgressToNextStage().isMaxStage ? 
                  '🏆 Fully grown!' : 
                  `${getProgressToNextStage().progress.toFixed(1)}% progress to next stage`
                }
              </Text>
              
              {/* Detailed Progress Info */}
              {currentSessionHours > 0 && !getProgressToNextStage().isMaxStage && (
                <View style={styles.detailedProgress}>
                  <Text style={styles.detailText}>
                    📈 Live Progress: +{((currentSessionHours % 1) * 100).toFixed(1)}% this hour
                  </Text>
                  <Text style={styles.detailText}>
                    ⏱️ Session Time: {Math.floor(currentSessionHours * 60)} minutes
                  </Text>
                  <Text style={styles.detailText}>
                    🎯 Target: {getProgressToNextStage().nextStageHours}h for {getProgressToNextStage().nextStageName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Health Status Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Icon name="heart" size={24} color={getHealthColor()} />
              <Text style={styles.cardTitle}>Health Status</Text>
            </View>
            <View style={styles.healthContainer}>
              <View style={styles.healthStatusInfo}>
                <Text style={styles.healthPercentage}>
                  {treeDetails.healthScore}%
                </Text>
                <Text style={[styles.healthStatusText, { color: getHealthColor() }]}>
                  {getHealthStatus()}
                </Text>
              </View>
              <View style={styles.healthBar}>
                <View
                  style={[
                    styles.healthFill,
                    { 
                      width: `${treeDetails.healthScore}%`, 
                      backgroundColor: getHealthColor() 
                    },
                  ]}
                />
              </View>
              <TouchableOpacity 
                style={[styles.waterButton, { backgroundColor: getHealthColor() }]}
                onPress={handleWaterTree}
              >
                <Icon name="water" size={20} color="#fff" />
                <Text style={styles.waterButtonText}>Water Tree</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Growth Tips Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Icon name="lightbulb" size={24} color="#50AF27" />
              <Text style={styles.cardTitle}>Growth Tips</Text>
            </View>
            <View style={styles.tipsContainer}>
              <View style={styles.tipItem}>
                <Icon name="wifi" size={20} color="#50AF27" />
                <Text style={styles.tipText}>Connect to university WiFi to help your tree grow</Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="clock" size={20} color="#50AF27" />
                <Text style={styles.tipText}>Each hour of WiFi time advances your tree growth</Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="school" size={20} color="#50AF27" />
                <Text style={styles.tipText}>Attend classes regularly for consistent growth</Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="water" size={20} color="#50AF27" />
                <Text style={styles.tipText}>Water your tree regularly to maintain health</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#98D56D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#98D56D',
    
  },
  loadingText: {
    fontSize: rf(16),
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2E7D32',
    paddingTop: rs(50),
    paddingBottom: rs(16),
    paddingHorizontal: rs(16),
  },
  backButton: {
    padding: rs(8),
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  visualSection: {
    backgroundColor: '#98D56D',
    paddingBottom: rs(20),
  },
  forestBackground: {
    height: screenHeight * 0.55,
    position: 'relative',
    backgroundColor: '#6FB34D',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: rs(20),
    borderRadius: rs(20),
    marginTop: rs(20),
    overflow: 'hidden',
  },
  forestBackgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: rs(20),
  },
  forestBackgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: rs(20),
    opacity: 1,
    resizeMode: 'cover',
  },
  treeContainer: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
    zIndex: 10,
  },
  treeImage: {
    width: 180,
    height: 240,
  },
  stageBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(15),
  },
  stageBadgeText: {
    fontSize: rf(14),
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  infoSection: {
    padding: rs(16),
    gap: 16,
    backgroundColor: '#98D56D',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: rs(12),
    padding: rs(16),
    elevation: 2,
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
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: rs(8),
    flex: 1,
  },
  activeGrowthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: rs(8),
    paddingVertical: rs(4),
    borderRadius: rs(12),
    gap: 4,
  },
  activeGrowthText: {
    fontSize: rf(12),
    color: '#4CAF50',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: rf(14),
    color: '#666',
    marginBottom: rs(4),
  },
  infoValue: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
  },
  sessionIndicator: {
    fontSize: rf(12),
    color: '#4CAF50',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  progressContainer: {
    gap: 12,
  },
  progressInfo: {
    gap: 4,
  },
  progressLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#333',
  },
  nextStageText: {
    fontSize: rf(14),
    color: '#666',
    fontStyle: 'italic',
  },
  realTimeGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(15),
    marginTop: rs(8),
    alignSelf: 'flex-start',
  },
  growthTimerText: {
    fontSize: rf(12),
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: rs(6),
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: rs(6),
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: rs(6),
  },
  activeProgressBar: {
    shadowColor: '#50AF27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#50AF27',
    borderRadius: rs(6),
    opacity: 0.3,
  },
  progressText: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  detailedProgress: {
    backgroundColor: '#F8F9FA',
    padding: rs(12),
    borderRadius: rs(8),
    marginTop: rs(12),
    gap: 6,
  },
  detailText: {
    fontSize: rf(13),
    color: '#555',
    lineHeight: rf(18),
  },
  healthContainer: {
    gap: 12,
  },
  healthStatusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthPercentage: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#333',
  },
  healthStatusText: {
    fontSize: rf(16),
    fontWeight: '600',
  },
  healthBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: rs(5),
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: rs(5),
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(12),
    borderRadius: rs(8),
    gap: 8,
  },
  waterButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    fontSize: rf(14),
    color: '#666',
    flex: 1,
    lineHeight: rf(20),
  },
});

export default TreeDetailScreen;