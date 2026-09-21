import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  View,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { GoogleIcon } from './Icons';
import { config } from '../config';

WebBrowser.maybeCompleteAuthSession();

const SAVED_CLIENT_ID_KEY = 'google_oauth_client_id_config';

interface GoogleAuthButtonProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  googleLogin: (payload: {
    idToken?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  googleLogin
}) => {
  const [clientId, setClientId] = useState<string>(
    config.google.webClientId || config.google.androidClientId || ''
  );
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputClientId, setInputClientId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedClientId();
  }, []);

  const loadSavedClientId = async () => {
    try {
      const saved = await SecureStore.getItemAsync(SAVED_CLIENT_ID_KEY);
      if (saved) {
        setClientId(saved);
        setInputClientId(saved);
      }
    } catch (e) {
      // ignore
    }
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: clientId || config.google.androidClientId || 'PLACEHOLDER_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: clientId || config.google.iosClientId || 'PLACEHOLDER_IOS_CLIENT_ID.apps.googleusercontent.com',
    webClientId: clientId || config.google.webClientId || 'PLACEHOLDER_WEB_CLIENT_ID.apps.googleusercontent.com',
    clientId: clientId || config.google.webClientId || 'PLACEHOLDER_CLIENT_ID.apps.googleusercontent.com'
  });

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    if (!response) return;

    if (response.type === 'success') {
      setLoading(true);
      try {
        const { authentication, params } = response;
        const idToken = authentication?.idToken || params?.id_token;
        const accessToken = authentication?.accessToken || params?.access_token;

        let googleUser: any = {};
        if (accessToken) {
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userInfoRes.ok) {
              googleUser = await userInfoRes.json();
            }
          } catch (e) {
            console.warn('Failed to fetch userinfo from Google:', e);
          }
        }

        const res = await googleLogin({
          idToken,
          accessToken,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture
        });

        if (res.success) {
          onSuccess();
        } else {
          onError(res.error || 'Google authentication failed on server.');
        }
      } catch (err: any) {
        onError(err.message || 'Google login error.');
      } finally {
        setLoading(false);
      }
    } else if (response.type === 'error') {
      onError('Google sign-in was cancelled or encountered an error.');
    }
  };

  const handlePress = async () => {
    if (!clientId && !config.google.webClientId && !config.google.androidClientId) {
      // Open credentials configuration modal if no Client ID set yet
      setShowConfigModal(true);
      return;
    }

    try {
      setLoading(true);
      const res = await promptAsync();
      if (res?.type !== 'success') {
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      onError(err.message || 'Could not launch Google Sign-In prompt.');
    }
  };

  const saveClientIdAndContinue = async () => {
    if (!inputClientId.trim()) {
      Alert.alert('Missing Client ID', 'Please enter your Google OAuth Client ID.');
      return;
    }
    const cleanId = inputClientId.trim();
    try {
      await SecureStore.setItemAsync(SAVED_CLIENT_ID_KEY, cleanId);
    } catch (e) {
      // ignore
    }
    setClientId(cleanId);
    setShowConfigModal(false);
    
    // Launch Google OAuth
    setTimeout(() => {
      promptAsync();
    }, 300);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.googleBtn}
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#0f172a" size="small" />
        ) : (
          <>
            <GoogleIcon size={20} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Modal to configure ready Google Credentials */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔑 Enter Google Client ID</Text>
            <Text style={styles.modalSub}>
              Paste your Google OAuth Client ID (from Google Cloud Console) to activate live Google Sign-In:
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. 123456789-xxx.apps.googleusercontent.com"
              placeholderTextColor="#94a3b8"
              value={inputClientId}
              onChangeText={setInputClientId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfigModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveClientIdAndContinue}>
                <Text style={styles.saveBtnText}>Save & Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  modalSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 18
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#15803d'
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  }
});
