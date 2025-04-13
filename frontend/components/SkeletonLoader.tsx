import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export default function SkeletonLoader() {
  return (
    <SkeletonPlaceholder>
      <View style={styles.container}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </View>
    </SkeletonPlaceholder>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  line: { height: 20, borderRadius: 4, marginBottom: 10, width: '80%' },
});
