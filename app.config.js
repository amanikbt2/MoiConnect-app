const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [...(config.plugins || []), 'expo-splash-screen'],
    version: process.env.MCONNECT_VERSION || config.version,
    android: {
      ...(config.android || {}),
      versionCode: numberFromEnv('MCONNECT_ANDROID_VERSION_CODE', config.android?.versionCode)
    },
    ios: {
      ...(config.ios || {}),
      buildNumber: String(process.env.MCONNECT_IOS_BUILD_NUMBER || config.ios?.buildNumber)
    },
    extra: {
      ...(config.extra || {}),
      ...(process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId
        ? {
            eas: {
              ...(config.extra?.eas || {}),
              ...(process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : {})
            }
          }
        : {})
    }
  };
};
