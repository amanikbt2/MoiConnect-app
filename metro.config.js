const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const metroResolver = require('metro-resolver');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Exclude root export dist directory from Metro watcher to prevent watching export build output
config.resolver.blockList = [
  new RegExp('^' + path.resolve(__dirname, 'dist').replace(/\\/g, '\\\\') + '.*'),
];

// Fix react-native-svg web resolution bug for extractTransform without recursive resolveRequest call
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('extractTransform') ||
    (context.originModulePath && context.originModulePath.includes('react-native-svg') && moduleName === './lib/extract/extractTransform')
  ) {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/react-native-svg/src/lib/extract/extractTransform.ts'),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  // Handle react-native -> react-native-web alias on web platform
  if (platform === 'web' && moduleName === 'react-native') {
    return metroResolver.resolve(context, 'react-native-web', platform);
  }

  return metroResolver.resolve(context, moduleName, platform);
};

module.exports = config;

