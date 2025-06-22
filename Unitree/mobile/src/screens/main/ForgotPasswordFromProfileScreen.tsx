import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import ENV from '../../config/env';
import { rf, rs } from '../../utils/responsive';
import { colors } from '../../theme';
import { Validator } from '../../utils';

const ForgotPasswordFromProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Step management: 1 = verification code, 2 = new password, 3 = success
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 - Verification code
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [codeInitiallySent, setCodeInitiallySent] = useState(false);

  // Step 2 - New password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Countdown effect for resend button
  useEffect(() => {
    let interval: any = null;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  // Send initial verification code when component mounts
  useEffect(() => {
    if (!codeInitiallySent && user?.email) {
      handleSendResetCode();
    }
  }, [user, codeInitiallySent]);

  const validatePassword = (password: string) => {
    const passwordValidation = Validator.validatePassword(password);
    return passwordValidation.isValid ? null : passwordValidation.error;
  };

  // Send password reset code (using logged-in user's email)
  const handleSendResetCode = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    try {
      setResendLoading(true);
      setVerificationError('');

      const response = await fetch(`${ENV.API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }

      setCodeInitiallySent(true);
      setResendCountdown(60);
      
      if (!codeInitiallySent) {
        Alert.alert('Success', 'Verification code sent to your email');
      } else {
        Alert.alert('Success', 'New verification code sent to your email');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to send reset code');
      Alert.alert('Error', err.message || 'Failed to send reset code');
    } finally {
      setResendLoading(false);
    }
  };

  // Verify reset code
  const handleVerifyResetCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setVerificationError('Verification code must be 6 digits');
      return;
    }

    try {
      setVerificationLoading(true);
      setVerificationError('');

      const response = await fetch(`${ENV.API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user?.email?.toLowerCase(),
          code: verificationCode.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Move to password step
      setCurrentStep(2);
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setResetError('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setResetError(passwordError);
      return;
    }

    try {
      setResetLoading(true);
      setResetError('');

      const response = await fetch(`${ENV.API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user?.email?.toLowerCase(),
          code: verificationCode.trim(),
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      // Move to success step
      setCurrentStep(3);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const renderVerificationStep = () => (
    <View style={styles.card}>
      <View style={styles.stepHeader}>
        <Icon name="email-check" size={24} color={colors.primary} />
        <Text style={styles.stepTitle}>Enter Verification Code</Text>
      </View>
      
      <Text style={styles.stepDescription}>
        We've sent a 6-digit verification code to {user?.email}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Verification Code</Text>
        <TextInput
          value={verificationCode}
          onChangeText={(text) => {
            setVerificationCode(text);
            setVerificationError('');
          }}
          style={styles.input}
          mode="outlined"
          placeholder="Enter 6-digit code"
          keyboardType="numeric"
          maxLength={6}
          outlineColor="#e0e0e0"
          activeOutlineColor={colors.primary}
          error={!!verificationError}
          disabled={verificationLoading}
        />
        {verificationError ? (
          <Text style={styles.errorText}>{verificationError}</Text>
        ) : null}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleSendResetCode}
          disabled={resendCountdown > 0 || resendLoading}
          style={styles.resendButton}
          textColor={colors.primary}
          loading={resendLoading}
        >
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
        </Button>

        <Button
          mode="contained"
          onPress={handleVerifyResetCode}
          style={styles.primaryButton}
          buttonColor={colors.primary}
          loading={verificationLoading}
          disabled={verificationLoading || !verificationCode.trim()}
        >
          Verify Code
        </Button>
      </View>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.card}>
      <View style={styles.stepHeader}>
        <Icon name="lock-reset" size={24} color={colors.primary} />
        <Text style={styles.stepTitle}>Set New Password</Text>
      </View>
      
      <Text style={styles.stepDescription}>
        Enter your new password below
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setResetError('');
          }}
          style={styles.input}
          mode="outlined"
          secureTextEntry={!showNewPassword}
          outlineColor="#e0e0e0"
          activeOutlineColor={colors.primary}
          right={<TextInput.Icon 
            icon={showNewPassword ? "eye-off" : "eye"} 
            onPress={() => setShowNewPassword(!showNewPassword)}
          />}
          disabled={resetLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setResetError('');
          }}
          style={styles.input}
          mode="outlined"
          secureTextEntry={!showConfirmPassword}
          outlineColor="#e0e0e0"
          activeOutlineColor={colors.primary}
          right={<TextInput.Icon 
            icon={showConfirmPassword ? "eye-off" : "eye"} 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />}
          disabled={resetLoading}
        />
      </View>

      <Text style={styles.passwordHint}>
        Password must be 8-16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.
      </Text>

      {resetError ? (
        <Text style={styles.errorText}>{resetError}</Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => setCurrentStep(1)}
          style={styles.backButton}
          textColor={colors.textSecondary}
          disabled={resetLoading}
        >
          Back
        </Button>

        <Button
          mode="contained"
          onPress={handleResetPassword}
          style={styles.primaryButton}
          buttonColor={colors.primary}
          loading={resetLoading}
          disabled={resetLoading || !newPassword || !confirmPassword}
        >
          Reset Password
        </Button>
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.card}>
      <View style={styles.successContainer}>
        <Icon name="check-circle" size={64} color={colors.primary} />
        <Text style={styles.successTitle}>Password Reset Successfully!</Text>
        <Text style={styles.successDescription}>
          Your password has been updated. You can now use your new password to log in.
        </Text>

        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.successButton}
          buttonColor={colors.primary}
        >
          Done
        </Button>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]} />
            <View style={[styles.progressStep, currentStep >= 2 && styles.progressStepActive]} />
            <View style={[styles.progressStep, currentStep >= 3 && styles.progressStepActive]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep} of 3
          </Text>
        </View>

        {/* Content based on current step */}
        {currentStep === 1 && renderVerificationStep()}
        {currentStep === 2 && renderPasswordStep()}
        {currentStep === 3 && renderSuccessStep()}
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
    color: colors.text,
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
  progressContainer: {
    marginBottom: rs(32),
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  progressStep: {
    width: rs(60),
    height: rs(4),
    backgroundColor: '#e0e0e0',
    marginHorizontal: rs(4),
    borderRadius: rs(2),
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: rf(12),
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    padding: rs(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: rs(16),
  },
  stepTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: rs(8),
  },
  stepDescription: {
    fontSize: rf(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: rs(24),
    lineHeight: rf(20),
  },
  inputContainer: {
    marginBottom: rs(16),
  },
  inputLabel: {
    fontSize: rf(14),
    fontWeight: '500',
    color: colors.text,
    marginBottom: rs(8),
  },
  input: {
    backgroundColor: '#fff',
  },
  passwordHint: {
    fontSize: rf(12),
    color: colors.textSecondary,
    marginBottom: rs(16),
    lineHeight: rf(16),
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: rf(12),
    color: '#FF5722',
    marginTop: rs(4),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(12),
    marginTop: rs(8),
  },
  resendButton: {
    flex: 1,
    borderColor: colors.primary,
  },
  backButton: {
    flex: 1,
    borderColor: '#e0e0e0',
  },
  primaryButton: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: rs(16),
    marginBottom: rs(8),
    textAlign: 'center',
  },
  successDescription: {
    fontSize: rf(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: rs(32),
    lineHeight: rf(20),
  },
  successButton: {
    minWidth: rs(120),
  },
});

export default ForgotPasswordFromProfileScreen; 