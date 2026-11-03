const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(__dirname, '../node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactEditText.kt');
if (!fs.existsSync(sourcePath)) {
  throw new Error(`[rich-chat-input] ReactEditText.kt not found: ${sourcePath}`);
}

let source = fs.readFileSync(sourcePath, 'utf8');
if (source.includes('mconnect-community-composer')) {
  const legacyWrapperCall = 'InputConnectionCompat.createWrapper(this, baseInputConnection, outAttrs) { content, flags, _ ->';
  if (source.includes(legacyWrapperCall)) {
    source = source.replace(
    'InputConnectionCompat.createWrapper(this, baseInputConnection, outAttrs) { content, flags, _ ->',
    'InputConnectionCompat.createWrapper(baseInputConnection, outAttrs) { content, flags, _ ->'
    );
  }
  const legacyApiGuard = 'if (inputConnection != null && getTag(R.id.view_tag_native_id) == "mconnect-community-composer")';
  if (source.includes(legacyApiGuard)) {
    source = source.replace(legacyApiGuard, 'if (inputConnection != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1 && getTag(R.id.view_tag_native_id) == "mconnect-community-composer")');
  }
  let needsWrite = !source.includes(legacyWrapperCall);
  if (!source.includes('Handler(Looper.getMainLooper()).postDelayed')) {
    const bundleImport = 'import android.os.Bundle\n';
    if (!source.includes(bundleImport)) {
      throw new Error('[rich-chat-input] Could not locate Android imports while updating the installed patch.');
    }
    source = source.replace(bundleImport, `${bundleImport}import android.os.Handler\nimport android.os.Looper\n`);
    const permissionCall = '            content.requestPermission()\n';
    if (!source.includes(permissionCall)) {
      throw new Error('[rich-chat-input] Could not locate the IME permission call while updating the installed patch.');
    }
    source = source.replace(permissionCall, `${permissionCall}            Handler(Looper.getMainLooper()).postDelayed({\n              try { content.releasePermission() } catch (_: Exception) {}\n            }, 15 * 60 * 1000L)\n`);
    needsWrite = true;
  }
  if (needsWrite) fs.writeFileSync(sourcePath, source, 'utf8');
  console.log('[rich-chat-input] React Native rich content support is already installed.');
  process.exit(0);
}

const inputImport = 'import android.view.inputmethod.InputConnection\n';
const bundleImport = 'import android.os.Bundle\n';
const reactImport = 'import com.facebook.react.common.ReactConstants\n';
if (!source.includes(inputImport) || !source.includes(bundleImport) || !source.includes(reactImport)) {
  throw new Error('[rich-chat-input] React Native source layout changed; refusing to patch an unknown version.');
}
source = source.replace(inputImport, `${inputImport}import androidx.core.view.inputmethod.InputConnectionCompat\n`);
source = source.replace(bundleImport, `${bundleImport}import android.os.Handler\nimport android.os.Looper\n`);
source = source.replace(reactImport, `${reactImport}import com.facebook.react.R\n`);

const anchor = '    if (isMultiline && (shouldBlurOnReturn() || shouldSubmitOnReturn())) {\n';
if (!source.includes(anchor)) {
  throw new Error('[rich-chat-input] Could not locate ReactEditText input connection hook.');
}

const richContentHook = [
  '    if (inputConnection != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1 && getTag(R.id.view_tag_native_id) == "mconnect-community-composer") {',
  '      outAttrs.contentMimeTypes = arrayOf("image/*", "video/*")',
  '      val baseInputConnection = checkNotNull(inputConnection)',
  '      inputConnection = InputConnectionCompat.createWrapper(baseInputConnection, outAttrs) { content, flags, _ ->',
  '        val mimeType = content.description.getMimeType(0) ?: return@createWrapper false',
  '        if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {',
  '          return@createWrapper false',
  '        }',
  '        try {',
  '          if ((flags and InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION) != 0) {',
  '            content.requestPermission()',
  '            Handler(Looper.getMainLooper()).postDelayed({',
  '              try { content.releasePermission() } catch (_: Exception) {}',
  '            }, 15 * 60 * 1000L)',
  '          }',
  '          val marker = "[[MCONNECT_MEDIA:${android.net.Uri.encode(content.contentUri.toString())}:${android.net.Uri.encode(mimeType)}]]"',
  '          baseInputConnection.commitText(marker, 1)',
  '        } catch (_: Exception) {',
  '          false',
  '        }',
  '      }',
  '    }',
  ''
].join('\n');
source = source.replace(anchor, `${richContentHook}${anchor}`);
fs.writeFileSync(sourcePath, source, 'utf8');
console.log('[rich-chat-input] Added Android keyboard image/video input support to the forum composer.');
