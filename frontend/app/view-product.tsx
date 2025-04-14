import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import theme from '../constants/theme';

export default function ViewProduct() {
  const { product } = useLocalSearchParams();

  const parsedProduct = product ? JSON.parse(product as string) : null;

  if (!parsedProduct) {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>No product data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>📦 Product Details</Text>

      {parsedProduct?.image_url && (
        <Image
          source={{ uri: parsedProduct.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.infoCard}>
        <Text style={styles.label}>Barcode</Text>
        <Text style={styles.value}>{parsedProduct.barcode}</Text>
      </View>

      {parsedProduct?.nutritional_facts && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Nutrition Facts</Text>
          {Object.entries(parsedProduct.nutritional_facts).map(([key, value]) => (
            <View key={key} style={styles.factRow}>
              <Text style={styles.factKey}>{key}</Text>
              <Text style={styles.factValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  heading: {
    fontSize: theme.fonts.heading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  image: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.card || '#fff',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
    ...theme.shadow,
  },
  label: {
    fontSize: theme.fonts.subheading,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  value: {
    fontSize: theme.fonts.text,
    color: theme.colors.text,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  factKey: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  factValue: {
    color: theme.colors.text,
  },
});
