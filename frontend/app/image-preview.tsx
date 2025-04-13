import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import theme from '../constants/theme';

export default function ImagePreview() {
  const { imageUri } = useLocalSearchParams();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🖼️ Here's your selected image:</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <Text>No image selected.</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>🔙 Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  image: {
    width: '100%',
    height: 400,
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    width: '90%',
    ...theme.shadow,
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
    textAlign: 'center',
  },
});
