import '@expo/metro-runtime';
import { Platform } from 'react-native';
import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes('"textShadow*" style props are deprecated') ||
      msg.includes('props.pointerEvents is deprecated') ||
      msg.includes('[expo-notifications]')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

if (Platform.OS !== 'web') {
  try {
    const { registerGlobals } = require('@livekit/react-native');
    registerGlobals();
  } catch (e) {
    console.warn('LiveKit globals registration skipped:', e);
  }
}

registerRootComponent(App);
