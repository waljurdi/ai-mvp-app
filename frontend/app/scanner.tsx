import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import Scanner from '../components/Scanner';
import LoadingOverlay from '../components/LoadingOverlay';
import theme from '../constants/theme';

export default function ScannerScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const hasScannedRef = useRef(false);
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || '';

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (hasScannedRef.current) return;

    hasScannedRef.current = true;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!backendUrl) {
      console.error('Backend URL is not set.');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Backend URL is missing.' });
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

      if (status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Product Not Found',
          text2: detail || 'The product is not in the database.',
        });
      } else {
        console.error(err);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: detail || 'Failed to fetch product details.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Scanner
        scanned={scanned}
        handleBarCodeScanned={handleBarCodeScanned}
        loading={loading}
        goBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}
      />
      {loading && <LoadingOverlay message="Checking product..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
