import Constants from 'expo-constants';

// One value drives both the footer and server-side update targeting.
const adminCompareVersion = Constants.expoConfig?.extra?.AdminCompareVersion;

export const APP_VERSION =
  typeof adminCompareVersion === 'string' && adminCompareVersion.trim()
    ? adminCompareVersion.trim()
    : Constants.expoConfig?.version || null;
