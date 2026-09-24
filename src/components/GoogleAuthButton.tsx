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
import { makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        GoogleSignin.configure({
          webClientId: activeClientId,
          offlineAccess: false
        });
      } catch (e) {
        console.warn('GoogleSignin.configure warning:', e);
      }
    }
  }, [activeClientId]);

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

  // Web / AuthSession Fallback Provider
  const redirectUri = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : makeRedirectUri({ preferLocalhost: true });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: activeClientId,
    iosClientId: activeClientId,
    webClientId: activeClientId,
    clientId: activeClientId,
    redirectUri,
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

  const handleNativeGoogleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo: any = await GoogleSignin.signIn();

      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      const user = userInfo?.data?.user || userInfo?.user;

      const res = await googleLogin({
        idToken,
        email: user?.email,
        name: user?.name,
        avatarUrl: user?.photo
      });

      if (res.success) {
        onSuccess();
      } else {
        onError(res.error || 'Google sign-in failed.');
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled account selection drawer
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in operation already in progress
        return;
      } else {
        // Fallback to AuthSession if native drawer is unavailable
        if (promptAsync) {
          const res = await promptAsync();
          if (res?.type !== 'success') {
            setLoading(false);
          }
        } else {
          onError(error.message || 'Could not launch native Google Sign-In.');
        }
      }
    }
  };

  const handlePress = async () => {
    // On Web: use direct standard Google OAuth 2.0 redirect
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setLoading(true);
      const cleanRedirectUri = window.location.origin + window.location.pathname;
      const nonce = Math.random().toString(36).substring(2);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        activeClientId
      )}&redirect_uri=${encodeURIComponent(
        cleanRedirectUri
      )}&response_type=token%20id_token&scope=openid%20profile%20email&prompt=select_account&nonce=${nonce}`;

      window.location.href = authUrl;
      return;
    }

    // On Native Android / iOS: launch official native Android account picker sheet / drawer
    await handleNativeGoogleSignIn();
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
