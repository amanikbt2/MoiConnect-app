import { Platform } from 'react-native';

const RENDER_BACKEND_URL = 'https://moiconnect.onrender.com';
const LOCAL_BACKEND_PORT = '5000';

const getDynamicHost = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const isLocal =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.');

      if (isLocal) {
        return `${protocol}//${hostname}:${LOCAL_BACKEND_PORT}`;
      }
      return RENDER_BACKEND_URL;
    }
    return `http://localhost:${LOCAL_BACKEND_PORT}`;
  }

  // Native Android / iOS
  if (__DEV__) {
    return `http://10.0.2.2:${LOCAL_BACKEND_PORT}`;
  }
  return RENDER_BACKEND_URL;
};

export const config = {
  get apiUrl() {
    return process.env.EXPO_PUBLIC_API_URL || `${getDynamicHost()}/api/v1`;
  },
  get socketUrl() {
    return process.env.EXPO_PUBLIC_SOCKET_URL || getDynamicHost();
  },
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
  }
};
