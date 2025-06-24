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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { TextInput, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import LoadingOverlay from '../../components/LoadingOverlay';
import SafeScreen from '../../components/SafeScreen';
import CustomModal from '../../components/CustomModal';
import { useAuth } from '../../context/AuthContext';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';
import { getResponsiveLogoSizes, getResponsiveLogoPositions, getResponsiveSpacing } from '../../utils/logoUtils';
import { Validator } from '../../utils';
import ENV from '../../config/env';

const REMEMBER_ME_KEY = '@unitree_remember_me';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showMultiDeviceModal, setShowMultiDeviceModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);

  // Get responsive logo sizes and positions
  const logoSizes = getResponsiveLogoSizes();
  const logoPositions = getResponsiveLogoPositions();
  const logoSpacing = getResponsiveSpacing();

  // Load saved credentials
  useEffect(() => {
    loadSavedCredentials();
    testConnection();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedData = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedData) {
        const { email: savedEmail, password: savedPassword, rememberMe: savedRememberMe } = JSON.parse(savedData);
        if (savedRememberMe) {
          setEmail(savedEmail || '');
          setPassword(savedPassword || '');
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (email: string, password: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email,
          password,
          rememberMe: true
        }));
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return false;
    }

    const emailValidation = Validator.validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email format');
      return false;
    }

    const passwordValidation = Validator.validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Invalid password');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      // Save credentials if remember me is checked
      await saveCredentials(email.trim().toLowerCase(), password, rememberMe);
      
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      // Check if it's a multi-device login error
      if (err.response?.data?.code === 'ACCOUNT_ALREADY_LOGGED_IN') {
        setShowMultiDeviceModal(true);
      } else {
        // Handle different error message formats
        const errorMessage = err.response?.data?.message || err.message || 'Login failed';
        setError(errorMessage);
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };

  const handleForceLogout = async () => {
    try {
      setForceLogoutLoading(true);
      
      // Import authAPI dynamically to avoid circular dependency
      const { authAPI } = await import('../../config/api');
      
      // Force logout from the other device
      await authAPI.forceLogout(email.trim().toLowerCase(), password);
      
      // Close the modal
      setShowMultiDeviceModal(false);
      
      // Now attempt to login normally
      await handleLogin();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to logout from other device';
      setError(errorMessage);
      setShowMultiDeviceModal(false);
      setShowErrorModal(true);
    } finally {
      setForceLogoutLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...');
      const response = await fetch(`${ENV.API_URL}/api/auth/me`);
              logger.api.debug('Connection test response', { data: { status: response.status } });
      
      if (response.status === 401) {
        // 401 means the server is reachable but we're not authenticated (expected)
        setConnectionStatus('Connected to server successfully');
      } else {
        setConnectionStatus(`Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  // Handle iOS alerts - only show once and reset state
  useEffect(() => {
    if (Platform.OS === 'ios' && showErrorModal) {
      Alert.alert(
        'Login Failed',
        error,
        [{ text: 'OK', onPress: () => setShowErrorModal(false) }],
        { cancelable: false }
      );
      // Immediately reset to prevent double alerts
      setShowErrorModal(false);
    }
  }, [showErrorModal, error]);

  useEffect(() => {
    if (Platform.OS === 'ios' && showMultiDeviceModal) {
      Alert.alert(
        'Account Already Logged In',
        'Your account is currently logged in on another device. Would you like to logout from the other device to continue?',
        [
          { text: 'Cancel', onPress: () => setShowMultiDeviceModal(false) },
          { 
            text: forceLogoutLoading ? 'Logging out...' : 'Logout Other Device', 
            onPress: handleForceLogout 
          }
        ],
        { cancelable: true }
      );
      // Immediately reset to prevent double alerts
      setShowMultiDeviceModal(false);
    }
  }, [showMultiDeviceModal, forceLogoutLoading]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" translucent />
      <LoadingOverlay visible={loading} />

      {/* Error Modal - Android only */}
      {Platform.OS !== 'ios' && (
        <CustomModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Login Failed"
          message={error}
          type="error"
          buttons={[
            {
              text: 'OK',
              onPress: () => setShowErrorModal(false),
              style: 'primary'
            }
          ]}
        />
      )}

      {/* Multi-Device Login Modal - Android only */}
      {Platform.OS !== 'ios' && (
        <CustomModal
          visible={showMultiDeviceModal}
          onClose={() => setShowMultiDeviceModal(false)}
          title="Account Already Logged In"
          message="Your account is currently logged in on another device. Would you like to logout from the other device to continue?"
          type="warning"
          buttons={[
            {
              text: 'Cancel',
              onPress: () => setShowMultiDeviceModal(false),
            },
            {
              text: forceLogoutLoading ? 'Logging out...' : 'Logout Other Device',
              onPress: handleForceLogout,
              style: 'primary'
            }
          ]}
        />
      )}

      {/* Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.headerSection}
      >
        {/* Extended status bar background for iOS */}
        <View style={styles.statusBarBackground} />
        
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

      {/* Login Form Section */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={styles.loginSection}
        >
            <Text style={styles.loginTitle}>Login</Text>
            
            {/* Mascot */}
            <View style={[styles.mascotContainer, logoPositions.mascotContainer]}>
                <Image
                  source={require('../../assets/mascots/Unitree - Mascot-1.png')}
                  style={[styles.mascotImage, logoSizes.mascot]}
                  resizeMode="contain"
                />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={styles.inputContent}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
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

            {/* Remember Me and Forgot Password Row */}
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity 
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.customCheckbox,
                  { backgroundColor: rememberMe ? '#fff' : 'transparent' }
                ]}>
                  {rememberMe && (
                    <Icon name="check" size={14} color="#50AF27" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Connection Status Debug */}
      {connectionStatus && ENV.DEBUG_MODE && (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionStatusText}>{connectionStatus}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main Layout Styles
  container: {
    flex: 1,
    backgroundColor: '#B7DDE6',
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header Section Styles
  headerSection: {
    backgroundColor: '#B7DDE6',
    paddingBottom: rs(80),
    // Extend to cover status bar on iOS
    marginTop: Platform.OS === 'ios' ? -50 : 0,
    paddingTop: Platform.OS === 'ios' ? rs(70) : rs(20),
  },
  statusBarBackground: {
    // Remove this as SafeAreaView with edges=[] handles it
    height: 0,
  },
  logosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    marginTop: rs(20),
  },
  greenwichLogoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  greenwichLogo: {
    resizeMode: 'contain',
  },
  unitreeLogoContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  unitreeLogo: {
    resizeMode: 'contain',
  },
  mascotContainer: {
    position: 'absolute',
    right: rs(20),
    top: rs(-60),
    zIndex: 10,
  },
  mascotImage: {
    resizeMode: 'contain',
  },

  // Login Section Styles
  loginSection: {
    flex: 1,
    backgroundColor: '#98D56D',
    borderTopLeftRadius: rs(30),
    borderTopRightRadius: rs(30),
    paddingHorizontal: rs(24),
    paddingTop: rs(32),
    paddingBottom: rs(20),
    minHeight: '100%',
  },
  loginTitle: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(20),
  },
  inputContainer: {
    marginBottom: rs(20),
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
    position: 'relative',
  },
  inputIcon: {
    marginRight: rs(12),
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: rf(16),
    height: 56,
    color: '#000',
  },
  inputContent: {
    paddingHorizontal: 0,
    color: '#000',
  },
  eyeIcon: {
    padding: rs(8),
    position: 'absolute',
    right: 8,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(20),
  },
    rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    color: '#fff',
    fontSize: rf(14),
    marginLeft: rs(8),
  },
  rememberMeCheckbox: {
    borderWidth: 1,
    borderColor: 'red',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    height: 39,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: rf(14),
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#50AF27',
    paddingVertical: rs(16),
    borderRadius: rs(12),
    alignItems: 'center',
    marginBottom: rs(14),
  },
  loginButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: 'bold',
  },

  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: rf(14),
  },
  signUpLink: {
    color: '#fff',
    fontSize: rf(14),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  connectionStatus: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: rs(8),
    zIndex: 1000,
  },
  connectionStatusText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: rf(12),
  },
}); 