import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Alert } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { rf, rs } from '../../utils/responsive';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'achievement' | 'points' | 'tree' | 'wifi';
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Achievement Unlocked!',
    message: 'You\'ve earned the "Early Bird" badge for connecting before 8 AM',
    timestamp: '2 hours ago',
    type: 'achievement',
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    title: 'Points Update',
    message: 'You\'ve earned 50 points for your recent WiFi activity',
    timestamp: '5 hours ago',
    type: 'points',
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Tree Planted Successfully',
    message: 'Your virtual tree has been planted in the forest and is now growing',
    timestamp: '1 day ago',
    type: 'tree',
    read: true,
    priority: 'low',
  },
  {
    id: '4',
    title: 'WiFi Status Update',
    message: 'Your device is now connected to the university network',
    timestamp: '2 days ago',
    type: 'wifi',
    read: true,
    priority: 'low',
  },
  {
    id: '5',
    title: 'Weekly Report Ready',
    message: 'Your weekly WiFi usage and points summary is now available',
    timestamp: '3 days ago',
    type: 'achievement',
    read: false,
    priority: 'medium',
  },
];

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, index, onDelete, onMarkAsRead }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return 'trophy';
      case 'points':
        return 'star';
      case 'tree':
        return 'tree';
      case 'wifi':
        return 'wifi';
      default:
        return 'bell';
    }
  };

  const getPriorityColor = (priority: string = 'low') => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#4ECDC4';
      case 'low':
        return '#95E1D3';
      default:
        return '#95E1D3';
    }
  };

  const getPriorityStyle = (priority: string = 'low') => {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: '#FF6B6B',
          borderColor: '#FF5252',
        };
      case 'medium':
        return {
          backgroundColor: '#4ECDC4',
          borderColor: '#26A69A',
        };
      case 'low':
        return {
          backgroundColor: '#95E1D3',
          borderColor: '#4DB6AC',
        };
      default:
        return {
          backgroundColor: '#95E1D3',
          borderColor: '#4DB6AC',
        };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const deleteStyle = useAnimatedStyle(() => {
    return {
      opacity: translateX.value < -50 ? withTiming(1) : withTiming(0),
    };
  });

  const handlePanGesture = (event: any) => {
    const { translationX } = event.nativeEvent;
    
    if (translationX < 0) {
      translateX.value = Math.max(translationX, -100);
    } else {
      translateX.value = Math.min(translationX, 50);
    }
  };

  const handlePanEnd = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;
    
    if (translationX < -80 || (translationX < -30 && velocityX < -500)) {
      // Delete animation
      translateX.value = withTiming(-400, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 }, () => {
        runOnJS(onDelete)(notification.id);
      });
    } else if (translationX > 30 || (translationX > 15 && velocityX > 500)) {
      // Mark as read animation
      translateX.value = withSpring(0);
      runOnJS(onMarkAsRead)(notification.id);
    } else {
      // Spring back
      translateX.value = withSpring(0);
    }
  };

  const priorityStyle = getPriorityStyle(notification.priority);

  return (
    <Animated.View
      entering={FadeInUp.delay(600 + (index * 100))}
      exiting={SlideOutRight.duration(300)}
      style={styles.itemWrapper}
    >
      {/* Swipe action backgrounds */}
      <Animated.View style={[styles.deleteBackground, deleteStyle]}>
        <Icon name="delete" size={24} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={handlePanGesture}
        onEnded={handlePanEnd}
      >
        <Animated.View
          style={[
            styles.notificationItem,
            priorityStyle,
            !notification.read && styles.unreadItem,
            notification.read && styles.readItem,
            animatedStyle,
          ]}
        >
          {/* Priority indicator */}
          {!notification.read && (
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(notification.priority) }]} />
          )}

          <View style={styles.iconContainer}>
            <Icon 
              name={getIconForType(notification.type)} 
              size={24} 
              color={notification.read ? '#666666' : '#fff'} 
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={[
                styles.notificationTitle,
                notification.read && styles.readText,
                !notification.read && styles.unreadText
              ]}>
                {notification.title}
              </Text>
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </View>
            
            <Text style={[
              styles.notificationMessage,
              notification.read && styles.readText,
              !notification.read && styles.unreadMessageText
            ]}>
              {notification.message}
            </Text>
            
            <View style={styles.bottomRow}>
              <Text style={styles.timestamp}>{notification.timestamp}</Text>
              {notification.priority === 'high' && (
                <View style={styles.priorityBadge}>
                  <Icon name="exclamation" size={12} color="#fff" />
                  <Text style={styles.priorityBadgeText}>HIGH</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => {
            setNotifications(prev => 
              prev.map(notification => ({ ...notification, read: true }))
            );
          }
        }
      ]
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#98D56D" />
        <View style={styles.container}>
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.header}
          >
          <TouchableOpacity style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Icon name="check-all" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View 
          entering={FadeInUp.delay(300)}
          style={styles.tabsContainer}
        >
          <View style={styles.pillTabs}>
            <TouchableOpacity
              style={[
                styles.pillTab,
                selectedFilter === 'all' && styles.pillTabActive
              ]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[
                styles.pillTabText,
                selectedFilter === 'all' && styles.pillTabTextActive
              ]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pillTab,
                selectedFilter === 'unread' && styles.pillTabActive
              ]}
              onPress={() => setSelectedFilter('unread')}
            >
              <Text style={[
                styles.pillTabText,
                selectedFilter === 'unread' && styles.pillTabTextActive
              ]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pillTab,
                selectedFilter === 'read' && styles.pillTabActive
              ]}
              onPress={() => setSelectedFilter('read')}
            >
              <Text style={[
                styles.pillTabText,
                selectedFilter === 'read' && styles.pillTabTextActive
              ]}>
                Read ({notifications.length - unreadCount})
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={styles.content}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="bell-off-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No notifications found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedFilter === 'unread' 
                    ? 'All caught up! No unread notifications.'
                    : selectedFilter === 'read'
                    ? 'No read notifications yet.'
                    : 'Pull down to refresh and check for new notifications.'
                  }
                </Text>
              </View>
            ) : (
              filteredNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onDelete={handleDeleteNotification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}

            {/* Swipe instructions */}
            {filteredNotifications.length > 0 && (
              <Animated.View 
                entering={FadeInUp.delay(800)}
                style={styles.instructionsContainer}
              >
                <Text style={styles.instructionsText}>
                  💡 Swipe left to delete • Swipe right to mark as read
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Settings Access */}
        <Link href="/notification-settings" asChild>
          <TouchableOpacity style={styles.settingsButton}>
            <Icon name="cog" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
              </View>
      </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#98D56D', // Green background to match header
  },
  container: {
    flex: 1,
    backgroundColor: '#FFCED2', // Pink background like leaderboard
  },
  header: {
    backgroundColor: '#98D56D', // Green header like leaderboard
    paddingTop: 0,
    paddingBottom: rs(20),
    paddingHorizontal: rs(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: rs(8),
  },
  headerTitle: {
    flex: 1,
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  markAllButton: {
    padding: rs(8),
  },
  tabsContainer: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(15),
    backgroundColor: '#FFCED2',
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
    paddingHorizontal: rs(12),
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
    fontSize: rf(12),
    fontWeight: '600',
    color: '#666',
  },
  pillTabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: rs(20),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: rs(20),
  },
  scrollContent: {
    paddingBottom: rs(100),
    paddingTop: rs(5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: rs(60),
  },
  emptyText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginTop: rs(16),
    marginBottom: rs(8),
  },
  emptySubtext: {
    fontSize: rf(14),
    color: '#999',
    textAlign: 'center',
  },
  instructionsContainer: {
    paddingVertical: rs(20),
    paddingHorizontal: rs(10),
  },
  instructionsText: {
    fontSize: rf(12),
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  settingsButton: {
    position: 'absolute',
    bottom: rs(100),
    right: rs(20),
    backgroundColor: '#98D56D',
    borderRadius: rs(25),
    padding: rs(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Notification Item Styles (like leaderboard items)
  itemWrapper: {
    position: 'relative',
    marginBottom: rs(12),
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    borderRadius: rs(16),
    width: rs(80),
  },
  deleteText: {
    color: '#fff',
    fontSize: rf(12),
    fontWeight: 'bold',
    marginTop: rs(4),
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(15),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
  },
  unreadItem: {
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  readItem: {
    opacity: 0.8,
    backgroundColor: '#f8f8f8',
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: rs(4),
    borderTopLeftRadius: rs(16),
    borderBottomLeftRadius: rs(16),
  },
  iconContainer: {
    width: rs(50),
    height: rs(50),
    borderRadius: rs(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(4),
  },
  notificationTitle: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  unreadText: {
    color: '#fff',
  },
  readText: {
    color: '#666',
  },
  unreadDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: '#ff4444',
    marginLeft: rs(8),
  },
  notificationMessage: {
    fontSize: rf(14),
    color: '#666',
    marginBottom: rs(8),
    lineHeight: rf(20),
  },
  unreadMessageText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: rf(12),
    color: '#999',
    fontStyle: 'italic',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(8),
  },
  priorityBadgeText: {
    fontSize: rf(10),
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: rs(2),
  },
}); 