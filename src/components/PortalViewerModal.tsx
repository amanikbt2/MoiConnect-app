import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeftIcon, CloseIcon, RefreshCwIcon } from './Icons';
import { BrandLoader } from './BrandLoader';

export interface PortalConfig {
  title: string;
  url: string;
  domain: string;
  badgeColor?: string;
}

interface PortalViewerModalProps {
  visible: boolean;
  portal: PortalConfig | null;
  onClose: () => void;
}

export const PortalViewerModal: React.FC<PortalViewerModalProps> = ({
  visible,
  portal,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  if (!portal || !visible) return null;

  const handleRefresh = () => {
    setLoading(true);
    setLoadError(null);
    setKey((prev) => prev + 1);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <ArrowLeftIcon color="#ffffff" size={13} />
            <Text style={styles.backBtnText}>Back to App</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {portal.title}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <RefreshCwIcon color="#ffffff" size={15} />
          </TouchableOpacity>
        </View>

        {/* Portal Webview / Iframe Body */}
        <View style={styles.body}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <BrandLoader message={`Loading ${portal.title}...`} size={76} />
            </View>
          )}

          {Platform.OS === 'web' ? (
            <iframe
              key={key}
              src={portal.url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#ffffff'
              }}
              title={portal.title}
              onLoad={() => setLoading(false)}
              allow="camera; microphone; geolocation"
            />
          ) : loadError ? (
            <View style={styles.errorState}>
              <Text style={styles.errorTitle}>Portal could not be loaded securely</Text>
              <Text style={styles.errorText}>The certificate for {portal.domain} is not trusted by this device's in-app browser.</Text>
              <TouchableOpacity style={styles.browserButton} onPress={() => Linking.openURL(portal.url)} activeOpacity={0.8}>
                <Text style={styles.browserButtonText}>Open in Phone Browser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh} activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              key={key}
              source={{ uri: portal.url }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onLoadEnd={() => { setLoading(false); setLoadError(null); }}
              onError={() => { setLoading(false); setLoadError('Portal certificate error'); }}
              allowFileAccess={true}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              originWhitelist={['*']}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064e3b',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064e3b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#047857',
    gap: 8
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)'
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  refreshIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#ffffff'
  },
  errorTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10
  },
  errorText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20
  },
  browserButton: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginBottom: 10
  },
  browserButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 9
  },
  retryButtonText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '800'
  },
  body: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 12
  },
  nativeFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  nativeFallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  nativeFallbackSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20
  },
  openPortalBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12
  },
  openPortalBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15
  }
});
