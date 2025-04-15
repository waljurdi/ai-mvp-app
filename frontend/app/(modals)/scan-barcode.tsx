import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Scanner from '../../components/Scanner';
import theme from '../../constants/theme';

export default function ScanBarcode() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams();

  const handleScan = ({ data }: { data: string }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Pass scanned barcode back via router param
    router.replace({
      pathname: returnTo as string,
      params: { scannedBarcode: data },
    });
  };

  return (
    <View style={styles.container}>
      <Scanner
        scanned={false}
        handleBarCodeScanned={handleScan}
        loading={false}
        goBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
