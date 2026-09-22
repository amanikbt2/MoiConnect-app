import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { GoogleIcon } from './Icons';
import { config } from '../config';

WebBrowser.maybeCompleteAuthSession();

const SAVED_CLIENT_ID_KEY = 'google_oauth_client_id_config';
const DEFAULT_GOOGLE_CLIENT_ID = '603126830727-v90nkg959l8f6h9t8l8n14i7i1n7o2b3.apps.googleusercontent.com';

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
    config.google.webClientId || config.google.androidClientId || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedClientId();
  }, []);

  const loadSavedClientId = async () => {
    try {
      const saved = await SecureStore.getItemAsync(SAVED_CLIENT_ID_KEY);
      if (saved) {
        setClientId(saved);
      }
    } catch (e) {
      // ignore
    }
  };

  const activeClientId = clientId || config.google.webClientId || DEFAULT_GOOGLE_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: activeClientId,
    iosClientId: activeClientId,
    webClientId: activeClientId,
    clientId: activeClientId,
    extraParams: {
      prompt: 'select_account'
    }
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
      setLoading(false);
      onError('Google sign-in was cancelled or encountered an error.');
    } else {
      setLoading(false);
    }
  };

  const handlePress = async () => {
    setLoading(true);
    try {
      // Launch standard Google Account Chooser sheet directly
      if (promptAsync) {
        const res = await promptAsync();
        if (res?.type !== 'success') {
          setLoading(false);
        }
      } else {
        // Fallback WebBrowser OAuth prompt with prompt=select_account
        const redirectUrl = WebBrowser.makeRedirectUri();
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          activeClientId
        )}&response_type=token&scope=profile%20email&redirect_uri=${encodeURIComponent(
          redirectUrl
        )}&prompt=select_account`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          const hashParams = result.url.split('#')[1] || result.url.split('?')[1] || '';
          const params = new URLSearchParams(hashParams);
          const accessToken = params.get('access_token');
          const idToken = params.get('id_token');

          let googleUser: any = {};
          if (accessToken) {
            const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userInfoRes.ok) {
              googleUser = await userInfoRes.json();
            }
          }

          const res = await googleLogin({
            idToken: idToken || undefined,
            accessToken: accessToken || undefined,
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture
          });

          if (res.success) {
            onSuccess();
          } else {
            onError(res.error || 'Google login failed.');
          }
        } else {
          setLoading(false);
        }
      }
    } catch (err: any) {
      setLoading(false);
      onError(err.message || 'Could not launch Google Sign-In chooser.');
    }
  };

  return (
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
  }
});
