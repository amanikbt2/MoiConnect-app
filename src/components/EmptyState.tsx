import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  message?: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, message, icon = '📂' }) => {
  const { isDark, colors } = useTheme();
  const displaySubtitle = subtitle || message;
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, isDark && { color: colors.text }]}>{title}</Text>
      {displaySubtitle && <Text style={[styles.subtitle, isDark && { color: colors.mutedText }]}>{displaySubtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 42,
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  }
});
