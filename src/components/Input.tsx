import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(({ label, error, style, ...props }, ref) => {
  const { isDark, colors } = useTheme();
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, isDark && { color: colors.text }]}>{label}</Text>}
      <TextInput
        ref={ref}
        style={[styles.input, isDark && { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }, error && styles.inputError, style]}
        placeholderTextColor={isDark ? colors.mutedText : '#94a3b8'}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginVertical: 8
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  inputError: {
    borderColor: '#dc2626'
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
    fontWeight: '500'
  }
});
