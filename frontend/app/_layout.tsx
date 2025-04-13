import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerBackVisible: false }}>
        <Stack.Screen name="(tabs)/index" options={{ title: 'Home' }} />
        <Stack.Screen name="add-product" options={{ title: 'Add Product' }} />
        <Stack.Screen name="view-product" options={{ title: 'View Product' }} />
        <Stack.Screen name="scanner" options={{ title: 'Scan Product' }} />
      </Stack>
      <Toast position="top" visibilityTime={3000} />
    </GestureHandlerRootView>
  );
}
