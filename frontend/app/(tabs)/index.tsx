import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import LoadingOverlay from '../../components/LoadingOverlay';
import theme from '../../constants/theme';

export default function Index() {
  const router = useRouter();
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
    return (
      <View style={styles.centered}>
        <Text style={styles.noAccessText}>
          No access to camera. Please enable camera permission in settings.
        </Text>
      </View>
    );
  }

  const handlePress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />

      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>What would you like to do today?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(modals)/scanner')}
      >
        <Text style={styles.buttonText}>📷 Scan a Product</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          handlePress(() =>
            Toast.show({
              type: 'info',
              text1: 'Coming Soon',
              text2: 'Search feature is not implemented yet.',
            })
          )
        }
      >
        <Text style={styles.buttonText}>🔍 Search a Product</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress(() => navigation.navigate('add-product' as never))}
      >
        <Text style={styles.buttonText}>➕ Add a New Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  noAccessText: {
    fontSize: theme.fonts.text,
    color: theme.colors.text,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.fonts.heading * 1.2,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.subheading,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 14,
    marginBottom: theme.spacing.md,
    width: screenWidth * 0.9,
    alignItems: 'center',
    ...theme.shadow,
  },
  buttonText: {
    fontSize: theme.fonts.text,
    color: theme.colors.textLight,
  },
});
