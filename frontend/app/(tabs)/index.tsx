import React, { useState, useEffect, useRef } from 'react';
import { Text, TextInput, View, Button, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Camera, CameraView } from 'expo-camera';

export default function Index() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [barcodeData, setBarcodeData] = useState('');

  const cameraRef = useRef(null);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setBarcodeData(data);
    console.log('Scanned barcode:', data);
  
    setTimeout(() => {
      alert(`Scanned: ${data}`);
    }, 100);
  };

  const sendMessage = async () => {
    try {
      const res = await axios.post('https://solid-space-tribble-v66v5x5wq9jwf7g9-8000.app.github.dev/echo', { message });
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
      <Text style={styles.response}>Response: {response}</Text>

      <View style={styles.separator} />

      <Text style={styles.subheading}>Barcode Scanner</Text>
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barCodeScannerSettings={{
            barCodeTypes: ['qr', 'code128', 'ean13', 'ean8'], // Customize as needed
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          ref={cameraRef}
        />
      </View>

      {scanned && (
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
          <Text style={styles.scanButtonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}

      {barcodeData ? <Text style={styles.barcodeText}>Scanned Barcode: {barcodeData}</Text> : null}
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
  scanButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  scanButtonText: { color: '#fff', fontSize: 16 },
  barcodeText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
});
