import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

export default function Settings() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'This feature would export your data to CSV or PDF format.'
    );
  };

  const handleBackup = () => {
    Alert.alert(
      'Backup Data',
      'This feature would backup your data to cloud storage.'
    );
  };

  const handlePasswordReset = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'New passwords do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);

    try {
      const axios = (await import('axios')).default;
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Toast.show({
          type: 'info',
          text1: 'Not Logged In',
          text2: 'Please login first to change password',
        });
        setShowPasswordModal(false);
        return;
      }

      await axios.put(
        `${API_URL}/api/auth/reset-password`,
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password changed successfully',
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'Failed to change password',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const axios = (await import('axios')).default;
              const token = await AsyncStorage.getItem('authToken');
              
              if (token) {
                await axios.post(`${API_URL}/api/auth/logout`, {}, {
                  headers: { Authorization: `Bearer ${token}` },
                });
              }
              
              // Clear token from storage
              await AsyncStorage.removeItem('authToken');
              
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been logged out successfully',
              });
            } catch (error) {
              console.error('Logout error:', error);
              // Still clear token even if API call fails
              await AsyncStorage.removeItem('authToken');
              
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been logged out',
              });
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'FinTrack v1.0\n\nA smart budget planning app with AI-powered features.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/monthly-summary' as any)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="table"
                size={24}
                color="#6C63FF"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Monthly Summary</Text>
              <Text style={styles.settingDescription}>
                View detailed monthly report
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleExport}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="download"
                size={24}
                color="#6C63FF"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Export Data</Text>
              <Text style={styles.settingDescription}>
                Export transactions to CSV or PDF
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleBackup}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="cloud-upload"
                size={24}
                color="#6C63FF"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Backup Data</Text>
              <Text style={styles.settingDescription}>
                Backup your data to cloud storage
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={24}
                color="#6C63FF"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>
                Update your account password
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="logout"
                size={24}
                color="#FF6B6B"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: '#FF6B6B' }]}>Logout</Text>
              <Text style={styles.settingDescription}>
                Sign out of your account
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/privacy-policy' as any)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color="#6C63FF"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>
                How we protect your data
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons
                name="information"
                size={24}
                color="#6C63FF"
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About App</Text>
              <Text style={styles.settingDescription}>Version 1.0.0</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#CCC"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="lightbulb" size={32} color="#FF9800" />
          <Text style={styles.infoTitle}>Features</Text>
          <Text style={styles.infoText}>
            • AI-powered receipt scanning{' \n'}
            • SMS transaction parsing{' \n'}
            • Email bill scanning{' \n'}
            • UPI payment tracking{' \n'}
            • Category-based analytics{' \n'}
            • Bill payment reminders
          </Text>
        </View>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handlePasswordReset}
            >
              <Text style={styles.resetButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
