import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';
import axios from 'axios';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  socialLogin: (provider: string, token: string, email: string, name: string) => Promise<void>;
  biometricLogin: () => Promise<boolean>;
  enableBiometric: (email: string, password: string) => Promise<void>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: () => Promise<boolean>;
  isBiometricAvailable: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      
      if (storedToken) {
        setToken(storedToken);
        
        // Fetch user details
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        
        if (response.data.user) {
          setUser(response.data.user);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);

      // Fetch user details
      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setUser(userResponse.data.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name,
      });

      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);

      // Fetch user details
      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setUser(userResponse.data.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(
          `${API_URL}/api/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local state
      await AsyncStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
  };

  const socialLogin = async (provider: string, socialToken: string, email: string, name: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/social-login`, {
        provider,
        token: socialToken,
        email,
        name,
      });

      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);

      // Fetch user details
      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setUser(userResponse.data.user);
    } catch (error: any) {
      console.error('Social login error:', error);
      throw new Error(error.response?.data?.detail || 'Social login failed');
    }
  };

  const isBiometricAvailable = async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Biometric check error:', error);
      return false;
    }
  };

  const enableBiometric = async (email: string, password: string) => {
    try {
      // Store credentials securely for biometric login
      await AsyncStorage.setItem('biometric_email', email);
      await AsyncStorage.setItem('biometric_password', password);
      await AsyncStorage.setItem('biometric_enabled', 'true');
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw new Error('Failed to enable biometric authentication');
    }
  };

  const disableBiometric = async () => {
    try {
      await AsyncStorage.removeItem('biometric_email');
      await AsyncStorage.removeItem('biometric_password');
      await AsyncStorage.removeItem('biometric_enabled');
    } catch (error) {
      console.error('Disable biometric error:', error);
    }
  };

  const isBiometricEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  };

  const biometricLogin = async (): Promise<boolean> => {
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const enabled = await isBiometricEnabled();
      if (!enabled) {
        return false;
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to FinTrack',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Get stored credentials
        const email = await AsyncStorage.getItem('biometric_email');
        const password = await AsyncStorage.getItem('biometric_password');

        if (email && password) {
          // Login with stored credentials
          await login(email, password);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Biometric login error:', error);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    checkAuth,
    socialLogin,
    biometricLogin,
    enableBiometric,
    disableBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
