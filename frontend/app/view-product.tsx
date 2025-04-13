import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import theme from '../constants/theme';

export default function ViewProduct() {
  const { product } = useLocalSearchParams();

  // Parse product back from string to object
  const parsedProduct = product ? JSON.parse(product as string) : null;

  if (!parsedProduct) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No product data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Product Found!</Text>

      {parsedProduct?.image_url && (
        <Image
          source={{ uri: parsedProduct.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      )}

      <Text style={styles.text}>Barcode: {parsedProduct.barcode}</Text>

      {parsedProduct?.nutritional_facts && (
        <>
          <Text style={styles.text}>Nutrition Facts:</Text>
          {Object.entries(parsedProduct.nutritional_facts).map(([key, value]) => (
            <Text key={key} style={styles.text}>
              {key}: {String(value)}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: theme.fonts.heading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.fonts.subheading,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
});
