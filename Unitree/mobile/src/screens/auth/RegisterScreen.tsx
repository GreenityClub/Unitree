import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Keyboard,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import LoadingOverlay from '../../components/LoadingOverlay';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../context/AuthContext';
import ENV from '../../config/env';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';
import { getResponsiveLogoSizes, getResponsiveLogoPositions, getResponsiveSpacing } from '../../utils/logoUtils';
import { Validator } from '../../utils';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  // Get responsive logo sizes and positions
  const logoSizes = getResponsiveLogoSizes();
  const logoPositions = getResponsiveLogoPositions();
  const logoSpacing = getResponsiveSpacing();

  // Refs for auto-scroll functionality
  const scrollViewRef = useRef<ScrollView>(null);
  const nicknameInputRef = useRef<View>(null);
  const universityInputRef = useRef<View>(null);
  const passwordInputRef = useRef<View>(null);
  const confirmPasswordInputRef = useRef<View>(null);
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1 for email, 2 for verification code, 3 for complete registration
  
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
  
  // Step 3 - Complete registration
  const [studentData, setStudentData] = useState<any>(null);
  const [formData, setFormData] = useState({
    nickname: '',
    password: '',
    confirmPassword: '',
    university: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUniversityModal, setShowUniversityModal] = useState(false);

  const universities = ['Greenwich University Hanoi', 'Greenwich University Ho Chi Minh City', 'Greenwich University Da Nang', 'Greenwich University Can Tho'];

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

  // Keyboard event listeners for auto-scroll
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setKeyboardVisible(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-scroll function to bring active input above keyboard
  const scrollToInput = (inputRef: React.RefObject<View | null>) => {
    if (inputRef.current && scrollViewRef.current && keyboardVisible) {
      const screenHeight = Dimensions.get('window').height;
      const availableHeight = screenHeight - keyboardHeight;
      
      inputRef.current.measureInWindow((x, y, width, height) => {
        // Calculate if the input is hidden behind keyboard
        const inputBottom = y + height;
        const margin = 20; // Extra margin above keyboard
        
        if (inputBottom > availableHeight - margin) {
          const scrollOffset = inputBottom - availableHeight + margin + 50; // Extra padding
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollOffset),
            animated: true,
          });
        }
      });
    }
  };

  const validatePassword = (password: string) => {
    const passwordValidation = Validator.validatePassword(password);
    return passwordValidation.isValid ? null : passwordValidation.error;
  };

  // Step 1: Send verification code
  const handleSendVerificationCode = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email');
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

      const response = await fetch(`${ENV.API_URL}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      // Move to verification code step
      setCurrentStep(2);
      setResendCountdown(60); // 60 seconds before allowing resend
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send verification code');
    } finally {
      setEmailLoading(false);
    }
  };

  // Step 2: Verify email code
  const handleVerifyCode = async () => {
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

      const response = await fetch(`${ENV.API_URL}/api/auth/verify-email-code`, {
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

      // Store student data and move to registration step
      setStudentData(data.studentData);
      setCurrentStep(3);
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      setVerificationError('');

      const response = await fetch(`${ENV.API_URL}/api/auth/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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

  // Step 3: Complete registration
  const handleRegister = async () => {
    // Validate form
    if (!studentData?.full_name || !studentData?.student_id || !formData.nickname || !formData.password || !formData.confirmPassword || !formData.university) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const registerData = {
        fullname: studentData.full_name, // Use full name from student data
        nickname: formData.nickname,
        email: studentData.email || email,
        password: formData.password,
        studentId: studentData.student_id, // Use student ID from student data
        university: formData.university,
      };
      
      await register(registerData);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const selectUniversity = (university: string) => {
    updateFormData('university', university);
    setShowUniversityModal(false);
  };



  const goBackToEmailEntry = () => {
    setCurrentStep(1);
    setEmail('');
    setVerificationCode('');
    setStudentData(null);
    setFormData({
      nickname: '',
      password: '',
      confirmPassword: '',
      university: '',
    });
    setEmailError('');
    setVerificationError('');
    setError('');
    setResendCountdown(0);
  };

  const goBackToCodeVerification = () => {
    setCurrentStep(2);
    setStudentData(null);
    setFormData({
      nickname: '',
      password: '',
      confirmPassword: '',
      university: '',
    });
    setError('');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeScreen backgroundColor="#B7DDE6">
      <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" />
      <LoadingOverlay visible={emailLoading || verificationLoading || loading} />

      {/* Fixed Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.headerSection}
      >
        <View style={styles.statusBar} />
        
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

      {/* Scrollable Content Section */}
      <Animated.View 
        entering={FadeInUp.delay(400)}
        style={styles.contentSection}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.titleText}>Join UniTree!</Text>
            <Text style={styles.subtitleText}>
              {currentStep === 1 
                ? "Enter your email address to get started"
                : currentStep === 2
                ? "Enter the verification code sent to your email"
                : "Complete your registration"
              }
            </Text>
          </View>
          
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              
              {currentStep === 1 ? (
                // Step 1: Email Entry
                <>
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your.email@example.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.textInput}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        contentStyle={styles.inputContent}
                      />
                    </View>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    onPress={handleSendVerificationCode}
                    style={styles.signUpButton}
                    disabled={emailLoading}
                  >
                    <Text style={styles.signUpButtonText}>
                      {emailLoading ? 'Sending...' : 'Send Verification Code'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : currentStep === 2 ? (
                // Step 2: Verification Code Entry
                <>
                  {verificationError ? <Text style={styles.errorText}>{verificationError}</Text> : null}

                  {/* Email Display */}
                  <View style={styles.emailDisplayContainer}>
                    <Text style={styles.emailDisplayText}>
                      Verification code sent to:
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
                    onPress={handleVerifyCode}
                    style={styles.signUpButton}
                    disabled={verificationLoading}
                  >
                    <Text style={styles.signUpButtonText}>
                      {verificationLoading ? 'Verifying...' : 'Verify Code'}
                    </Text>
                  </TouchableOpacity>

                  {/* Resend Code Button */}
                  <TouchableOpacity
                    onPress={handleResendCode}
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
                </>
              ) : (
                // Step 3: Complete Registration
                <>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {/* Back Button */}
                  <TouchableOpacity 
                    onPress={goBackToCodeVerification}
                    style={styles.backButton}
                  >
                    <Icon name="arrow-left" size={20} color="#fff" />
                    <Text style={styles.backButtonText}>Back to Verification</Text>
                  </TouchableOpacity>

                  {/* Student Information Section */}
                  {studentData && (
                    <View style={styles.studentInfoSection}>
                      <Text style={styles.sectionTitle}>Student Information</Text>
                      
                      {/* Email (Read-only) */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                          <Icon name="email-outline" size={20} color="#999" style={styles.inputIcon} />
                          <Text style={styles.readOnlyText}>{studentData?.email}</Text>
                        </View>
                      </View>

                      {/* Full Name (Read-only) */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                          <Icon name="account-outline" size={20} color="#999" style={styles.inputIcon} />
                          <Text style={styles.readOnlyText}>{studentData.full_name}</Text>
                        </View>
                      </View>

                      {/* Student ID (Read-only) */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Student ID</Text>
                        <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                          <Icon name="card-account-details-outline" size={20} color="#999" style={styles.inputIcon} />
                          <Text style={styles.readOnlyText}>{studentData.student_id}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Registration Form Section */}
                  <View style={styles.additionalInfoSection}>
                    <Text style={styles.sectionTitle}>Registration Information</Text>

                    {/* Nickname Input */}
                    <View ref={nicknameInputRef} style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nickname *</Text>
                      <View style={styles.inputWrapper}>
                        <Icon name="account-circle-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                          value={formData.nickname}
                          onChangeText={(value) => updateFormData('nickname', value)}
                          onFocus={() => setTimeout(() => scrollToInput(nicknameInputRef), 100)}
                          placeholder="Enter your nickname"
                          style={styles.textInput}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          contentStyle={styles.inputContent}
                        />
                      </View>
                    </View>

                    {/* University Dropdown */}
                    <View ref={universityInputRef} style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>University *</Text>
                      <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => {
                          setTimeout(() => scrollToInput(universityInputRef), 100);
                          setShowUniversityModal(true);
                        }}
                      >
                        <Icon name="school-outline" size={20} color="#666" style={styles.inputIcon} />
                        <View style={styles.dropdownTextContainer}>
                          <Text style={[styles.dropdownText, !formData.university && styles.placeholderText]}>
                            {formData.university || 'Select your university'}
                          </Text>
                        </View>
                        <Icon name="chevron-down" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>

                    {/* Password Input */}
                    <View ref={passwordInputRef} style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Password *</Text>
                      <View style={styles.inputWrapper}>
                        <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                          value={formData.password}
                          onChangeText={(value) => updateFormData('password', value)}
                          onFocus={() => setTimeout(() => scrollToInput(passwordInputRef), 100)}
                          placeholder="Create a password"
                          secureTextEntry={!showPassword}
                          style={styles.textInput}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          contentStyle={styles.inputContent}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          <Icon 
                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
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

                    {/* Confirm Password Input */}
                    <View ref={confirmPasswordInputRef} style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Confirm Password *</Text>
                      <View style={styles.inputWrapper}>
                        <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                          value={formData.confirmPassword}
                          onChangeText={(value) => updateFormData('confirmPassword', value)}
                          onFocus={() => setTimeout(() => scrollToInput(confirmPasswordInputRef), 100)}
                          placeholder="Confirm your password"
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
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    onPress={handleRegister}
                    style={styles.signUpButton}
                    disabled={loading}
                  >
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                  </TouchableOpacity>
                </>
              )}



              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleLogin}>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Mascot - Positioned to appear on top */}
      <View style={[styles.mascotContainer, logoPositions.registerMascotContainer]}>
        <Image
          source={require('../../assets/mascots/Unitree - Mascot-2.png')}
          style={[styles.mascotImage, logoSizes.mascot]}
          resizeMode="contain"
        />
      </View>

      {/* University Selection Modal */}
      <Modal
        visible={showUniversityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUniversityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select University</Text>
            {universities.map((university, index) => (
              <TouchableOpacity
                key={index}
                style={styles.universityOption}
                onPress={() => selectUniversity(university)}
              >
                <Text style={styles.universityOptionText}>{university}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUniversityModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7DDE6',
  },
  statusBar: {
    height: 20,
  },
  
  // Header Section Styles
  headerSection: {
    backgroundColor: '#B7DDE6',
    paddingBottom: rs(80),

    minHeight: rs(150),
  },
  logosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  welcomeSection: {
    alignItems: 'flex-start',
    marginTop: -10,
  },
  titleText: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(5),
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: rf(16),
    color: '#fff',
    opacity: 0.9,
    textAlign: 'left',
    lineHeight: rf(24),
  },

  // Content Section Styles
  contentSection: {
    flex: 1,
    backgroundColor: '#98D56D',
    borderTopLeftRadius: rs(30),
    borderTopRightRadius: rs(30),
    paddingHorizontal: rs(24),
    paddingTop: rs(32),
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    marginTop: rs(20),
    borderRadius: rs(16),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: rs(90), // Extra padding for navigation
  },
  content: {
    // Remove flex: 1 to allow natural content height
  },
  mascotContainer: {
    position: 'absolute',
    right: 20,
    top: 125,
    zIndex: 9999,
  },
  mascotImage: {
    width: 160,
    height: 160,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(5),
    padding: rs(8),
  },
  backButtonText: {
    color: '#fff',
    fontSize: rf(14),
    marginLeft: rs(8),
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(16),
  },
  studentInfoSection: {
    marginBottom: rs(24),
  },
  additionalInfoSection: {
    marginBottom: rs(8),
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputContainer: {
    marginBottom: rs(16),
  },
  inputLabel: {
    fontSize: rf(14),
    color: '#fff',
    marginBottom: rs(6),
    fontWeight: 'bold',
    marginTop: rs(10),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    position: 'relative',
  },
  readOnlyWrapper: {
    backgroundColor: '#f0f0f0',
    minHeight: 50,
  },
  readOnlyText: {
    flex: 1,
    fontSize: rf(14),
    color: '#666',
    paddingVertical: rs(16),
  },
  inputIcon: {
    marginRight: rs(12),
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: rf(14),
    height: 50,
  },
  inputContent: {
    paddingHorizontal: 0,
  },
  eyeIcon: {
    padding: rs(8),
    position: 'absolute',
    right: 8,
  },
  signUpButton: {
    backgroundColor: '#50AF27',
    paddingVertical: rs(14),
    borderRadius: rs(12),
    alignItems: 'center',
    marginTop: rs(8),
    marginBottom: rs(20),
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: 'bold',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: rf(14),
  },
  loginLink: {
    color: '#fff',
    fontSize: rf(14),
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  dropdownTextContainer: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: rf(14),
    color: '#666',
    paddingLeft: rs(16),
  },
  placeholderText: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: rs(20),
    borderRadius: rs(10),
    width: '80%',
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    marginBottom: rs(10),
  },
  universityOption: {
    padding: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  universityOptionText: {
    fontSize: rf(14),
    color: '#666',
  },
  cancelButton: {
    padding: rs(10),
    backgroundColor: '#FFA79D',
    borderRadius: rs(5),
    alignItems: 'center',
    marginTop: rs(10),
  },
  cancelButtonText: {
    fontSize: rf(14),
    fontWeight: 'bold',
    color: '#fff',
  },
  passwordHint: {
    color: '#fff',
    fontSize: rf(12),
    marginBottom: rs(16),
    opacity: 0.8,
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
}); 