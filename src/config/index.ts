import { Platform } from 'react-native';

const getDefaultHost = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:5000`;
    }
    return 'http://localhost:5000';
  }
  return 'http://10.0.2.2:5000';
};

const defaultHost = getDefaultHost();

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || `${defaultHost}/api/v1`,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || defaultHost
};
