import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  
  const { login, socialLogin, biometricLogin, isBiometricAvailable, isBiometricEnabled } = useAuth();

  // Google Sign-In config
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    checkBiometric();
    checkAppleAvailability();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    }
  }, [response]);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    const enabled = await isBiometricEnabled();
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
  };

  const checkAppleAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setAppleAvailable(available);
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const success = await biometricLogin();
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Welcome Back!',
          text2: 'Logged in with biometrics',
        });
        router.replace('/(tabs)');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: 'Biometric authentication failed',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Biometric login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter email and password',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email',
      });
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: 'Logged in successfully',
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Please check your credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    promptAsync();
  };

  const handleGoogleResponse = async (response: any) => {
    if (response?.authentication?.accessToken) {
      setLoading(true);
      try {
        // Fetch user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${response.authentication.accessToken}` },
          }
        );
        const userInfo = await userInfoResponse.json();

        await socialLogin(
          'google',
          response.authentication.accessToken,
          userInfo.email,
          userInfo.name || 'User'
        );

        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'Logged in with Google',
        });

        router.replace('/(tabs)');
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Google sign-in failed',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      setLoading(true);

      const name = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : 'User';

      await socialLogin(
        'apple',
        credential.identityToken || '',
        credential.email || '',
        name
      );

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Logged in with Apple',
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Apple sign-in failed',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="wallet" size={64} color="#6C63FF" />
            </View>
            <Text style={styles.title}>Welcome to FinTrack</Text>
            <Text style={styles.subtitle}>Manage your finances with ease</Text>
          </View>

          {/* Biometric Login */}
          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <MaterialCommunityIcons name="fingerprint" size={32} color="#6C63FF" />
              <Text style={styles.biometricText}>Login with Biometrics</Text>
            </TouchableOpacity>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={loading || !request}
              >
                <MaterialCommunityIcons name="google" size={24} color="#FFF" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              {appleAvailable && (
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="apple" size={24} color="#FFF" />
                  <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account?{' '}
                <Text style={styles.registerLinkHighlight}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
    marginLeft: 12,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB4437',
    borderRadius: 12,
    paddingVertical: 14,
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
  },
  socialButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: '#666',
  },
  registerLinkHighlight: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});