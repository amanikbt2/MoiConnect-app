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
const DEFAULT_GOOGLE_CLIENT_ID = '1036847426840-opk53svav057jvhjf3qpt4lbebskb716.apps.googleusercontent.com';

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

  const activeClientId = clientId || config.google.webClientId || DEFAULT_GOOGLE_CLIENT_ID;

  useEffect(() => {
    loadSavedClientId();
    checkWebOAuthRedirect();
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

  const checkWebOAuthRedirect = async () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const fullUrl = window.location.href;
    if (fullUrl.includes('access_token=') || fullUrl.includes('id_token=')) {
      setLoading(true);
      try {
        const hash = window.location.hash ? window.location.hash.substring(1) : window.location.search.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token') || undefined;
        const idToken = params.get('id_token') || undefined;

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

        // Clean URL fragment so reload doesn't re-trigger
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
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
          onError(res.error || 'Google login failed.');
        }
      } catch (err: any) {
        onError(err.message || 'Google OAuth callback error.');
      } finally {
        setLoading(false);
      }
    }
  };

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
      onError('Google sign-in encountered an error.');
    } else {
      setLoading(false);
    }
  };

  const handlePress = async () => {
    setLoading(true);

    // On Web: perform a full-page normal tab redirect (NOT a popup window)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const redirectUri = window.location.origin + window.location.pathname;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        activeClientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=profile%20email&prompt=select_account`;
      
      window.location.href = authUrl;
      return;
    }

    try {
      if (promptAsync) {
        const res = await promptAsync();
        if (res?.type !== 'success') {
          setLoading(false);
        }
      } else {
        // Fallback for native devices
        const res = await googleLogin();
        if (res.success) {
          onSuccess();
        } else {
          onError(res.error || 'Google sign-in failed.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      onError(err.message || 'Could not launch Google Sign-In.');
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
