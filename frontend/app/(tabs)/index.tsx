import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import Scanner from '../../components/Scanner';
import LoadingOverlay from '../../components/LoadingOverlay';
import theme from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Index() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [mode, setMode] = useState<'menu' | 'scanner' | 'result'>('menu');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const hasScannedRef = useRef(false);
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || '';

  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    Animated.timing(translateAnim, {
      toValue: modeToValue(mode),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  const modeToValue = (mode: 'menu' | 'scanner' | 'result') => {
    switch (mode) {
      case 'menu':
        return 0;
      case 'scanner':
        return -SCREEN_WIDTH;
      case 'result':
        return -SCREEN_WIDTH * 2;
      default:
        return 0;
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (hasScannedRef.current) return;

    hasScannedRef.current = true;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!backendUrl) {
      console.error('Backend URL is not set.');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Backend URL is missing.' });
      setProductInfo({ error: true, message: 'Backend URL is missing.' });
      setMode('result');
      return;
    }

    await fetchProductDetails(data);
  };

  interface ProductInfo {
    _id?: string;
    barcode?: string;
    image_url?: string;
    nutritional_facts?: Record<string, any>;
    error?: boolean;
    message?: string;
  }

  const fetchProductDetails = async (barcode: string): Promise<void> => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/product/${barcode}`);
  
      const productData = res.data;
      Toast.show({ type: 'success', text1: 'Product Found' });
      setProductInfo(productData);
      setMode('result');
  
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
    
      if (status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Product Not Found',
          text2: detail || 'The product is not in the database.',
        });
        setProductInfo({ error: true, message: 'Product not found.' });
      } else {
        console.error(err);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: detail || 'Failed to fetch product details.',
        });
        setProductInfo({ error: true, message: 'Error fetching product details.' });
      }
    
      setMode('result');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setScanned(false);
    setProductInfo(null);
    hasScannedRef.current = false;
    setMode('menu');
  };

  const startScanner = () => {
    setScanned(false);
    hasScannedRef.current = false;
    setLoading(false);
    setMode('scanner');
  };

  if (hasPermission === null) {
    return <LoadingOverlay message="Requesting camera permission..." />;
  }

  if (hasPermission === false) {
    return <Text>No access to camera. Please enable camera permission in settings.</Text>;
  }

  const renderMenu = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.heading}>What would you like to do?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          startScanner();
        }}
      >
        <Text style={styles.buttonText}>📷 Scan a Product</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Toast.show({ type: 'info', text1: 'Search feature not implemented yet!' });
        }}
      >
        <Text style={styles.buttonText}>🔍 Search a Product</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('add-product' as never)}
      >
        <Text style={styles.buttonText}>➕ Add Product</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => (
    <View style={styles.centeredContainer}>
      {productInfo?.error ? (
        <Text style={styles.errorText}>❌ {productInfo.message}</Text>
      ) : (
        <>
          <Text style={styles.heading}>✅ Product Found!</Text>
  
          {productInfo?.image_url && (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={styles.resultText}>Image:</Text>
              <Image
                source={{ uri: productInfo.image_url }}
                style={{ width: 200, height: 200, borderRadius: 8 }}
                resizeMode="contain"
              />
            </View>
          )}
  
          <Text style={styles.resultText}>Barcode: {productInfo?.barcode}</Text>
  
          {productInfo?.nutritional_facts && (
            <>
              <Text style={styles.resultText}>Nutrition Facts:</Text>
              {Object.entries(productInfo.nutritional_facts).map(([key, value]) => (
                <Text key={key} style={styles.resultText}>
                  {key}: {String(value)}
                </Text>
              ))}
            </>
          )}
        </>
      )}
  
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          startScanner();
        }}
      >
        <Text style={styles.buttonText}>📷 Scan Another Product</Text>
      </TouchableOpacity>
  
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          resetFlow();
        }}
      >
        <Text style={styles.buttonText}>🏠 Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
  

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateX: translateAnim }],
          },
        ]}
      >
        {/* Menu */}
        <View style={styles.page}>{renderMenu()}</View>

        {/* Scanner */}
        <View style={styles.page}>
          <Scanner
            scanned={scanned}
            handleBarCodeScanned={handleBarCodeScanned}
            loading={loading}
            goBack={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              resetFlow();
            }}
          />
          {loading && <LoadingOverlay message="Checking product..." />}
        </View>

        {/* Result */}
        <View style={styles.page}>{renderResult()}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  animatedContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  heading: {
    fontSize: theme.fonts.heading,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginVertical: theme.spacing.sm,
    width: '90%',
    ...theme.shadow,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginVertical: theme.spacing.sm,
    width: '90%',
    ...theme.shadow,
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
    textAlign: 'center',
  },
  resultText: {
    fontSize: theme.fonts.subheading,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text,
  },
  errorText: {
    fontSize: theme.fonts.subheading,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.error,
  },
});
