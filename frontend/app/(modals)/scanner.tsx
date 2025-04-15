import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Scanner from '../../components/Scanner';
import LoadingOverlay from '../../components/LoadingOverlay';
import theme from '../../constants/theme';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

export default function ScannerScreen() {
  const navigation = useNavigation();
  const { loading, scanned, handleScan } = useBarcodeScanner();

  return (
    <View style={styles.container}>
      <Scanner
        scanned={scanned}
        handleBarCodeScanned={({ data }) => handleScan(data)}
        loading={loading}
        goBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}
      />
      {loading && <LoadingOverlay message="Checking product..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
