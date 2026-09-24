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
  const [key, setKey] = useState(0);

  if (!portal || !visible) return null;

  const handleRefresh = () => {
    setLoading(true);
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
          ) : (
            <View style={styles.nativeFallbackContainer}>
              <Text style={styles.nativeFallbackTitle}>Official Portal Active</Text>
              <Text style={styles.nativeFallbackSub}>
                Tap below to open {portal.title} in your secure browser.
              </Text>
              <TouchableOpacity
                style={styles.openPortalBtn}
                onPress={() => Linking.openURL(portal.url).catch(() => {})}
              >
                <Text style={styles.openPortalBtnText}>Open {portal.title} ↗</Text>
              </TouchableOpacity>
            </View>
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
