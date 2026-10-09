const baseConfig = require('./app.json').expo;

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

module.exports = {
  expo: {
    ...baseConfig,
    version: process.env.MCONNECT_VERSION || baseConfig.version,
    android: {
      ...baseConfig.android,
      versionCode: numberFromEnv('MCONNECT_ANDROID_VERSION_CODE', baseConfig.android.versionCode)
    },
    ios: {
      ...baseConfig.ios,
      buildNumber: String(process.env.MCONNECT_IOS_BUILD_NUMBER || baseConfig.ios.buildNumber)
    },
    extra: {
      ...(baseConfig.extra || {}),
      eas: {
        ...(baseConfig.extra?.eas || {}),
        projectId: process.env.EAS_PROJECT_ID || 'b2e599b0-7be8-4fad-bdaf-330db9d6c1a5'
      }
    }
  }
};
