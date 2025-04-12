import Constants from 'expo-constants';
import React, { useState, useEffect, useRef } from 'react';
import { Text, TextInput, View, Button, StyleSheet, ActivityIndicator, Vibration, Alert } from 'react-native';
import axios from 'axios';
import { Camera, CameraView } from 'expo-camera';

export default function Index() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [barcodeData, setBarcodeData] = useState('');
  const [loading, setLoading] = useState(false);

  const hasScannedRef = useRef(false);
  const backendUrl = Constants.expoConfig.extra.backendUrl;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (hasScannedRef.current) return;

    hasScannedRef.current = true;
    setScanned(true);
    setBarcodeData(data);
    Vibration.vibrate(100);

    await fetchProductDetails(data);
  };

  const fetchProductDetails = async (barcode) => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/product/${barcode}`);
      
      if (res.data.error) {
        Alert.alert('Product Not Found', 'The scanned product was not found in the database.');
        setResponse('Product not found');
      } else {
        const { name, description } = res.data;
        Alert.alert('Product Found', `Name: ${name}\nDescription: ${description}`);
        setResponse(`Name: ${name}\nDescription: ${description}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch product details from the backend.');
      setResponse('Error fetching product details');
    } finally {
      setLoading(false);
      setTimeout(resetScanner, 5000);
    }
  };

  const sendMessage = async () => {
    try {
      const res = await axios.post(`${backendUrl}/echo`, { message });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse('Error connecting to backend');
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcodeData('');
    setResponse('');
    hasScannedRef.current = false;
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera. Please enable camera permission in settings.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>AI MVP + Barcode Scanner</Text>

      <TextInput
        style={styles.input}
        placeholder="Type your message..."
        onChangeText={setMessage}
        value={message}
      />
      <Button title="Send to AI" onPress={sendMessage} />
      <Text style={styles.response}>{response}</Text>

      <View style={styles.separator} />

      <Text style={styles.subheading}>Barcode Scanner</Text>
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barCodeScannerSettings={{
            barCodeTypes: ['qr', 'code128', 'ean13', 'ean8'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Sending barcode...</Text>
        </View>
      )}

      {barcodeData && !loading && (
        <Text style={styles.barcodeText}>Scanned Barcode: {barcodeData}</Text>
      )}

      {scanned && !loading && (
        <Text style={styles.successText}>✅ Barcode processed successfully!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subheading: { fontSize: 20, marginVertical: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  response: { marginTop: 10, fontSize: 16, color: 'green', textAlign: 'center' },
  separator: { marginVertical: 20, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  scannerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  scanner: { width: '100%', height: 300 },
  loadingContainer: { marginTop: 10, alignItems: 'center' },
  loadingText: { marginTop: 5, fontSize: 16 },
  barcodeText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
  successText: { marginTop: 10, fontSize: 16, color: 'green', textAlign: 'center' },
});
