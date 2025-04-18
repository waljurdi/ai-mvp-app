// Handles camera + visuals + animation
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { supportedBarcodeTypes } from '../constants/barcodeTypes';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.8;
const SIDE_WIDTH = (width - FRAME_SIZE) / 2;
const CORNER_SIZE = 30;
const LINE_THICKNESS = 4;

export default function Scanner({ scanned, handleBarCodeScanned, loading, goBack }) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (!loading && !scanned) {
      startScanLineAnimation();
    } else {
      scanLineAnim.stopAnimation();
    }
  }, [loading, scanned]);

  useEffect(() => {
    if (scanned) {
      triggerFlash();
    }
  }, [scanned]);

  const startScanLineAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const triggerFlash = () => {
    setShowFlash(true);
    flashAnim.setValue(0.8);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setShowFlash(false));
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - LINE_THICKNESS],
  });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: supportedBarcodeTypes }}
      >
        {/* Flash animation */}
        {showFlash && (
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />
        )}

        {/* Overlay frame */}
        <View style={styles.overlay}>
          <View style={[styles.side, { flex: 1 }]} />
          <View style={styles.middleRow}>
            <View style={styles.side} />
            <View style={styles.frame}>
              {/* Corner highlights */}
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />

              {/* Animated scan line */}
              {!loading && !scanned && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslateY }] },
                  ]}
                />
              )}
            </View>
            <View style={styles.side} />
          </View>
          <View style={[styles.side, { flex: 1 }]} />
        </View>

        {/* Prompt message */}
        <View style={styles.promptContainer}>
          <Text style={styles.scanPrompt}>
            {loading ? 'Processing...' : 'Align the barcode within the frame'}
          </Text>
          {loading && <ActivityIndicator size="large" color={theme.colors.textLight} style={styles.loadingIndicator} />}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  side: {
    backgroundColor: theme.colors.overlay,
    width: SIDE_WIDTH,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 20,
    borderColor: theme.colors.accent,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: LINE_THICKNESS,
    backgroundColor: theme.colors.accent,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: LINE_THICKNESS,
    borderLeftWidth: LINE_THICKNESS,
    borderColor: theme.colors.accent,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: LINE_THICKNESS,
    borderRightWidth: LINE_THICKNESS,
    borderColor: theme.colors.accent,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: LINE_THICKNESS,
    borderLeftWidth: LINE_THICKNESS,
    borderColor: theme.colors.accent,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: LINE_THICKNESS,
    borderRightWidth: LINE_THICKNESS,
    borderColor: theme.colors.accent,
  },
  promptContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    alignItems: 'center',
  },
  scanPrompt: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.textLight,
  },
});
