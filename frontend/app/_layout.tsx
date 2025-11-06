import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || 
                        segments[0] === 'add-transaction' ||
                        segments[0] === 'camera' ||
                        segments[0] === 'upi-payments' ||
                        segments[0] === 'sms-parser' ||
                        segments[0] === 'email-parser' ||
                        segments[0] === 'monthly-summary' ||
                        segments[0] === 'privacy-policy';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Redirect to main app if authenticated and on auth screens
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', title: 'Add Transaction' }} />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', title: 'Scan Receipt' }} />
        <Stack.Screen name="upi-payments" options={{ presentation: 'modal', title: 'UPI Payments' }} />
        <Stack.Screen name="sms-parser" options={{ presentation: 'modal', title: 'SMS Parser' }} />
        <Stack.Screen name="email-parser" options={{ presentation: 'modal', title: 'Email Parser' }} />
      </Stack>
      <Toast />
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
