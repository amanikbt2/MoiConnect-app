import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { AppleIcon, ArrowLeftIcon } from '../../src/components/Icons';
import { GoogleAuthButton } from '../../src/components/GoogleAuthButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, googleLogin } = useAuth();
  const router = useAppNavigation();

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    if (provider === 'Apple') {
      router.replace('/(tabs)');
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail('dev@gmail.com');
    setPassword('spiderman');
    setError(null);
    setLoading(true);

    const res = await login({ email: 'dev@gmail.com', password: 'spiderman' });
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setError(res.error || 'Admin login failed.');
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

  const handleBack = () => {
    try {
      if (router.canGoBack && router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
        <ArrowLeftIcon size={20} color="#0f172a" />
      </TouchableOpacity>

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
        <View style={styles.googleWrapper}>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
          </View>
          <GoogleAuthButton
            googleLogin={googleLogin}
            onSuccess={() => router.replace('/(tabs)')}
            onError={(err) => setError(err)}
          />
        </View>

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

      {/* Quick Demo Admin Sign In Banner */}
      <TouchableOpacity
        style={styles.demoAdminBtn}
        activeOpacity={0.85}
        onPress={handleQuickAdminLogin}
      >
        <View style={styles.demoAdminBadge}>
          <Text style={styles.demoAdminBadgeText}>ADMIN DEMO</Text>
        </View>
        <Text style={styles.demoAdminBtnText}>⚡ 1-Tap Sign In as Admin (dev@gmail.com)</Text>
      </TouchableOpacity>

      {/* Email Option */}
      <View style={styles.form}>
        <Input
          label="Email Address"
          placeholder="dev@gmail.com or student@moi.ac.ke"
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 54,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
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
  googleWrapper: {
    position: 'relative',
    width: '100%',
    marginTop: 8
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: 14,
    backgroundColor: '#15803d',
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 8,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  recommendedBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#15803d',
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
  demoAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8
  },
  demoAdminBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  demoAdminBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  demoAdminBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b'
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

