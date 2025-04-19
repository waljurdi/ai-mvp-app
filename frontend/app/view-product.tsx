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

      <View style={styles.headerRow}>
        {parsedProduct?.image_url && (
          <Image
            source={{ uri: parsedProduct.image_url }}
            style={styles.smallImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{parsedProduct.product_name}</Text>
          <Text style={styles.productDescription}>{parsedProduct.product_description}</Text>
          <Text style={styles.productBrand}>{parsedProduct.brand}</Text>
          <Text style={styles.barcodeText}>Barcode: {parsedProduct.barcode}</Text>
        </View>
      </View>

      {parsedProduct?.nutritional_facts && (
        <View style={styles.infoCard}>
          <View style={styles.nutritionHeader}>
            <Text style={styles.label}>Nutrition Facts</Text>
            {parsedProduct.nutritional_facts.per && (
              <Text style={styles.portionSizeText}>per {parsedProduct.nutritional_facts.per}</Text>
            )}
          </View>
          {Object.entries(parsedProduct.nutritional_facts)
            .filter(([key]) => key !== 'per')
            .map(([key, value]) => (
              <View key={key} style={styles.factRow}>
                <Text style={styles.factKey}>{key}</Text>
                <Text style={styles.factValue}>{String(value)}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Country of Origin Section */}
      {parsedProduct.country_of_origin && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Other Details</Text>
          <View style={styles.factRow}>
            <Text style={styles.factKey}>Country of Origin</Text>
            <Text style={styles.factValue}>{parsedProduct.country_of_origin}</Text>
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  smallImage: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.3,
    borderRadius: 8,
    marginRight: theme.spacing.md,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: theme.fonts.subheading,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: theme.fonts.text,
    color: theme.colors.textSecondary || '#666',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: theme.fonts.text,
    color: theme.colors.text,
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 12,
    color: theme.colors.textSecondary || '#666',
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
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  portionSizeText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.textSecondary || '#666',
  },
});
