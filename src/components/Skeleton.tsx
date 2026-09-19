import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style
}) => {
  return <View style={[styles.skeleton, { width, height, borderRadius }, style]} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
    opacity: 0.7
  }
});
