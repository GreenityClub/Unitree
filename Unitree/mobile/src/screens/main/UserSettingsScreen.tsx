import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';
import { Card, IconSymbol } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  notifications: boolean;
}

export default function UserSettingsScreen() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567', // Mock data
    location: 'San Francisco, CA', // Mock data
    notifications: true,
  });

  const handleSave = async () => {
    try {
      // In a real app, make API call to update user profile
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const renderField = (label: string, value: string, field: keyof UserProfile) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && field !== 'email' ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setProfile({ ...profile, [field]: text })}
          placeholder={`Enter your ${label.toLowerCase()}`}
          placeholderTextColor={colors.textTertiary}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>User Settings</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <IconSymbol name="user" size={48} color={colors.primary} />
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.changeAvatarButton}>
                <Text style={styles.changeAvatarText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {renderField('Name', profile.name, 'name')}
          {renderField('Email', profile.email, 'email')}
          {renderField('Phone', profile.phone, 'phone')}
          {renderField('Location', profile.location, 'location')}
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          <Card style={styles.securityCard}>
            <TouchableOpacity style={styles.securityButton}>
              <View style={styles.securityButtonContent}>
                <IconSymbol name="lock" size={24} color={colors.primary} />
                <Text style={styles.securityButtonText}>Change Password</Text>
              </View>
              <IconSymbol name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.securityButton}>
              <View style={styles.securityButtonContent}>
                <IconSymbol name="shield" size={24} color={colors.primary} />
                <Text style={styles.securityButtonText}>Two-Factor Authentication</Text>
              </View>
              <IconSymbol name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Card style={styles.privacyCard}>
            <TouchableOpacity style={styles.privacyButton}>
              <Text style={styles.privacyButtonText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.privacyButton}>
              <Text style={styles.privacyButtonText}>Terms of Service</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.component.screenPadding,
    paddingTop: spacing.component.screenPaddingVertical,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  editButton: {
    paddingHorizontal: spacing.component.md,
    paddingVertical: spacing.component.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  profileCard: {
    margin: spacing.component.screenPadding,
    padding: spacing.component.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.component.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.component.sm,
  },
  changeAvatarButton: {
    padding: spacing.component.sm,
  },
  changeAvatarText: {
    color: colors.primary,
    fontSize: 16,
  },
  fieldContainer: {
    marginBottom: spacing.component.md,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  input: {
    fontSize: 16,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.component.xs,
  },
  section: {
    padding: spacing.component.screenPadding,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.component.sm,
  },
  securityCard: {
    padding: 0,
    overflow: 'hidden',
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.component.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  securityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.component.md,
  },
  privacyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  privacyButton: {
    padding: spacing.component.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  privacyButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
}); 