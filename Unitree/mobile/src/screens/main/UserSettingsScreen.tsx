import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { rf, rs } from '../../utils/responsive';
import { colors } from '../../theme';

const UserSettingsScreen = () => {
  const insets = useSafeAreaInsets();
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
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      // Only allow nickname updates
      await userService.updateProfile({ nickname });
      await updateUser({ ...user, nickname });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
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
      setIsSaving(true);
      await userService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="account" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.card}>
            {isEditingProfile ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nickname</Text>
                  <TextInput
                    value={nickname}
                    onChangeText={setNickname}
                    style={styles.input}
                    mode="outlined"
                    outlineColor="#e0e0e0"
                    activeOutlineColor={colors.primary}
                    disabled={isSaving}
                  />
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setNickname(user?.nickname || '');
                      setIsEditingProfile(false);
                    }}
                    style={[styles.button, styles.cancelButton]}
                    textColor={colors.textSecondary}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveProfile}
                    style={[styles.button, styles.saveButton]}
                    buttonColor={colors.primary}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoItem}>
                  <View style={styles.infoLeft}>
                    <Icon name="account-edit" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Nickname</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.nickname || 'Not set'}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoLeft}>
                    <Icon name="account-circle" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Full Name</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.fullname || 'Not set'}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoLeft}>
                    <Icon name="email" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Email</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                </View>

                <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.infoLeft}>
                    <Icon name="school" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>University</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.university || 'Not set'}</Text>
                </View>

                <Button
                  mode="contained"
                  onPress={() => setIsEditingProfile(true)}
                  style={styles.actionButton}
                  buttonColor={colors.primary}
                  icon="pencil"
                >
                  Edit Nickname
                </Button>
              </>
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="shield-account" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <View style={styles.card}>
            {isChangingPassword ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showCurrentPassword}
                    outlineColor="#e0e0e0"
                    activeOutlineColor={colors.primary}
                    right={<TextInput.Icon 
                      icon={showCurrentPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    />}
                    disabled={isSaving}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showNewPassword}
                    outlineColor="#e0e0e0"
                    activeOutlineColor={colors.primary}
                    right={<TextInput.Icon 
                      icon={showNewPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    />}
                    disabled={isSaving}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry={!showConfirmPassword}
                    outlineColor="#e0e0e0"
                    activeOutlineColor={colors.primary}
                    right={<TextInput.Icon 
                      icon={showConfirmPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />}
                    disabled={isSaving}
                  />
                </View>

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
                    style={[styles.button, styles.cancelButton]}
                    textColor={colors.textSecondary}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleChangePassword}
                    style={[styles.button, styles.saveButton]}
                    buttonColor={colors.primary}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    Change
                  </Button>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => setIsChangingPassword(true)}
                >
                  <View style={styles.actionLeft}>
                    <Icon name="lock-reset" size={20} color={colors.primary} />
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionTitle}>Change Password</Text>
                      <Text style={styles.actionDescription}>Update your account password</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, { borderBottomWidth: 0 }]}
                  onPress={() => router.push('/user-settings/forgot-password')}
                >
                  <View style={styles.actionLeft}>
                    <Icon name="help-circle" size={20} color={colors.primary} />
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionTitle}>Reset Password</Text>
                      <Text style={styles.actionDescription}>Reset password via email verification</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Account Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="tune" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                Alert.alert(
                  'Coming Soon',
                  'Language selection will be available in a future update.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.actionLeft}>
                <Icon name="translate" size={20} color={colors.primary} />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Language</Text>
                  <Text style={styles.actionDescription}>English</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                Alert.alert(
                  'Coming Soon',
                  'Dark/Light mode toggle will be available in a future update.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.actionLeft}>
                <Icon name="theme-light-dark" size={20} color={colors.primary} />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Theme</Text>
                  <Text style={styles.actionDescription}>Light</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    flex: 1,
    fontSize: rf(20),
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginHorizontal: rs(16),
  },
  headerSpacer: {
    width: rs(40),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: rs(20),
  },
  section: {
    marginBottom: rs(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
    paddingHorizontal: rs(4),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    color: colors.primary,
    marginLeft: rs(12),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: rf(14),
    color: colors.textSecondary,
    marginLeft: rs(12),
  },
  infoValue: {
    fontSize: rf(14),
    fontWeight: '500',
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: rs(16),
  },
  inputLabel: {
    fontSize: rf(14),
    fontWeight: '500',
    color: colors.primary,
    marginBottom: rs(8),
  },
  input: {
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: rs(12),
    marginTop: rs(8),
  },
  button: {
    minWidth: rs(100),
  },
  cancelButton: {
    borderColor: '#e0e0e0',
  },
  saveButton: {
    // Custom styles handled by buttonColor prop
  },
  actionButton: {
    marginTop: rs(16),
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionTextContainer: {
    marginLeft: rs(12),
    flex: 1,
  },
  actionTitle: {
    fontSize: rf(16),
    fontWeight: '500',
    color: colors.primary,
  },
  actionDescription: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginTop: rs(2),
  },
  passwordHint: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginBottom: rs(16),
    lineHeight: rf(16),
    fontStyle: 'italic',
  },
});

export default UserSettingsScreen; 