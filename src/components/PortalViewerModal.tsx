import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Linking
} from 'react-native';
import { ArrowLeftIcon, CloseIcon, RefreshCwIcon } from './Icons';

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

  const handleOpenExternal = () => {
    Linking.openURL(portal.url).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <ArrowLeftIcon color="#ffffff" size={18} />
            <Text style={styles.backBtnText}>Back to App</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {portal.title}
            </Text>
            <View style={styles.domainBadge}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.domainText}>{portal.domain}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleRefresh}
              title="Refresh Page"
              activeOpacity={0.7}
            >
              <RefreshCwIcon color="#ffffff" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleOpenExternal}
              title="Open in External Browser"
              activeOpacity={0.7}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CloseIcon color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Portal Webview / Iframe Body */}
        <View style={styles.body}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#15803d" />
              <Text style={styles.loadingText}>Connecting to {portal.title}...</Text>
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
                onPress={handleOpenExternal}
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
    backgroundColor: '#064e3b'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064e3b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#047857',
    gap: 8
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center'
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2
  },
  lockIcon: {
    fontSize: 10
  },
  domainText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center'
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
  loadingText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700'
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
