import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, Button, List } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import userService from '../../services/userService';
import { rf, rs } from '../../utils/responsive';

const UserSettingsScreen = () => {
  const { user, updateUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveProfile = async () => {
    try {
      // Only allow nickname updates
      await userService.updateProfile({ nickname });
      await updateUser({ ...user, nickname });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 8 || password.length > 16) {
      return 'Password must be between 8-16 characters long';
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol';
    }
    
    return null;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    try {
      await userService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Personal Information
          </Text>
          
          {isEditingProfile ? (
            <>
              <TextInput
                label="Nickname"
                value={nickname}
                onChangeText={setNickname}
                style={styles.input}
                mode="outlined"
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
              />
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setNickname(user?.nickname || '');
                    setIsEditingProfile(false);
                  }}
                  style={styles.button}
                  textColor={theme.colors.textPrimary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  textColor={theme.colors.white}
                >
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <List.Item
                title="Nickname"
                description={user?.nickname || 'Not set'}
                left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
              />
              <List.Item
                title="Full Name"
                description={user?.fullname || 'Not set'}
                left={props => <List.Icon {...props} icon="account-circle" color={theme.colors.primary} />}
              />
              <List.Item
                title="Email"
                description={user?.email || 'Not set'}
                left={props => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
              />
              <List.Item
                title="University"
                description={user?.university || 'Not set'}
                left={props => <List.Icon {...props} icon="school" color={theme.colors.primary} />}
              />
              <Button
                mode="contained"
                onPress={() => setIsEditingProfile(true)}
                style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
                textColor={theme.colors.white}
              >
                Edit Nickname
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Account Information
          </Text>
          
          {isChangingPassword ? (
            <>
              <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry={!showCurrentPassword}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
                right={<TextInput.Icon 
                  icon={showCurrentPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />}
              />
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry={!showNewPassword}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
                right={<TextInput.Icon 
                  icon={showNewPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />}
              />
              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
                right={<TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />}
              />
              <Text style={styles.passwordHint}>
                Password must be 8-16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.
              </Text>
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setIsChangingPassword(false);
                  }}
                  style={styles.button}
                  textColor={theme.colors.textPrimary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleChangePassword}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  textColor={theme.colors.white}
                >
                  Change Password
                </Button>
              </View>
            </>
          ) : (
            <>
              <List.Item
                title="Change Password"
                description="Update your account password"
                left={props => <List.Icon {...props} icon="lock" color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
                onPress={() => setIsChangingPassword(true)}
              />
              <List.Item
                title="Forgot Password?"
                description="Reset password via email verification"
                left={props => <List.Icon {...props} icon="email-lock" color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
                onPress={() => router.push('/auth/forgot-password')}
              />
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Account Preferences
          </Text>
          <List.Item
            title="Language"
            description="English"
            left={props => <List.Icon {...props} icon="translate" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
            onPress={() => {/* Handle language selection */}}
          />
          <List.Item
            title="Theme"
            description="Light"
            left={props => <List.Icon {...props} icon="theme-light-dark" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
            onPress={() => {/* Handle theme selection */}}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: rs(16),
  },
  card: {
    marginBottom: rs(16),
    backgroundColor: theme.colors.white,
    elevation: 2,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    marginBottom: rs(16),
    fontWeight: '600',
  },
  input: {
    marginBottom: rs(16),
    backgroundColor: theme.colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 100,
  },
  editButton: {
    marginTop: rs(16),
  },
  passwordHint: {
    fontSize: rf(12),
    color: theme.colors.textSecondary,
    marginBottom: rs(16),
    lineHeight: rf(16),
  },
});

export default UserSettingsScreen; 