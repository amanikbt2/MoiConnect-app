const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages in monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

// 3. Force Metro to resolve monorepo packages correctly
config.resolver.disableHierarchicalLookup = true;

// 4. Ignore temporary dot-files/folders in node_modules from Metro file watcher
config.resolver.blockList = [
  /node_modules[\\\/].*\.plugin-.*/,
  /node_modules[\\\/]\..*/
];

// 5. Fix react-native-svg web resolution bug for extractTransform
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
