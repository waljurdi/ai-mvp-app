import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import { useNavigation } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';

import LoadingOverlay from '../components/LoadingOverlay';
import theme from '../constants/theme';

export default function AddProduct() {
  const router = useRouter();
  const navigation = useNavigation();
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || '';
  const params = useLocalSearchParams();

  const [barcode, setBarcode] = useState(params?.scannedBarcode ?? '');
  const [frontImageUri, setFrontImageUri] = useState<{ uri: string; sizeInKB: string } | null>(null);
  const [backImageUri, setBackImageUri] = useState<{ uri: string; sizeInKB: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async (type: 'front' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need access to your photos.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const info = await FileSystem.getInfoAsync(uri);
      const sizeInKB = info.size ? (info.size / 1024).toFixed(1) : 'N/A';

      const image = { uri, sizeInKB };

      type === 'front' ? setFrontImageUri(image) : setBackImageUri(image);
    }
  };

  const handleUpload = async () => {
    if (!barcode.trim()) {
      Toast.show({ type: 'error', text1: 'Barcode Required' });
      return;
    }
    if (!frontImageUri || !backImageUri) {
      Toast.show({ type: 'error', text1: 'Please select both images' });
      return;
    }

    try {
      setUploading(true);
      Toast.show({ type: 'info', text1: 'Uploading...' });

      const formData = new FormData();
      formData.append('barcode', barcode);
      formData.append('front_image', {
        uri: frontImageUri.uri,
        name: 'front.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('back_image', {
        uri: backImageUri.uri,
        name: 'back.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${backendUrl}/add-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const text = await response.text();
      const data = (() => {
        try { return JSON.parse(text); } catch { return { detail: text }; }
      })();

      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Product uploaded!' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: data.detail });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Add a New Product</Text>
          <Text style={styles.description}>Enter the barcode and upload clear front and back images.</Text>

          {/* Barcode Input */}
          <View style={styles.barcodeWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter barcode"
              keyboardType="numeric"
              value={barcode}
              onChangeText={setBarcode}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/(modals)/scan-barcode', params: { returnTo: '/add-product' } })
              }
            >
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>

          {/* Front Image */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>Front Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => handlePickImage('front')}>
              <Text style={styles.buttonText}>
                {frontImageUri ? 'Change Front Image' : 'Select Front Image'}
              </Text>
            </TouchableOpacity>
            {frontImageUri && (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: frontImageUri.uri }} style={styles.smallImagePreview} />
                <Text style={styles.imageInfo}>Front image • {frontImageUri.sizeInKB} KB</Text>
              </View>
            )}
          </View>

          {/* Back Image */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>Back Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => handlePickImage('back')}>
              <Text style={styles.buttonText}>
                {backImageUri ? 'Change Back Image' : 'Select Back Image'}
              </Text>
            </TouchableOpacity>
            {backImageUri && (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: backImageUri.uri }} style={styles.smallImagePreview} />
                <Text style={styles.imageInfo}>Back image • {backImageUri.sizeInKB} KB</Text>
              </View>
            )}
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.uploadButton, uploading && { opacity: 0.6 }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={theme.colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Upload Product</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: theme.fonts.heading * 1.3,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fonts.text,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  barcodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    width: '100%',
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.inputBackground || theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.fonts.text,
    color: theme.colors.text,
  },
  cameraIcon: {
    fontSize: 22,
    padding: theme.spacing.sm,
    color: theme.colors.placeholder,
  },
  imageSection: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: theme.fonts.subheading,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  imagePicker: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    ...theme.shadow,
  },
  previewWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  smallImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
    resizeMode: 'cover',
  },
  imageInfo: {
    fontSize: theme.fonts.text,
    color: theme.colors.text,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadow,
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
    fontWeight: '600',
  },
});
