import '@expo/metro-runtime';
import { Platform } from 'react-native';
import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

if (Platform.OS !== 'web') {
  try {
    const { registerGlobals } = require('@livekit/react-native');
    registerGlobals();
  } catch (e) {
    console.warn('LiveKit globals registration skipped:', e);
  }
}

registerRootComponent(App);

