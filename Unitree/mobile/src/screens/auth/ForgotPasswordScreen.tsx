import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
} from 'react-native-reanimated';
import { TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import LoadingOverlay from '../../components/LoadingOverlay';
import SafeScreen from '../../components/SafeScreen';
import ENV from '../../config/env';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';
import { getResponsiveLogoSizes, getResponsiveLogoPositions, getResponsiveSpacing } from '../../utils/logoUtils';
import { Validator } from '../../utils';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Get responsive logo sizes and positions
  const logoSizes = getResponsiveLogoSizes();
  const logoPositions = getResponsiveLogoPositions();
  const logoSpacing = getResponsiveSpacing();

  // Step management: 1 = email entry, 2 = verification code, 3 = new password, 4 = success
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 - Email entry
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2 - Verification code
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Step 3 - New password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetToken, setResetToken] = useState('');

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

  const validatePassword = (password: string) => {
    const passwordValidation = Validator.validatePassword(password);
    return passwordValidation.isValid ? null : passwordValidation.error;
  };

  // Step 1: Send password reset code
  const handleSendResetCode = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    const emailValidation = Validator.validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Invalid email format');
      return;
    }

    try {
      setEmailLoading(true);
      setEmailError('');

      const response = await fetch(`${ENV.API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }

      // Move to verification code step
      setCurrentStep(2);
      setResendCountdown(60); // 60 seconds before allowing resend
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send reset code');
    } finally {
      setEmailLoading(false);
    }
  };

  // Step 2: Verify reset code
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
          email: email.trim().toLowerCase(),
          code: verificationCode.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Move to password step (no reset token needed)
      setCurrentStep(3);
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Step 3: Reset password
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
          email: email.trim().toLowerCase(),
          code: verificationCode.trim(),
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      // Move to success step
      setCurrentStep(4);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  // Resend reset code
  const handleResendResetCode = async () => {
    try {
      setResendLoading(true);
      setVerificationError('');

      const response = await fetch(`${ENV.API_URL}/api/auth/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          type: 'password_reset'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setResendCountdown(60); // Reset countdown
      setVerificationCode(''); // Clear current input
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const goBackToEmailEntry = () => {
    setCurrentStep(1);
    setEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setEmailError('');
    setVerificationError('');
    setResetError('');
    setResendCountdown(0);
  };

  const goBackToCodeVerification = () => {
    setCurrentStep(2);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeScreen backgroundColor="#B7DDE6">
      <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" />
      <LoadingOverlay visible={emailLoading || verificationLoading || resetLoading} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.headerSection}
          >
            {/* <View style={styles.statusBar} /> */}
            
                    {/* Logos Container - Both logos on same line */}
        <View style={[styles.logosContainer, logoPositions.logosContainer]}>
          <View style={[styles.greenwichLogoContainer, logoPositions.greenwichLogoContainer]}>
            <Image
              source={require('../../assets/logos/greenwich - logo.png')}
              style={[styles.greenwichLogo, logoSizes.greenwichLogo]}
              resizeMode="contain"
            />
          </View>
          
          <View style={[styles.unitreeLogoContainer, logoPositions.unitreeLogoContainer]}>
            <Image
              source={require('../../assets/logos/unitree - logo.png')}
              style={[styles.unitreeLogo, logoSizes.unitreeLogo]}
              resizeMode="contain"
            />
          </View>
        </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            entering={FadeInUp.delay(400)}
            style={styles.formSection}
          >
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.titleText}>
                {currentStep === 1 ? 'Reset Password' :
                 currentStep === 2 ? 'Enter Verification Code' :
                 currentStep === 3 ? 'Set New Password' : 'Password Reset Complete'}
              </Text>
              <Text style={styles.subtitleText}>
                {currentStep === 1 ? 'Enter your email and we\'ll send a reset code' :
                 currentStep === 2 ? 'Enter the 6-digit code sent to your email' :
                 currentStep === 3 ? 'Create a new secure password' : 'Your password has been reset successfully'}
              </Text>
            </View>

            {/* Mascot */}
            <View style={[styles.mascotContainer, logoPositions.mascotContainer]}>
              <Image
                source={require('../../assets/mascots/Unitree - Mascot-3.png')}
                style={[styles.mascotImage, logoSizes.mascot]}
                resizeMode="contain"
              />
            </View>

            {currentStep === 1 ? (
              // Step 1: Email Entry
              <Animated.View
                entering={FadeInDown}
                exiting={FadeOutDown}
                style={styles.form}
              >
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email address"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.textInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      contentStyle={styles.inputContent}
                    />
                  </View>
                </View>

                {/* Send Code Button */}
                <TouchableOpacity
                  onPress={handleSendResetCode}
                  style={styles.resetButton}
                  disabled={emailLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {emailLoading ? 'Sending...' : 'Send Reset Code'}
                  </Text>
                </TouchableOpacity>

                {/* Back to Login Link */}
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.backContainer}
                >
                  <Icon name="arrow-left" size={16} color="#fff" style={styles.backIcon} />
                  <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : currentStep === 2 ? (
              // Step 2: Verification Code Entry
              <Animated.View
                entering={FadeInDown}
                style={styles.form}
              >
                {verificationError ? <Text style={styles.errorText}>{verificationError}</Text> : null}

                {/* Email Display */}
                <View style={styles.emailDisplayContainer}>
                  <Text style={styles.emailDisplayText}>
                    Reset code sent to:
                  </Text>
                  <Text style={styles.emailDisplayValue}>{email}</Text>
                  <TouchableOpacity onPress={goBackToEmailEntry}>
                    <Text style={styles.changeEmailText}>Change email</Text>
                  </TouchableOpacity>
                </View>

                {/* Verification Code Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="shield-check-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      placeholder="000000"
                      keyboardType="numeric"
                      maxLength={6}
                      style={styles.textInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      contentStyle={styles.inputContent}
                    />
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleVerifyResetCode}
                  style={styles.resetButton}
                  disabled={verificationLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {verificationLoading ? 'Verifying...' : 'Verify Code'}
                  </Text>
                </TouchableOpacity>

                {/* Resend Code Button */}
                <TouchableOpacity
                  onPress={handleResendResetCode}
                  style={[styles.resendButton, (resendCountdown > 0 || resendLoading) && styles.resendButtonDisabled]}
                  disabled={resendCountdown > 0 || resendLoading}
                >
                  <Text style={[styles.resendButtonText, (resendCountdown > 0 || resendLoading) && styles.resendButtonTextDisabled]}>
                    {resendLoading 
                      ? 'Sending...' 
                      : resendCountdown > 0 
                      ? `Resend in ${resendCountdown}s`
                      : 'Resend Code'
                    }
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : currentStep === 3 ? (
              // Step 3: New Password Entry
              <Animated.View
                entering={FadeInDown}
                style={styles.form}
              >
                {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}

                {/* Back Button */}
                <TouchableOpacity 
                  onPress={goBackToCodeVerification}
                  style={styles.backButton}
                >
                  <Icon name="arrow-left" size={20} color="#fff" />
                  <Text style={styles.backButtonText}>Back to Verification</Text>
                </TouchableOpacity>

                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      style={styles.textInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      contentStyle={styles.inputContent}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Icon 
                        name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
                      style={styles.textInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      contentStyle={styles.inputContent}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Icon 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Requirements */}
                <Text style={styles.passwordHint}>
                  Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
                </Text>

                {/* Reset Password Button */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={styles.resetButton}
                  disabled={resetLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              // Step 4: Success
              <Animated.View
                entering={FadeInDown}
                style={styles.successContainer}
              >
                <View style={styles.successIconContainer}>
                  <Icon name="check-circle" size={64} color="#fff" />
                </View>
                <Text style={styles.successText}>
                  Password Reset Complete!
                </Text>
                <Text style={styles.successSubtext}>
                  Your password has been reset successfully.{'\n'}
                  Redirecting to login...
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7DDE6',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  statusBar: {
    height: 20,
  },
  
  // Header Section Styles
  headerSection: {
    backgroundColor: '#B7DDE6',
    paddingTop: rs(20),
    paddingBottom: rs(80),
    position: 'relative',
    minHeight: rs(150),
  },
  logosContainer: {
    // Styles will come from logoPositions
  },
  unitreeLogoContainer: {
    // Styles will come from logoPositions
  },
  unitreeLogo: {
    // Styles will come from logoSizes
  },
  greenwichLogoContainer: {
    // Styles will come from logoPositions
  },
  greenwichLogo: {
    // Styles will come from logoSizes
  },
  mascotContainer: {
    position: 'absolute',
    right: 20,
    top: -110,
    zIndex: 1,
  },
  mascotImage: {
    width: 160,
    height: 160,
  },
  welcomeSection: {
    alignItems: 'flex-start',
    paddingHorizontal: rs(0),
    marginTop: rs(40),
  },
  titleText: {
    fontSize: rf(36),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(5),
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: rf(16),
    color: '#fff',
    opacity: 0.9,
    textAlign: 'left',
    lineHeight: rf(24),
  },

  // Form Section Styles
  formSection: {
    backgroundColor: '#98D56D',
    minHeight: '100%',
    borderTopLeftRadius: rs(30),
    borderTopRightRadius: rs(30),
    paddingHorizontal: rs(24),
    paddingTop: rs(32),
    paddingBottom: rs(40),
  },
  form: {
    marginTop: rs(60),
  },
  errorText: {
    color: '#fff',
    fontSize: rf(14),
    marginBottom: rs(16),
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: rs(8),
    borderRadius: rs(8),
  },
  inputContainer: {
    marginBottom: rs(24),
  },
  inputLabel: {
    fontSize: rf(16),
    color: '#fff',
    marginBottom: rs(8),
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
  },
  inputIcon: {
    marginRight: rs(12),
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: rf(16),
    height: 56,
  },
  inputContent: {
    paddingHorizontal: 0,
  },
  resetButton: {
    backgroundColor: '#50AF27',
    paddingVertical: rs(16),
    borderRadius: rs(12),
    alignItems: 'center',
    marginBottom: rs(24),
  },
  resetButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: 'bold',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(16),
  },
  backIcon: {
    marginRight: rs(8),
  },
  backText: {
    color: '#fff',
    fontSize: rf(14),
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: rs(40),
    paddingHorizontal: rs(20),
  },
  successIconContainer: {
    marginBottom: rs(24),
  },
  successText: {
    fontSize: rf(24),
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: rs(16),
  },
  successSubtext: {
    fontSize: rf(16),
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: rf(24),
  },
  emailDisplayContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: rs(16),
    borderRadius: rs(12),
    marginBottom: rs(20),
    alignItems: 'center',
  },
  emailDisplayText: {
    color: '#fff',
    fontSize: rf(14),
    opacity: 0.8,
    marginBottom: rs(4),
  },
  emailDisplayValue: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: 'bold',
    marginBottom: rs(8),
  },
  changeEmailText: {
    color: '#fff',
    fontSize: rf(14),
    textDecorationLine: 'underline',
    opacity: 0.9,
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: rs(12),
    borderRadius: rs(12),
    alignItems: 'center',
    marginTop: rs(16),
  },
  resendButtonDisabled: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: rf(14),
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  eyeIcon: {
    padding: rs(8),
    position: 'absolute',
    right: 8,
  },
  passwordHint: {
    color: '#fff',
    fontSize: rf(12),
    marginBottom: rs(16),
    opacity: 0.8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    borderRadius: rs(8),
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: rf(14),
    marginLeft: rs(8),
    fontWeight: '500',
  },
}); 