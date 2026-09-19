import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create<any>({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  success: { backgroundColor: '#dcfce7' },
  successText: { color: '#15803d' },
  warning: { backgroundColor: '#fef9c3' },
  warningText: { color: '#a16207' },
  error: { backgroundColor: '#fee2e2' },
  errorText: { color: '#b91c1c' },
  info: { backgroundColor: '#e0f2fe' },
  infoText: { color: '#0369a1' },
  neutral: { backgroundColor: '#f1f5f9' },
  neutralText: { color: '#475569' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }
});
