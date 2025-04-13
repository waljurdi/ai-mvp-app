import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import theme from '../constants/theme';
import type { ProductInfo } from '../types';

interface RenderResultProps {
  productInfo: ProductInfo | null;
  startScanner: () => void;
  resetFlow: () => void;
}

export default function RenderResult({ productInfo, startScanner, resetFlow }: RenderResultProps) {
  return (
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
}

const styles = StyleSheet.create({
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
