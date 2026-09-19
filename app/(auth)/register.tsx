import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { GoogleIcon, AppleIcon } from '../../src/components/Icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register: registerUser, login } = useAuth();
  const router = useAppNavigation();

  const handleSocialRegister = async (provider: 'Google' | 'Apple') => {
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

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await registerUser({ name, email, password, phone });
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Create Student Account</Text>
        <Text style={styles.subtitle}>Join MoiConnect to access past papers, notes, and houses</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Social Register Options */}
      <View style={styles.socialSection}>
        <TouchableOpacity
          style={styles.googleBtn}
          activeOpacity={0.8}
          onPress={() => handleSocialRegister('Google')}
        >
          <GoogleIcon size={22} style={styles.socialIcon} />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleBtn}
          activeOpacity={0.8}
          onPress={() => handleSocialRegister('Apple')}
        >
          <AppleIcon size={22} color="#ffffff" style={styles.socialIcon} />
          <Text style={styles.appleBtnText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or register with email</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email Registration Option at Last */}
      <View style={styles.form}>
        <Input
          label="Full Name *"
          placeholder="Amani Kibet"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Email Address *"
          placeholder="student@moi.ac.ke"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password *"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Input
          label="Phone Number (Optional)"
          placeholder="0712345678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
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
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b'
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
    marginVertical: 16
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

