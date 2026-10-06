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
    }
  }
};
