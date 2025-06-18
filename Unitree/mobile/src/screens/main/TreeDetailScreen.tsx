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
const getStageImage = (stage: string) => {
  const stageImages = {
    'seedling': require('../../assets/trees/stage01.png'),
    'sprout': require('../../assets/trees/stage02.png'),
    'sapling': require('../../assets/trees/stage03.png'),
    'young_tree': require('../../assets/trees/stage04.png'),
    'mature_tree': require('../../assets/trees/stage05.png'),
    'ancient_tree': require('../../assets/trees/stage06.png')
  };
  return stageImages[stage as keyof typeof stageImages] || stageImages['seedling'];
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
  
  const [treeDetails, setTreeDetails] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watering, setWatering] = useState(false);

  useEffect(() => {
    loadTreeDetails();
  }, [treeId]);

  // Real-time update every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Real-time tree detail refresh...');
      loadTreeDetails();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadTreeDetails = async () => {
    try {
      if (user && treeId) {
        console.log('Fetching fresh tree data from server...');
        const freshTreeData = await treeService.getTree(treeId);
        console.log('Fresh tree data:', freshTreeData);
        setTreeDetails(freshTreeData);
      }
    } catch (error) {
      console.error('Error loading tree details:', error);
      Alert.alert('Error', 'Failed to load tree details');
    } finally {
      setLoading(false);
    }
  };

  const handleWaterTree = async () => {
    if (!treeDetails || watering) return;
    
    // Check if tree can be watered
    if (!treeService.canWaterTree(treeDetails)) {
      const healthStatus = treeDetails.healthStatus;
      if (healthStatus?.status === 'dead') {
        Alert.alert('Cannot Water', 'This tree has died and cannot be watered');
      } else if (!healthStatus?.canWater) {
        Alert.alert('Cannot Water', 'This tree has already been watered today');
      }
      return;
    }

    setWatering(true);
    try {
      const result = await treeService.waterTree(treeDetails._id);
      if (result.success) {
        Alert.alert('Success', result.message);
        // Refresh tree data after watering
        await loadTreeDetails();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to water tree');
    } finally {
      setWatering(false);
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

  const treeName = treeDetails.name || `My ${treeDetails.species}`;
  const healthStatus = treeDetails.healthStatus;
  const growthProgress = treeDetails.growthProgress;
  const healthWarning = healthStatus ? treeService.getHealthWarningMessage(healthStatus) : null;

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
        
        {/* Health Warning */}
        {healthWarning && (
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={[
              styles.warningCard,
              { backgroundColor: healthStatus?.status === 'dead' ? '#FF5722' : '#FF9800' }
            ]}
          >
            <Icon 
              name={healthStatus?.status === 'dead' ? 'skull' : 'alert'} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.warningText}>{healthWarning}</Text>
          </Animated.View>
        )}

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
              style={[
                styles.treeContainer,
                treeDetails.isDead && styles.deadTreeContainer
              ]}
            >
              <Image
                source={getStageImage(treeDetails.stage)}
                style={[
                  styles.treeImage,
                  treeDetails.isDead && styles.deadTreeImage
                ]}
                resizeMode="contain"
              />
              {treeDetails.isDead && (
                <View style={styles.deadOverlay}>
                  <Icon name="skull" size={40} color="#666" />
                  <Text style={styles.deadText}>Dead</Text>
                </View>
              )}
            </Animated.View>
            
            {/* Stage Badge */}
            <Animated.View 
              entering={SlideInRight.delay(600)}
              style={[
                styles.stageBadge,
                { backgroundColor: treeService.getStageColor(treeDetails.stage) }
              ]}
            >
              <Text style={styles.stageBadgeText}>
                {treeService.getTreeStatusText(treeDetails.stage)}
              </Text>
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
                <Text style={styles.infoValue}>{treeDetails.species}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Stage</Text>
                <Text style={styles.infoValue}>
                  {treeService.getTreeStatusText(treeDetails.stage)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>WiFi Time</Text>
                <Text style={styles.infoValue}>
                  {treeService.formatWifiTime(treeDetails.totalWifiTime)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>
                  {treeService.getDaysGrowing(treeDetails.plantedDate)} days
                </Text>
              </View>
            </View>
          </View>

          {/* Growth Progress Card */}
          {growthProgress && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Icon name="trending-up" size={24} color="#50AF27" />
                <Text style={styles.cardTitle}>Growth Progress</Text>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${growthProgress.progressPercent}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {growthProgress.progressPercent.toFixed(1)}% to next stage
                </Text>
                {!growthProgress.isMaxStage && (
                  <Text style={styles.progressSubtext}>
                    {treeService.getNextStageRequirement(treeDetails)}
                  </Text>
                )}
                {growthProgress.isMaxStage && (
                  <Text style={styles.maxStageText}>
                    🎉 Maximum growth reached!
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Health Status Card */}
          {healthStatus && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Icon 
                  name={healthStatus.status === 'dead' ? 'skull' : 'heart'} 
                  size={24} 
                  color={treeService.getHealthStatusColor(healthStatus.status)} 
                />
                <Text style={styles.cardTitle}>Health Status</Text>
              </View>
              <View style={styles.healthSection}>
                <View style={styles.healthRow}>
                  <Text style={styles.healthLabel}>Status:</Text>
                  <Text style={[
                    styles.healthValue,
                    { color: treeService.getHealthStatusColor(healthStatus.status) }
                  ]}>
                    {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.healthRow}>
                  <Text style={styles.healthLabel}>Health Score:</Text>
                  <Text style={[
                    styles.healthValue,
                    { color: treeService.getHealthColor(healthStatus.healthScore) }
                  ]}>
                    {healthStatus.healthScore}/100
                  </Text>
                </View>
                {healthStatus.daysSinceWatered !== null && (
                  <View style={styles.healthRow}>
                    <Text style={styles.healthLabel}>Last Watered:</Text>
                    <Text style={styles.healthValue}>
                      {treeService.formatDaysSinceWatered(healthStatus.daysSinceWatered)}
                    </Text>
                  </View>
                )}
                {healthStatus.status !== 'dead' && (
                  <View style={styles.healthRow}>
                    <Text style={styles.healthLabel}>Days Until Death:</Text>
                    <Text style={[
                      styles.healthValue,
                      { color: healthStatus.daysUntilDeath <= 1 ? '#f44336' : '#666' }
                    ]}>
                      {healthStatus.daysUntilDeath.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Actions Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Icon name="gesture-tap" size={24} color="#50AF27" />
              <Text style={styles.cardTitle}>Actions</Text>
            </View>
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (!treeService.canWaterTree(treeDetails) || watering) && styles.actionButtonDisabled
                ]}
                onPress={handleWaterTree}
                disabled={!treeService.canWaterTree(treeDetails) || watering}
              >
                <Icon 
                  name={watering ? 'loading' : 'water'} 
                  size={24} 
                  color={treeService.canWaterTree(treeDetails) && !watering ? '#fff' : '#999'} 
                />
                <Text style={[
                  styles.actionButtonText,
                  (!treeService.canWaterTree(treeDetails) || watering) && styles.actionButtonTextDisabled
                ]}>
                  {watering ? 'Watering...' : 'Water Tree'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Milestones Card */}
          {treeDetails.milestones && treeDetails.milestones.length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Icon name="timeline" size={24} color="#50AF27" />
                <Text style={styles.cardTitle}>Milestones</Text>
              </View>
              <View style={styles.milestonesSection}>
                {treeDetails.milestones.slice(0, 5).map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <View style={styles.milestoneIcon}>
                      <Icon 
                        name={
                          milestone.type === 'PLANTED' ? 'seed' :
                          milestone.type === 'WATERED' ? 'water' :
                          milestone.type === 'STAGE_CHANGE' ? 'trending-up' :
                          milestone.type === 'DIED' ? 'skull' : 'star'
                        } 
                        size={16} 
                        color="#50AF27" 
                      />
                    </View>
                    <View style={styles.milestoneContent}>
                      <Text style={styles.milestoneDescription}>
                        {milestone.description}
                      </Text>
                      <Text style={styles.milestoneDate}>
                        {new Date(milestone.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
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
  warningCard: {
    padding: rs(16),
    borderRadius: rs(12),
    marginBottom: rs(16),
  },
  warningText: {
    fontSize: rf(16),
    color: '#fff',
    fontWeight: 'bold',
  },
  progressSection: {
    gap: 12,
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
  progressText: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressSubtext: {
    fontSize: rf(12),
    color: '#666',
    fontStyle: 'italic',
  },
  maxStageText: {
    fontSize: rf(14),
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  healthSection: {
    gap: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: rf(14),
    color: '#666',
  },
  healthValue: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(12),
    borderRadius: rs(8),
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '600',
  },
  actionButtonDisabled: {
    backgroundColor: '#999',
  },
  actionButtonTextDisabled: {
    color: '#666',
  },
  milestonesSection: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  milestoneIcon: {
    padding: rs(4),
    borderRadius: rs(8),
    backgroundColor: '#E8F5E8',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDescription: {
    fontSize: rf(14),
    color: '#666',
    lineHeight: rf(20),
  },
     milestoneDate: {
     fontSize: rf(12),
     color: '#999',
     fontStyle: 'italic',
   },
   deadTreeContainer: {
     opacity: 0.6,
   },
   deadTreeImage: {
     filter: 'grayscale(100%)',
     opacity: 0.8,
   },
   deadOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(0,0,0,0.3)',
     borderRadius: rs(12),
   },
   deadText: {
     fontSize: rf(16),
     color: '#666',
     fontWeight: 'bold',
     marginTop: rs(8),
   },
 });
 
 export default TreeDetailScreen;