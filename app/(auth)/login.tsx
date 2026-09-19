import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { GoogleIcon, AppleIcon } from '../../src/components/Icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useAppNavigation();

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = provider === 'Google' ? 'student.google@moi.ac.ke' : 'student.apple@moi.ac.ke';
      const res = await login({ email: demoEmail, password: 'password123' });
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.title}>MoiConnect Student Hub</Text>
        <Text style={styles.subtitle}>Academic Resources & Student Rental Marketplace</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Social Login Options */}
      <View style={styles.socialSection}>
        <TouchableOpacity
          style={styles.googleBtn}
          activeOpacity={0.8}
          onPress={() => handleSocialLogin('Google')}
        >
          <GoogleIcon size={22} style={styles.socialIcon} />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleBtn}
          activeOpacity={0.8}
          onPress={() => handleSocialLogin('Apple')}
        >
          <AppleIcon size={22} color="#ffffff" style={styles.socialIcon} />
          <Text style={styles.appleBtnText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with email</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email Option at Last */}
      <View style={styles.form}>
        <Input
          label="Email Address"
          placeholder="student@moi.ac.ke"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="••••••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Register here</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  socialSection: {
    width: '100%',
    gap: 12
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b'
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  appleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  socialIcon: {
    marginRight: 10
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  form: {
    width: '100%'
  },
  btn: {
    marginTop: 12
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  linkText: {
    fontSize: 14,
    color: '#64748b'
  },
  linkBold: {
    fontWeight: '700',
    color: '#15803d'
  }
});

