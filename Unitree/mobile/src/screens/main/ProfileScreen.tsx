import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rf, rs, deviceValue } from '../../utils/responsive';

type RootStackParamList = {
  UserSettingsScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserSettingsScreen'>;

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const insets = useSafeAreaInsets();

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E8F2CD" />

      {/* Fixed Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.headerSection}
      >
        {/* Profile Header */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>
            {user?.name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || 'No email provided'}
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
        >
          <View style={styles.content}>
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Your Impact</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="star" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>{user?.points || 0}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="tree" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>{user?.treesPlanted || 0}</Text>
                  <Text style={styles.statLabel}>Trees</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Icon name="cloud-outline" size={24} color="#50AF27" />
                  <Text style={styles.statValue}>{(user?.treesPlanted || 0) * 48}</Text>
                  <Text style={styles.statLabel}>kg CO₂/year</Text>
                </View>
              </View>
            </View>

            {/* Settings Card */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Settings</Text>
              
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => navigation.navigate('UserSettingsScreen')}
              >
                <View style={styles.settingsItemLeft}>
                  <Icon name="account-settings-outline" size={24} color="#50AF27" />
                  <Text style={styles.settingsItemText}>User Settings</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Icon name="logout" size={24} color="#FFA79D" />
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
          <View style={styles.modalContent}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F2CD',
  },
  headerSection: {
    backgroundColor: '#E8F2CD',
    paddingBottom: rs(90),
    paddingTop: rs(10),
  },
  profileHeaderSection: {
    alignItems: 'center',
    paddingHorizontal: rs(20),
    marginTop: rs(30),
  },
  avatar: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: rs(16),
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: rf(36),
    color: '#fff',
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#8BC24A',
    marginBottom: rs(4),
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: rf(16),
    color: '#8BC24A',
    opacity: 0.8,
    textAlign: 'center',
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
    top: deviceValue(150, 160, 170),
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
  statsCard: {
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
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(16),
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
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: rf(16),
    color: '#333',
    marginLeft: rs(12),
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(16),
    marginTop: rs(16),
    borderWidth: 2,
    borderColor: '#FFA79D',
    borderRadius: rs(12),
  },
  logoutButtonText: {
    fontSize: rf(16),
    color: '#FFA79D',
    fontWeight: 'bold',
    marginLeft: rs(8),
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
    borderRadius: rs(16),
    padding: rs(24),
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(12),
  },
  modalMessage: {
    fontSize: rf(16),
    color: '#666',
    marginBottom: rs(24),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(8),
    marginLeft: rs(12),
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalLogoutButton: {
    backgroundColor: '#FFA79D',
  },
  modalButtonText: {
    fontSize: rf(16),
    fontWeight: '500',
    color: '#333',
  },
  modalLogoutButtonText: {
    color: '#fff',
  },
});

export default ProfileScreen; 