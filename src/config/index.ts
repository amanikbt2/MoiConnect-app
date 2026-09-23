import { Platform } from 'react-native';

const getDefaultHost = () => {
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
        return `${protocol}//${hostname}:5000`;
      }
      return `${protocol}//${hostname}`;
    }
    return 'http://localhost:5000';
  }
  return 'http://10.0.2.2:5000';
};

const defaultHost = getDefaultHost();

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || `${defaultHost}/api/v1`,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || defaultHost,
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
  }
};
