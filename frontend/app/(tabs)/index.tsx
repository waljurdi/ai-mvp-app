import React, { useState, useEffect, useRef } from 'react';
import { Text, TextInput, View, Button, StyleSheet, TouchableOpacity, ActivityIndicator, Vibration } from 'react-native';
import axios from 'axios';
import { Camera, CameraView } from 'expo-camera';
import { Alert } from 'react-native';

export default function Index() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [barcodeData, setBarcodeData] = useState('');
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef(null);
  const hasScannedRef = useRef(false);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (hasScannedRef.current) return; // Ignore if already scanned
  
    hasScannedRef.current = true; // Mark as scanned
  
    setScanned(true);
    setBarcodeData(data);
    console.log('Scanned barcode:', data);
  
    Vibration.vibrate(100);
  
    // sendBarcodeToBackend(data);
    await fetchProductDetails(data); // Fetch product details from backend
  };

  const sendBarcodeToBackend = async (barcode) => {
    try {
      setLoading(true);
      const res = await axios.post('https://congenial-eureka-x55w4j4xv7xr26gwr-8000.app.github.dev/echo', { message: barcode });
      setResponse(`Barcode sent: ${res.data.response}`);
    } catch (err) {
      console.error(err);
      setResponse('Error sending barcode to backend');
    } finally {
      setLoading(false);
      // Auto-reset scanner after short delay
      setTimeout(() => {
        setScanned(false);
        setBarcodeData('');
        setResponse('');
        hasScannedRef.current = false; // ✅ Reset the ref so scanner is ready again
      }, 5000); // 1.5 second delay before ready for next scan
    }
  };

  const fetchProductDetails = async (barcode) => {
    try {
      setLoading(true);
      const res = await axios.get(`https://congenial-eureka-x55w4j4xv7xr26gwr-8000.app.github.dev/product/${barcode}`);
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
      // Auto-reset scanner after short delay
      setTimeout(() => {
        setScanned(false);
        setBarcodeData('');
        setResponse('');
        hasScannedRef.current = false; // ✅ Reset the ref so scanner is ready again
      }, 5000); // 5-second delay before ready for next scan
    }
  };

  const sendMessage = async () => {
    try {
      const res = await axios.post('https://congenial-eureka-x55w4j4xv7xr26gwr-8000.app.github.dev/echo', { message });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse('Error connecting to backend');
    }
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
          ref={cameraRef}
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
        <Text style={styles.successText}>✅ Barcode sent successfully!</Text>
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
