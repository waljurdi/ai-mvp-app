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

      const response = await fetch(`${backendUrl}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Product uploaded successfully!' });
        navigation.goBack();
      } else {
        console.error(data);
        Toast.show({ type: 'error', text1: 'Upload failed', text2: data.detail || 'Unknown error' });
      }
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error uploading product', text2: error.message });
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
        <View style={styles.container}>
          <Text style={styles.heading}>Add a New Product</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter product barcode"
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            <Text style={styles.buttonText}>
              {imageUri ? '📸 Image Selected' : '🖼️ Select Product Image'}
            </Text>
          </TouchableOpacity>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={uploading}>
            <Text style={styles.buttonText}>{uploading ? 'Uploading...' : '🚀 Upload Product'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={uploading}>
            <Text style={styles.buttonText}>🔙 Back to Menu</Text>
          </TouchableOpacity>

          {/* ✅ Loading overlay */}
          {uploading && <LoadingOverlay message="Uploading product..." />}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  heading: {
    fontSize: theme.fonts.heading,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  imagePicker: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow,
  },
  backButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadow,
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: theme.spacing.md,
    borderRadius: 8,
  },
});
