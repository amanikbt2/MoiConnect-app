import React from 'react';
import { Platform, Text, View } from 'react-native';
import ContributeScreen from './contribute';

export default function AgentScreen() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const localOnly = Platform.OS === 'web' && (hostname === 'localhost' || hostname === '127.0.0.1');

  if (!localOnly) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' }}>
        <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Agent screen unavailable</Text>
        <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Open this page from the local MConnect web app.</Text>
      </View>
    );
  }

  return <ContributeScreen agentMode />;
}
