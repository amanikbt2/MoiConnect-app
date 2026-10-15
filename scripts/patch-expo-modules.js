const fs = require('fs');
const path = require('path');

const possiblePaths = [
  path.resolve(__dirname, '../node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt'),
  path.resolve(process.cwd(), 'node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt')
];

for (const filePath of possiblePaths) {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const target = 'return requestedPermissions.contains(permission)';
      const replacement = 'return requestedPermissions?.contains(permission) == true';
      if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('[patch-expo-modules] Successfully patched PermissionsService.kt at:', filePath);
      } else {
        console.log('[patch-expo-modules] Target pattern already patched at:', filePath);
      }
    }
  } catch (err) {
    console.error('[patch-expo-modules] Error patching PermissionsService.kt:', err.message);
  }
}

const screenStackPaths = [
  path.resolve(__dirname, '../node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStack.kt'),
  path.resolve(process.cwd(), 'node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStack.kt')
];

for (const filePath of screenStackPaths) {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const target = 'drawingOpPool.removeLast()';
      const replacement = 'drawingOpPool.removeAt(drawingOpPool.lastIndex)';
      if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('[patch-expo-modules] Successfully patched ScreenStack.kt at:', filePath);
      } else {
        console.log('[patch-expo-modules] ScreenStack.kt already patched or clean at:', filePath);
      }
    }
  } catch (err) {
    console.error('[patch-expo-modules] Error patching ScreenStack.kt:', err.message);
  }
}
