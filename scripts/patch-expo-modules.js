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
