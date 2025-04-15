import { useState, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';

export function useBarcodeScanner() {
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const hasScannedRef = useRef(false);
  const router = useRouter();
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || '';

  // 🧠 Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      hasScannedRef.current = false;
    }, [])
  );

  const handleScan = async (data: string) => {
    if (hasScannedRef.current || loading) return;
    hasScannedRef.current = true;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!backendUrl) {
      Toast.show({ type: 'error', text1: 'Missing backend URL' });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/product/${data}`);
      const productData = res.data;

      Toast.show({ type: 'success', text1: 'Product Found' });

      router.replace({
        pathname: '/view-product',
        params: { product: JSON.stringify(productData) },
      });
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      Toast.show({
        type: 'error',
        text1: status === 404 ? 'Product Not Found' : 'Error',
        text2: detail || 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, scanned, handleScan };
}
