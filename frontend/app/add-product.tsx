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
} from 'react-native';
import LoadingOverlay from '../components/LoadingOverlay';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useNavigation } from 'expo-router';
import Constants from 'expo-constants';
import theme from '../constants/theme';

export default function AddProduct() {
  const navigation = useNavigation();
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || '';

  const [barcode, setBarcode] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission denied', text2: 'We need access to your photos.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!barcode.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a barcode' });
      return;
    }

    if (!imageUri) {
      Toast.show({ type: 'error', text1: 'Please select an image' });
      return;
    }

    try {
      setUploading(true);
      Toast.show({ type: 'info', text1: 'Uploading product...' });

      const formData = new FormData();
      formData.append('barcode', barcode);
      formData.append('file', {
        uri: imageUri,
        name: 'product.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${backendUrl}/add-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }

      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Product uploaded successfully!' });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Upload failed',
          text2: data.detail || 'Unknown error',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error uploading product',
        text2: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>➕ Add a New Product</Text>
          <Text style={styles.subheading}>Upload a photo of the nutrition label and barcode below.</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter barcode number"
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
            returnKeyType="done"
            placeholderTextColor={theme.colors.placeholder}
          />

          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            <Text style={styles.buttonText}>
              {imageUri ? '📸 Change Image' : '🖼️ Select Product Image'}
            </Text>
          </TouchableOpacity>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          )}

          <TouchableOpacity
            style={[styles.uploadButton, uploading && { opacity: 0.7 }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : '🚀 Upload Product'}
            </Text>
          </TouchableOpacity>

          {uploading && <LoadingOverlay message="Uploading product..." />}
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
  heading: {
    fontSize: theme.fonts.heading * 1.2,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subheading: {
    fontSize: theme.fonts.subheading,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    width: '100%',
    color: theme.colors.text,
  },
  imagePicker: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
    ...theme.shadow,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
    ...theme.shadow,
  },
  backButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    ...theme.shadow,
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    resizeMode: 'cover',
  },
});
