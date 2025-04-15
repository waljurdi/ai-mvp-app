import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerBackVisible: false }}>
        {/* Root layout for the app */}
        <Stack.Screen name="(tabs)/index" options={{ title: 'Home' }} />
        <Stack.Screen name="add-product" options={{ title: 'Add Product' }} />
        <Stack.Screen name="view-product" options={{ title: 'View Product' }} />

        {/* Modal screen */}
        <Stack.Screen name="(modals)/scanner" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="(modals)/scan-barcode" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <Toast position="top" visibilityTime={3000} />
    </GestureHandlerRootView>
  );
}
