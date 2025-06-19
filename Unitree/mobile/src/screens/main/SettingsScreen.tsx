import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';
import { Card } from '../../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  showArrow?: boolean;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        id: 'profile',
        title: 'User Settings',
        icon: 'user',
        route: '/user-settings',
        showArrow: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        icon: 'bell',
        route: '/notification-settings',
        showArrow: true,
      },
    ],
  },
  {
    id: 'app',
    title: 'App Settings',
    items: [
      {
        id: 'wifi',
        title: 'WiFi Status',
        icon: 'wifi',
        route: '/wifi-status',
        showArrow: true,
      },
    ],
  },
  {
    id: 'other',
    title: 'Other',
    items: [
      {
        id: 'logout',
        title: 'Logout',
        icon: 'log-out',
        route: '/logout',
      },
    ],
  },
];

export default function SettingsScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getIconName = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'user': 'account',
      'bell': 'bell',
      'wifi': 'wifi',
      'log-out': 'logout',
      'chevron-right': 'chevron-right'
    };
    return iconMap[iconName] || 'help-circle';
  };

  const renderSettingsItem = (item: SettingsItem) => {
    const content = (
      <View style={styles.settingsItem}>
        <View style={styles.settingsItemLeft}>
          <Icon name={getIconName(item.icon)} size={24} color={colors.primary} />
          <Text style={styles.settingsItemTitle}>{item.title}</Text>
        </View>
        {item.showArrow && (
          <Icon name="chevron-right" size={24} color={colors.textSecondary} />
        )}
      </View>
    );

    if (item.id === 'logout') {
      return (
        <TouchableOpacity key={item.id} onPress={handleLogout}>
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity key={item.id} onPress={() => router.push(item.route as any)}>
          {content}
        </TouchableOpacity>
    );
  };

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {settingsSections.map(section => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map(item => renderSettingsItem(item))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.component.screenPadding,
    paddingTop: spacing.component.screenPaddingVertical,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    padding: spacing.component.screenPadding,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.component.paddingSM,
    paddingHorizontal: spacing.component.paddingSM,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.component.paddingMD,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.component.paddingMD,
  },
}); 