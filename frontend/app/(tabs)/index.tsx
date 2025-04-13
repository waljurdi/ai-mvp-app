import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import LoadingOverlay from '../../components/LoadingOverlay';
import theme from '../../constants/theme';

export default function Index() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
          navigation.navigate('scanner' as never);
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      {renderMenu()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
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
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
    textAlign: 'center',
  },
});
