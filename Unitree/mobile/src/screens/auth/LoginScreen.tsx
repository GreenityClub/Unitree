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
} from 'react-native-reanimated';
import { TextInput, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import LoadingOverlay from '../../components/LoadingOverlay';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../context/AuthContext';
import { rf, rs, wp, hp, deviceValue, getImageSize, SCREEN_DIMENSIONS } from '../../utils/responsive';
import { Validator } from '../../utils';

const REMEMBER_ME_KEY = '@unitree_remember_me';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials
  useEffect(() => {
    loadSavedCredentials();
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

    const emailValidation = Validator.validateUniversityEmail(email);
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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Google sign-in temporarily disabled
    setError('Google sign-in is currently unavailable. Please use email/password login.');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };

  return (
    <SafeScreen backgroundColor="#B7DDE6">
      <StatusBar barStyle="light-content" backgroundColor="#B7DDE6" />
      <LoadingOverlay visible={loading} />

      {/* Header Section */}
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.headerSection}
      >
        <View style={styles.statusBar} />
        
        {/* Greenwich Logo - Top Right */}
        <View style={styles.greenwichLogoContainer}>
          <Image
            source={require('../../assets/logos/greenwich - logo.png')}
            style={styles.greenwichLogo}
            resizeMode="contain"
          />
        </View>

        {/* Main Logo Section - Left Aligned */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logos/unitree - logo.png')}
            style={styles.unitreeLogo}
            resizeMode="contain"
          />
          
          {/* Sub Logos - Greenity x GIT */}
          <View style={styles.subLogosContainer}>
            <Image
              source={require('../../assets/logos/greenity - logo.png')}
              style={styles.greenityLogo}
              resizeMode="contain"
            />
            
            <Image
              source={require('../../assets/logos/git - logo.png')}
              style={styles.gitLogo}
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
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Mascot */}
            <View style={styles.mascotContainer}>
                <Image
                  source={require('../../assets/mascots/Unitree - Mascot-1.png')}
                  style={styles.mascotImage}
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
                <Text style={styles.rememberMeText}>Remember Me</Text>
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
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Login with Email</Text>
            </TouchableOpacity>

            {/* OR Divider */}
            <Text style={styles.orText}>OR</Text>

            {/* Google Sign In Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
            >
              <Icon name="google" size={20} color="#fff" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
        </Animated.View>
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
  statusBar: {
    height: 20,
  },
  
  // Header Section Styles
  headerSection: {
    backgroundColor: '#B7DDE6',
    paddingBottom: rs(50),
    position: 'relative',
  },
  greenwichLogoContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 2,
  },
  greenwichLogo: {
    width: 150,
    height: 100,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginTop: -5,
    marginLeft: rs(20),
  },
  unitreeLogo: {
    width: 200,
    height: 90,
    marginBottom: -10,
  },
  subLogosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(5),
    marginLeft: rs(15),
  },
  greenityLogo: {
    width: 100,
    height: 40,
  },
  gitLogo: {
    width: 70,
    height: 27,
    marginBottom: rs(5)
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

  // Login Section Styles
  loginSection: {
    flex: 1,
    backgroundColor: '#98D56D',
    borderTopLeftRadius: rs(30),
    borderTopRightRadius: rs(30),
    paddingHorizontal: rs(24),
    paddingTop: rs(32),
    paddingBottom: rs(20),
  },
  loginTitle: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: rs(20),
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
  orText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: rf(16),
    marginBottom: rs(14),
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#FFA79D',
    paddingVertical: rs(16),
    borderRadius: rs(12),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: rs(14),
  },
  googleIcon: {
    marginRight: rs(12),
  },
  googleButtonText: {
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
}); 