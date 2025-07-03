import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTabBarContext } from '../../context/TabBarContext';
import { useWiFi } from '../../context/WiFiContext';
import { useScreenLoadingAnimation } from '../../hooks/useScreenLoadingAnimation';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { router } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { 
  rf, 
  rs, 
  deviceValue, 
  isTablet,
  isTabletLarge,
  getLayoutConfig,
  getContainerPadding,
  getMaxContentWidth,
  getModalWidth,
  isSmallHeightDevice
} from '../../utils/responsive';
// ResponsiveGrid không cần thiết nữa vì tablet dùng layout giống mobile
import userService from '../../services/userService';
import { treeService } from '../../services/treeService';
import { eventService } from '../../services/eventService';
import { getAvatarUrl, handleAvatarError } from '../../utils/imageUtils';
import { wifiService } from '../../services/wifiService';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleTouchStart } = useTabBarContext();
  const { headerAnimatedStyle, contentAnimatedStyle, isLoading } = useScreenLoadingAnimation();
  const { panGesture } = useSwipeNavigation({ currentScreen: 'profile' });
  const { 
    isConnected, 
    isUniversityWifi, 
    isSessionActive, 
    stats, 
    sessionCount, 
    ipAddress 
  } = useWiFi();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actualTreeCount, setActualTreeCount] = React.useState<number>(0);
  const [realTreeCount, setRealTreeCount] = React.useState<number>(0);
  const [currentPoints, setCurrentPoints] = React.useState<number>(user?.points || 0);
  const insets = useSafeAreaInsets();
  const layoutConfig = getLayoutConfig();

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
    const basePoints = currentPoints;
    return basePoints + sessionPoints;
  };

  React.useEffect(() => {
    if (user) {
      fetchActualTreeCount();
      fetchRealTreeCount();
    }
  }, [user?.id]);

  // Update points when user data changes
  React.useEffect(() => {
    if (user?.points !== undefined) {
      setCurrentPoints(user.points);
    }
  }, [user?.points]);

  // Listen for real-time points updates
  React.useEffect(() => {
    if (!user) return;

    const pointsSubscription = eventService.addListener('points', (data: { points?: number; totalPoints?: number }) => {
      console.log('ProfileScreen - Received points update:', data);
      if (data.points !== undefined || data.totalPoints !== undefined) {
        const newPoints = data.totalPoints ?? data.points;
        setCurrentPoints(newPoints ?? 0);
        console.log('ProfileScreen - Updated current points to:', newPoints);
      }
    });

    const treeSubscription = eventService.addListener('treeRedeemed', (data: { speciesName: string; newTreeCount: number }) => {
      console.log('ProfileScreen - Tree redeemed:', data);
      fetchActualTreeCount(); // Refresh actual tree count from API
    });

    return () => {
      eventService.removeAllListeners('points');
      eventService.removeAllListeners('treeRedeemed');
    };
  }, [user?.id]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutOnly = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleClearAll = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to make this work!'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Avatar',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openImagePicker('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => openImagePicker('gallery'),
        },
        {
          text: 'Remove Avatar',
          onPress: () => removeAvatar(),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openImagePicker = async (type: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (type === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setIsUploading(true);
    try {
      const response = await userService.uploadAvatar(imageUri);
      updateUser({ avatar: response.avatar });
      setAvatarError(false); // Reset avatar error state on successful upload
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    setIsUploading(true);
    try {
      await userService.deleteAvatar();
      updateUser({ avatar: undefined });
      Alert.alert('Success', 'Avatar removed successfully!');
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      Alert.alert('Error', error.message || 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchActualTreeCount = async () => {
    try {
      if (user) {
        const trees = await treeService.getTrees();
        setActualTreeCount(trees.length);
        // Also update the user context to keep it in sync
        updateUser({ treesPlanted: trees.length });
      }
    } catch (error) {
      console.error('Error fetching tree count:', error);
      // Fallback to user.treesPlanted if API call fails
      setActualTreeCount(user?.treesPlanted || 0);
    }
  };

  const fetchRealTreeCount = async () => {
    try {
      if (user) {
        const realTrees = await treeService.getRealTrees();
        const aliveRealTrees = realTrees.filter(tree => tree.stage !== 'dead');
        setRealTreeCount(aliveRealTrees.length);
      }
    } catch (error) {
      console.error('Error fetching real tree count:', error);
      // Set to 0 if real trees collection doesn't exist or fails
      setRealTreeCount(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Profile data is mostly managed by the auth context
      // Reset avatar error state on refresh
      setAvatarError(false);
      // Fetch actual tree count
      await fetchActualTreeCount();
      // Fetch real tree count
      await fetchRealTreeCount();
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderScreen = () => (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E8F2CD" />

        {/* Fixed Header Section */}
        <Animated.View 
          style={[
            styles.headerSection, 
            { 
              paddingHorizontal: layoutConfig.isTablet ? rs(40) : rs(20),
            }, 
            headerAnimatedStyle
          ]}
          onTouchStart={handleTouchStart}
        >
        {/* Profile Header */}
        <View style={[
          styles.profileHeaderSection,
          {
            width: '100%',
            alignSelf: 'center',
            flexDirection: layoutConfig.isTablet ? 'column' : 'row',
            paddingHorizontal: 0,
          }
        ]}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={pickImage}
            disabled={isUploading}
          >
            <View style={styles.avatar}>
              {user?.avatar && getAvatarUrl(user.avatar) && !avatarError ? (
                <Image 
                  source={{ uri: getAvatarUrl(user.avatar)! }} 
                  style={styles.avatarImage}
                  onError={handleAvatarError(() => setAvatarError(true))}
                />
              ) : (
                <Text style={styles.avatarLabel}>{user?.fullname?.charAt(0) || 'U'}</Text>
              )}
              {isUploading && (
                <View style={styles.avatarOverlay}>
                  <Icon name="loading" size={rf(24, 28, 32)} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.avatarEditIcon}>
              <Icon name="camera" size={rf(16, 18, 20)} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={[
            styles.profileInfoContainer,
            {
              marginLeft: layoutConfig.isTablet ? 0 : rs(20),
              marginTop: layoutConfig.isTablet ? rs(16) : 0,
              alignItems: layoutConfig.isTablet ? 'center' : 'flex-start',
            }
          ]}>
            <Text style={styles.profileName}>
              {user?.fullname || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'No email provided'}
            </Text>
          </View>
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
            {/* Stats Card */}
            <View style={[styles.card, styles.statsCard]}>
              <Text style={styles.cardTitle}>Your Impact</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="star" size={rf(24)} color="#50AF27" />
                  <Text style={styles.statValue}>
                  {isSessionActive ? getLiveTotalPoints() : currentPoints}
                </Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="tree" size={rf(24)} color="#50AF27" />
                  <Text style={styles.statValue}>{actualTreeCount}</Text>
                  <Text style={styles.statLabel}>Trees</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="cloud-outline" size={rf(24)} color="#50AF27" />
                  <Text style={styles.statValue}>{realTreeCount * 22}</Text>
                  <Text style={styles.statLabel}>kg CO₂/year</Text>
                </View>
              </View>
            </View>

            {/* Settings Card */}
            <View style={[styles.card, styles.settingsCard]}>
              <Text style={styles.cardTitle}>Settings</Text>
              
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => router.push('/user-settings')}
              >
                <View style={styles.settingsItemLeft}>
                  <Icon name="account-edit" size={rf(24)} color="#50AF27" />
                  <Text style={styles.settingsItemText}>User Settings</Text>
                </View>
                <Icon name="chevron-right" size={rf(20)} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomWidth: 0 }]}
                onPress={() => router.push('/system-settings')}
              >
                <View style={styles.settingsItemLeft}>
                  <Icon name="cog" size={rf(24)} color="#50AF27" />
                  <Text style={styles.settingsItemText}>System Settings</Text>
                </View>
                <Icon name="chevron-right" size={rf(20)} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Icon name="logout" size={rf(24)} color="#FFA79D" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../../assets/mascots/Unitree - Mascot-3.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Logout Modal */}
      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: getModalWidth() }]}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalLogoutButton]}
                onPress={handleLogoutOnly}
              >
                <Text style={[styles.modalButtonText, styles.modalLogoutButtonText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </View>
    </GestureDetector>
  );

  // For tablet, wrap with SafeAreaView since we bypass ScreenLayout
  if (layoutConfig.isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#E8F2CD' }} edges={['left', 'right']}>
        {renderScreen()}
      </SafeAreaView>
    );
  }

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F2CD',
  },
  headerSection: {
    backgroundColor: '#E8F2CD',
    paddingBottom: rs(45, 60, 75),
    paddingTop: rs(10, 15, 20),
  },
  profileHeaderSection: {
    alignItems: 'center',
    display: 'flex',
    marginTop: rs(30, 40, 50),
    paddingTop: rs(30, 40, 50),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: rs(90, 110, 130),
    height: rs(90, 110, 130),
    borderRadius: rs(50, 60, 70),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: rs(16, 20, 24),
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: rs(50, 60, 70),
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(50, 60, 70),
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: rs(16, 20, 24),
    right: 0,
    backgroundColor: '#50AF27',
    borderRadius: rs(12, 16, 20),
    padding: rs(4, 6, 8),
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: rf(36, 44, 52),
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: rs(10, 15, 20),
  },
  profileName: {
    fontSize: rf(24, 28, 32),
    fontWeight: 'bold',
    color: '#8BC24A',
    marginBottom: rs(4, 6, 8),
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: rf(16, 18, 20),
    color: '#8BC24A',
    opacity: 0.8,
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#98D56D',
    borderTopLeftRadius: rs(30, 40, 50),
    borderTopRightRadius: rs(30, 40, 50),
    paddingTop: rs(32, 40, 48),
  },
  mascotContainer: {
    position: 'absolute',
    right: rs(20),
    top: isSmallHeightDevice() ? rs(75) : (isTabletLarge() ? rs(235) : rs(125)),
    zIndex: 9999,
  },
  mascotImage: {
    width: rs(160, 180, 200),
    height: rs(160, 180, 200),
  },
  scrollContainer: {
    flex: 1,
    marginTop: rs(40, 50, 60),
    borderRadius: rs(16, 20, 24),
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {},
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(16, 20, 24),
    padding: rs(20, 24, 28),
    marginBottom: rs(20, 24, 28),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCard: {},
  settingsCard: {},
  cardTitle: {
    fontSize: rf(20, 24, 28),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(16, 20, 24),
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
    fontSize: rf(24, 28, 32),
    fontWeight: 'bold',
    color: '#50AF27',
    marginTop: rs(8, 10, 12),
    marginBottom: rs(4, 6, 8),
  },
  statLabel: {
    fontSize: rf(12, 14, 16),
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: rs(40, 48, 56),
    backgroundColor: '#E0E0E0',
    marginHorizontal: rs(16, 20, 24),
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(16, 20, 24),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: rf(16, 18, 20),
    color: '#333',
    marginLeft: rs(12, 16, 20),
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(16, 20, 24),
    marginTop: rs(16, 20, 24),
    borderWidth: 2,
    borderColor: '#FFA79D',
    borderRadius: rs(12, 16, 20),
  },
  logoutButtonText: {
    fontSize: rf(16, 18, 20),
    color: '#FFA79D',
    fontWeight: 'bold',
    marginLeft: rs(8, 10, 12),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: rs(16, 20, 24),
    padding: rs(24, 28, 32),
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: rf(20, 24, 28),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(12, 16, 20),
  },
  modalMessage: {
    fontSize: rf(16, 18, 20),
    color: '#666',
    marginBottom: rs(24, 28, 32),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: rs(16, 20, 24),
    paddingVertical: rs(8, 10, 12),
    borderRadius: rs(8, 10, 12),
    marginLeft: rs(12, 16, 20),
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalLogoutButton: {
    backgroundColor: '#FFA79D',
  },
  modalButtonText: {
    fontSize: rf(16, 18, 20),
    fontWeight: '500',
    color: '#333',
  },
  modalLogoutButtonText: {
    color: '#fff',
  },
});

export default ProfileScreen; 