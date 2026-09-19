const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Fix react-native-svg web resolution bug for extractTransform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('extractTransform') ||
    (context.originModulePath.includes('react-native-svg') && moduleName === './lib/extract/extractTransform')
  ) {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/react-native-svg/src/lib/extract/extractTransform.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

