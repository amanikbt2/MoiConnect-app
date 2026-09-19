import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function RequestLandlordScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [proofDetails, setProofDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestLandlordStatus } = useAuth();
  const router = useAppNavigation();

  const handleSubmit = async () => {
    if (!idNumber || !proofDetails) {
      setError('Please fill in both National ID and property ownership details.');
      return;
    }

    if (proofDetails.length < 10) {
      setError('Please provide at least 10 characters describing your property or agency.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await requestLandlordStatus({ idNumber, proofDetails });
    setLoading(false);

    if (res.success) {
      Alert.alert(
        'Request Submitted',
        'Your landlord verification request has been submitted. An administrator will review your application.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      setError(res.error || 'Submission failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Apply for Landlord Account</Text>
        <Text style={styles.subtitle}>
          Landlord accounts are verified by administrators before publishing rental listings to protect students.
        </Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <Input
          label="National ID / Registration No *"
          placeholder="e.g. 12345678"
          value={idNumber}
          onChangeText={setIdNumber}
        />

        <Input
          label="Property Ownership / Agency Details *"
          placeholder="Specify property locations, estate name, or agency registration..."
          value={proofDetails}
          onChangeText={setProofDetails}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <Button
          title="Submit Verification Application"
          onPress={handleSubmit}
          loading={loading}
          style={styles.btn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
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
  form: {
    width: '100%'
  },
  btn: {
    marginTop: 16
  }
});
