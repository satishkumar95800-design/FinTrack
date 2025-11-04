import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', title: 'Add Transaction' }} />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', title: 'Scan Receipt' }} />
        <Stack.Screen name="upi-payments" options={{ presentation: 'modal', title: 'UPI Payments' }} />
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  );
}
