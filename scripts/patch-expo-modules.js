const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt'
);

try {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const target = 'return requestedPermissions.contains(permission)';
    const replacement = 'return requestedPermissions?.contains(permission) == true';
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('[patch-expo-modules] Successfully patched PermissionsService.kt for Kotlin compatibility.');
    } else {
      console.log('[patch-expo-modules] Target pattern already patched or not found.');
    }
  } else {
    console.log('[patch-expo-modules] PermissionsService.kt file not found.');
  }
} catch (err) {
  console.error('[patch-expo-modules] Error patching PermissionsService.kt:', err.message);
}
